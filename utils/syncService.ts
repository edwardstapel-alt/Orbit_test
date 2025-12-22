// Automatic Sync Service
// Handles automatic synchronization between app and Google services

import { 
  getAccessToken, 
  isGoogleConnected,
  exportTaskToGoogleTasks,
  exportTimeSlotToCalendar,
  exportTaskToCalendar,
  exportGoalDeadlineToCalendar,
  importGoogleTasks,
  detectDuplicateTasks,
  mergeTasks,
  getGoogleTaskLists,
  mapGoogleTaskToAppTask
} from './googleSync';
import { Task, TimeSlot, Objective, Conflict, ConflictResolution, ConflictResolutionConfig } from '../types';
import { ConflictDetectionEngine } from './conflictDetection';
import { ConflictResolutionEngine } from './conflictResolution';

export interface SyncQueueItem {
  id: string;
  type: 'task' | 'timeSlot' | 'objective';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  entity: Task | TimeSlot | Objective | null; // null for delete
  timestamp: number;
  retries: number;
  lastError?: string;
}

export interface SyncConfig {
  enabled: boolean;
  autoSyncOnChange: boolean; // Sync immediately on create/update/delete
  backgroundSyncInterval: number; // Minutes (0 = disabled)
  syncTasks: boolean;
  syncTimeSlots: boolean;
  syncGoals: boolean;
  maxRetries: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: true,
  autoSyncOnChange: true,
  backgroundSyncInterval: 15, // 15 minutes
  syncTasks: true,
  syncTimeSlots: true,
  syncGoals: true,
  maxRetries: 3,
};

// Callbacks voor DataContext integratie
export interface DataContextCallbacks {
  getTasks: () => Task[];
  getTimeSlots: () => TimeSlot[];
  getObjectives: () => Objective[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  addTimeSlot: (timeSlot: TimeSlot) => void;
  updateTimeSlot: (timeSlot: TimeSlot) => void;
  updateObjective: (objective: Objective) => void;
}

class SyncService {
  private queue: SyncQueueItem[] = [];
  private isProcessing = false;
  private backgroundSyncInterval: NodeJS.Timeout | null = null;
  private autoImportInterval: NodeJS.Timeout | null = null;
  private config: SyncConfig = DEFAULT_SYNC_CONFIG;
  private listeners: Set<(item: SyncQueueItem) => void> = new Set();
  private conflictDetection: ConflictDetectionEngine;
  private conflictResolution: ConflictResolutionEngine;
  private conflicts: Conflict[] = [];
  private dataContextCallbacks: DataContextCallbacks | null = null;

  constructor() {
    this.loadConfig();
    this.startBackgroundSync();
    
    // Initialize conflict engines
    this.conflictDetection = new ConflictDetectionEngine();
    const conflictConfig: ConflictResolutionConfig = this.loadConflictConfig();
    this.conflictResolution = new ConflictResolutionEngine(conflictConfig);
  }

  /**
   * Registreer DataContext callbacks
   */
  registerDataContextCallbacks(callbacks: DataContextCallbacks) {
    this.dataContextCallbacks = callbacks;
  }

  // Load config from localStorage
  private loadConfig() {
    const saved = localStorage.getItem('orbit_sync_config');
    if (saved) {
      try {
        this.config = { ...DEFAULT_SYNC_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to load sync config:', e);
      }
    }
  }

  // Save config to localStorage
  private saveConfig() {
    localStorage.setItem('orbit_sync_config', JSON.stringify(this.config));
  }

  // Update config
  updateConfig(updates: Partial<SyncConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    
    // Restart background sync if interval changed
    if (updates.backgroundSyncInterval !== undefined) {
      this.stopBackgroundSync();
      this.startBackgroundSync();
    }
  }

  // Get current config
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  // Add item to sync queue
  queueSync(
    type: 'task' | 'timeSlot' | 'objective',
    action: 'create' | 'update' | 'delete',
    entityId: string,
    entity: Task | TimeSlot | Objective | null
  ) {
    if (!this.config.enabled) {
      return;
    }

    // Check if sync is enabled for this type
    if (type === 'task' && !this.config.syncTasks) return;
    if (type === 'timeSlot' && !this.config.syncTimeSlots) return;
    if (type === 'objective' && !this.config.syncGoals) return;

    // Remove existing queue item for this entity (to avoid duplicates)
    this.queue = this.queue.filter(item => !(item.type === type && item.entityId === entityId));

    const queueItem: SyncQueueItem = {
      id: `${type}-${entityId}-${Date.now()}`,
      type,
      action,
      entityId,
      entity,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queueItem);
    console.log(`[Sync] Queued ${action} for ${type} ${entityId}`, queueItem);

    // Notify listeners
    this.listeners.forEach(listener => listener(queueItem));

    // Process immediately if auto-sync is enabled
    if (this.config.autoSyncOnChange) {
      this.processQueue();
    }
  }

  // Process sync queue
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    if (!isGoogleConnected()) {
      console.log('[Sync] Google not connected, skipping sync');
      return;
    }

    this.isProcessing = true;
    const token = getAccessToken();
    
    if (!token) {
      console.error('[Sync] No access token available');
      this.isProcessing = false;
      return;
    }

    console.log(`[Sync] Processing ${this.queue.length} items...`);

    const itemsToProcess = [...this.queue];
    const processed: string[] = [];
    const failed: SyncQueueItem[] = [];

    for (const item of itemsToProcess) {
      try {
        const success = await this.syncItem(item, token);
        
        if (success) {
          processed.push(item.id);
        } else {
          item.retries++;
          if (item.retries < this.config.maxRetries) {
            failed.push(item);
          } else {
            console.error(`[Sync] Max retries reached for ${item.id}`);
            processed.push(item.id); // Remove from queue even if failed
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        console.error(`[Sync] Error processing ${item.id}:`, error);
        item.retries++;
        item.lastError = error.message;
        
        if (item.retries < this.config.maxRetries) {
          failed.push(item);
        } else {
          processed.push(item.id);
        }
      }
    }

    // Remove processed items
    this.queue = this.queue.filter(item => !processed.includes(item.id));
    
    // Re-add failed items for retry
    this.queue.push(...failed);

    console.log(`[Sync] Processed ${processed.length} items, ${failed.length} failed`);

    this.isProcessing = false;
  }

  // Sync a single item
  private async syncItem(item: SyncQueueItem, token: string): Promise<boolean> {
    if (item.action === 'delete') {
      // For delete, we would need to track external IDs
      // For now, skip delete sync
      console.log(`[Sync] Delete sync not yet implemented for ${item.type}`);
      return true;
    }

    if (!item.entity) {
      console.error(`[Sync] No entity data for ${item.id}`);
      return false;
    }

    try {
      if (item.type === 'task') {
        const task = item.entity as Task;
        const result = await exportTaskToGoogleTasks(task, token);
        if (result.success) {
          console.log(`[Sync] ✓ Task "${task.title}" synced to Google Tasks`);
          return true;
        } else {
          console.error(`[Sync] ✗ Task sync failed:`, result.error);
          item.lastError = result.error;
          return false;
        }
      } else if (item.type === 'timeSlot') {
        const timeSlot = item.entity as TimeSlot;
        const result = await exportTimeSlotToCalendar(timeSlot, token);
        if (result.success) {
          console.log(`[Sync] ✓ Time Slot "${timeSlot.title}" synced to Google Calendar`);
          return true;
        } else {
          console.error(`[Sync] ✗ Time Slot sync failed:`, result.error);
          item.lastError = result.error;
          return false;
        }
      } else if (item.type === 'objective') {
        const objective = item.entity as Objective;
        // Only sync if it has an endDate (deadline)
        if (objective.endDate) {
          const result = await exportGoalDeadlineToCalendar(objective, token);
          if (result.success) {
            console.log(`[Sync] ✓ Goal deadline "${objective.title}" synced to Google Calendar`);
            return true;
          } else {
            console.error(`[Sync] ✗ Goal deadline sync failed:`, result.error);
            item.lastError = result.error;
            return false;
          }
        }
        return true; // Skip if no endDate
      }
    } catch (error: any) {
      console.error(`[Sync] Exception syncing ${item.id}:`, error);
      item.lastError = error.message;
      return false;
    }

    return false;
  }

  // Start background sync interval
  private startBackgroundSync() {
    this.stopBackgroundSync();

    if (!this.config.enabled || this.config.backgroundSyncInterval === 0) {
      return;
    }

    const intervalMs = this.config.backgroundSyncInterval * 60 * 1000;
    console.log(`[Sync] Starting background sync every ${this.config.backgroundSyncInterval} minutes`);

    this.backgroundSyncInterval = setInterval(() => {
      if (isGoogleConnected() && this.queue.length > 0) {
        console.log('[Sync] Background sync triggered');
        this.processQueue();
      }
    }, intervalMs);
  }

  // Stop background sync
  private stopBackgroundSync() {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      items: this.queue.map(item => ({
        id: item.id,
        type: item.type,
        action: item.action,
        entityId: item.entityId,
        retries: item.retries,
        lastError: item.lastError,
      })),
    };
  }

  // Clear queue
  clearQueue() {
    this.queue = [];
    console.log('[Sync] Queue cleared');
  }

  // Add listener for queue changes
  addListener(listener: (item: SyncQueueItem) => void) {
    this.listeners.add(listener);
  }

  // Remove listener
  removeListener(listener: (item: SyncQueueItem) => void) {
    this.listeners.delete(listener);
  }

  // Manual sync trigger
  async triggerSync() {
    if (!isGoogleConnected()) {
      throw new Error('Google not connected');
    }
    await this.processQueue();
  }

  // Conflict Management

  /**
   * Load conflict resolution config
   */
  private loadConflictConfig(): ConflictResolutionConfig {
    const saved = localStorage.getItem('orbit_conflict_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load conflict config:', e);
      }
    }
    return {
      defaultStrategy: 'last_write_wins',
      autoResolve: false,
      notifyOnConflict: true,
    };
  }

  /**
   * Save conflict resolution config
   */
  private saveConflictConfig(config: ConflictResolutionConfig) {
    localStorage.setItem('orbit_conflict_config', JSON.stringify(config));
  }

  /**
   * Detecteer conflicten voor alle gesynced items
   */
  async detectConflicts(): Promise<Conflict[]> {
    if (!isGoogleConnected() || !this.dataContextCallbacks) {
      return [];
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      return [];
    }

    const detectedConflicts: Conflict[] = [];

    try {
      // Haal alle gesynced tasks op
      const tasks = this.dataContextCallbacks.getTasks();
      const syncedTasks = tasks.filter(t => 
        t.syncMetadata?.externalService === 'google_tasks' && 
        t.syncMetadata?.externalId
      );

      if (syncedTasks.length > 0) {
        // Haal Google Tasks op
        const googleTasksResult = await importGoogleTasks(accessToken);
        if (googleTasksResult.success && googleTasksResult.tasks) {
          // Maak maps voor efficiente lookup
          const externalDataMap = new Map<string, any>();
          const syncMetadataMap = new Map<string, any>();

          // Map Google Tasks op external ID
          for (const googleTask of googleTasksResult.tasks) {
            const appTask = syncedTasks.find(t => t.googleTaskId === googleTask.id);
            if (appTask && appTask.syncMetadata?.externalId) {
              externalDataMap.set(appTask.syncMetadata.externalId, googleTask);
              syncMetadataMap.set(appTask.id, appTask.syncMetadata);
            }
          }

          // Detecteer conflicten voor tasks
          const taskConflicts = this.conflictDetection.detectConflicts(
            syncedTasks,
            externalDataMap,
            syncMetadataMap
          );
          detectedConflicts.push(...taskConflicts);
        }
      }

      // Haal alle gesynced timeSlots op
      const timeSlots = this.dataContextCallbacks.getTimeSlots();
      const syncedTimeSlots = timeSlots.filter(ts => 
        ts.syncMetadata?.externalService === 'google_calendar' && 
        ts.syncMetadata?.externalId
      );

      // TODO: Implementeer conflict detection voor timeSlots (Google Calendar)
      // Dit vereist Google Calendar API calls

      // Update conflicts array
      this.conflicts = detectedConflicts;

      return detectedConflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }

  /**
   * Los conflict op
   */
  async resolveConflict(
    conflictId: string,
    strategy?: ConflictResolution['strategy']
  ): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    if (!this.dataContextCallbacks) {
      throw new Error('DataContext callbacks not registered');
    }

    const resolution = await this.conflictResolution.resolveConflict(conflict, strategy);
    
    // Pas resolutie toe op entiteit via DataContext
    if (resolution.finalValue) {
      if (conflict.entityType === 'task') {
        const resolvedTask = resolution.finalValue as Task;
        // Update sync metadata met nieuwe sync info
        resolvedTask.syncMetadata = {
          ...resolvedTask.syncMetadata,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
          conflictDetails: undefined, // Clear conflict details
        };
        this.dataContextCallbacks.updateTask(resolvedTask);
      } else if (conflict.entityType === 'timeSlot') {
        const resolvedTimeSlot = resolution.finalValue as TimeSlot;
        resolvedTimeSlot.syncMetadata = {
          ...resolvedTimeSlot.syncMetadata,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
          conflictDetails: undefined,
        };
        this.dataContextCallbacks.updateTimeSlot(resolvedTimeSlot);
      } else if (conflict.entityType === 'objective') {
        const resolvedObjective = resolution.finalValue as Objective;
        // Objectives hebben geen syncMetadata in de huidige implementatie
        this.dataContextCallbacks.updateObjective(resolvedObjective);
      }
    }

    // Update conflict
    conflict.resolvedAt = resolution.resolvedAt;
    conflict.resolution = resolution;
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
  }

  /**
   * Auto-resolve conflicten volgens configuratie
   */
  async autoResolveConflicts(): Promise<void> {
    const config = this.conflictResolution.getConfig();
    if (!config.autoResolve) {
      return;
    }

    const unresolvedConflicts = this.conflicts.filter(c => !c.resolvedAt);
    
    for (const conflict of unresolvedConflicts) {
      try {
        await this.resolveConflict(conflict.id);
      } catch (error) {
        console.error(`Failed to auto-resolve conflict ${conflict.id}:`, error);
      }
    }
  }

  /**
   * Get alle conflicten
   */
  getConflicts(): Conflict[] {
    return [...this.conflicts];
  }

  /**
   * Get conflicten per entity type
   */
  getConflictsByType(entityType: Conflict['entityType']): Conflict[] {
    return this.conflicts.filter(c => c.entityType === entityType);
  }

  /**
   * Get conflicten per service
   */
  getConflictsByService(service: Conflict['service']): Conflict[] {
    return this.conflicts.filter(c => c.service === service);
  }

  /**
   * Update conflict resolution config
   */
  updateConflictConfig(config: Partial<ConflictResolutionConfig>) {
    const currentConfig = this.conflictResolution.getConfig();
    const newConfig = { ...currentConfig, ...config };
    this.conflictResolution.updateConfig(newConfig);
    this.saveConflictConfig(newConfig);
  }

  // Import Management

  /**
   * Start auto-import van Google Tasks
   */
  async startAutoImport(intervalMinutes: number = 30): Promise<void> {
    if (this.autoImportInterval) {
      this.stopAutoImport();
    }

    this.autoImportInterval = setInterval(async () => {
      try {
        await this.importFromGoogle();
      } catch (error) {
        console.error('Auto-import failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Direct eerste import
    await this.importFromGoogle();
  }

  /**
   * Stop auto-import
   */
  stopAutoImport(): void {
    if (this.autoImportInterval) {
      clearInterval(this.autoImportInterval);
      this.autoImportInterval = null;
    }
  }

  /**
   * Import van Google Tasks
   */
  async importFromGoogle(): Promise<{ imported: number; updated: number; conflicts: number }> {
    if (!isGoogleConnected() || !this.dataContextCallbacks) {
      return { imported: 0, updated: 0, conflicts: 0 };
    }

    const config = this.getConfig();
    if (!config.syncTasks) {
      return { imported: 0, updated: 0, conflicts: 0 };
    }

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Haal Google Tasks op
      const result = await importGoogleTasks(accessToken);
      if (!result.success || !result.tasks) {
        return { imported: 0, updated: 0, conflicts: 0 };
      }

      // Haal huidige app tasks op
      const existingTasks = this.dataContextCallbacks.getTasks();
      
      // Detecteer duplicates
      const duplicates = detectDuplicateTasks(
        existingTasks,
        result.tasks.map(gt => {
          // Map Google Task naar app Task formaat voor duplicate detection
          const appTask = {
            id: `gt-${gt.id}`,
            googleTaskId: gt.id,
            title: gt.title || '',
            scheduledDate: gt.due ? new Date(gt.due).toISOString().split('T')[0] : undefined,
          };
          return appTask;
        })
      );

      // Filter nieuwe tasks (geen duplicate)
      const newTasks = result.tasks.filter(googleTask => 
        !duplicates.some(d => d.googleTask.id === googleTask.id)
      );

      let imported = 0;
      let updated = 0;
      let conflicts = 0;

      // Import nieuwe tasks
      for (const googleTask of newTasks) {
        const appTask = mapGoogleTaskToAppTask(googleTask, '@default');
        this.dataContextCallbacks.addTask(appTask);
        imported++;
      }

      // Update duplicates en check voor conflicten
      for (const duplicate of duplicates) {
        const existingTask = existingTasks.find(t => 
          t.googleTaskId === duplicate.googleTask.id || 
          (t.title === duplicate.googleTask.title && 
           t.scheduledDate === (duplicate.googleTask.due ? new Date(duplicate.googleTask.due).toISOString().split('T')[0] : undefined))
        );

        if (existingTask) {
          // Check voor conflicten
          const syncMetadata = existingTask.syncMetadata;
          if (syncMetadata && syncMetadata.externalId) {
            const conflict = this.conflictDetection.detectConflict(
              existingTask,
              duplicate.googleTask,
              syncMetadata
            );

            if (conflict) {
              conflicts++;
              // Voeg conflict toe aan conflicts array
              this.conflicts.push(conflict);
              continue; // Skip update, laat user conflict oplossen
            }
          }

          // Merge tasks (geen conflict)
          const merged = mergeTasks(existingTask, duplicate.googleTask, 'merge');
          this.dataContextCallbacks.updateTask(merged);
          updated++;
        }
      }

      return { imported, updated, conflicts };
    } catch (error: any) {
      console.error('Import from Google failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const syncService = new SyncService();

