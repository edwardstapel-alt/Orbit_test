# Prioriteit 3 Implementatie Plan

Dit plan beschrijft de volledige implementatie van Prioriteit 3 features: **Conflict Resolution** en **Google Tasks Bi-directionele Synchronisatie**.

## Overzicht

Prioriteit 3 bestaat uit twee hoofdcomponenten:
1. **Conflict Resolution Systeem** - Detectie en resolutie van conflicterende wijzigingen tussen app en externe services
2. **Google Tasks Bi-directionele Sync** - Volledige synchronisatie tussen app Tasks en Google Tasks (import + export)

---

## Deel 1: Conflict Resolution Systeem

### 1.1 Type Definities Uitbreiden

**Bestand**: `types.ts`

Uitbreiden van bestaande interfaces en nieuwe interfaces toevoegen:

```typescript
// Uitbreiden SyncMetadata interface
export interface SyncMetadata {
  lastSyncedAt?: string; // ISO timestamp
  syncStatus: 'synced' | 'pending' | 'syncing' | 'conflict' | 'error';
  externalId?: string; // ID in external service
  externalService: 'google_calendar' | 'google_tasks' | 'google_contacts' | 'asana';
  syncVersion?: number; // Versie nummer voor conflict detection
  syncDirection?: 'export' | 'import' | 'bidirectional';
  syncErrors?: string[]; // Lijst van sync errors
  conflictDetails?: ConflictDetails;
  appLastModified?: string; // ISO timestamp laatste wijziging in app
  externalLastModified?: string; // ISO timestamp laatste wijziging in externe service
}

// Nieuwe Conflict interface
export interface Conflict {
  id: string;
  entityType: 'task' | 'timeSlot' | 'objective' | 'friend';
  entityId: string;
  service: 'google_calendar' | 'google_tasks' | 'google_contacts' | 'asana';
  appValue: any; // Huidige waarde in app
  externalValue: any; // Huidige waarde in externe service
  conflictFields: FieldDifference[]; // Welke velden conflicteren
  appLastModified: string; // ISO timestamp
  externalLastModified: string; // ISO timestamp
  detectedAt: string; // ISO timestamp wanneer conflict gedetecteerd is
  resolvedAt?: string; // ISO timestamp wanneer conflict opgelost is
  resolution?: ConflictResolution;
  priority: 'low' | 'medium' | 'high'; // Prioriteit van conflict
}

// Field difference details
export interface FieldDifference {
  field: string; // Naam van het veld
  appValue: any; // Waarde in app
  externalValue: any; // Waarde in externe service
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  canMerge: boolean; // Of velden kunnen worden gemerged
}

// Conflict resolution strategie
export interface ConflictResolution {
  strategy: 'app_wins' | 'external_wins' | 'last_write_wins' | 'merge' | 'manual';
  resolvedBy?: string; // User ID of 'system'
  resolvedAt: string; // ISO timestamp
  finalValue?: any; // Finale waarde na resolutie
  mergedFields?: { [field: string]: any }; // Voor merge strategie
}

// Conflict resolution configuratie
export interface ConflictResolutionConfig {
  defaultStrategy: 'app_wins' | 'external_wins' | 'last_write_wins' | 'merge' | 'manual';
  autoResolve: boolean; // Automatisch oplossen zonder user input
  notifyOnConflict: boolean; // Notificatie bij conflict
  perServiceStrategy?: {
    [service: string]: 'app_wins' | 'external_wins' | 'last_write_wins' | 'merge' | 'manual';
  };
}
```

### 1.2 Conflict Detection Engine

**Nieuw bestand**: `utils/conflictDetection.ts`

Core logica voor conflict detectie:

```typescript
import { Conflict, FieldDifference, SyncMetadata, Task, TimeSlot, Objective } from '../types';

export class ConflictDetectionEngine {
  /**
   * Detecteert conflicten tussen app entiteit en externe service
   */
  detectConflict(
    entity: Task | TimeSlot | Objective,
    externalData: any,
    syncMetadata: SyncMetadata
  ): Conflict | null {
    // Check of beide versies zijn gewijzigd sinds laatste sync
    if (!this.hasBothBeenModified(entity, externalData, syncMetadata)) {
      return null; // Geen conflict
    }

    // Vergelijk velden en detecteer verschillen
    const differences = this.compareFields(entity, externalData, syncMetadata.externalService);
    
    if (differences.length === 0) {
      return null; // Geen verschillen gevonden
    }

    // Maak conflict object
    return {
      id: `conflict-${entity.id}-${Date.now()}`,
      entityType: this.getEntityType(entity),
      entityId: entity.id,
      service: syncMetadata.externalService,
      appValue: entity,
      externalValue: externalData,
      conflictFields: differences,
      appLastModified: syncMetadata.appLastModified || new Date().toISOString(),
      externalLastModified: syncMetadata.externalLastModified || new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      priority: this.calculatePriority(differences, entity),
    };
  }

  /**
   * Check of beide versies zijn gewijzigd sinds laatste sync
   */
  private hasBothBeenModified(
    entity: Task | TimeSlot | Objective,
    externalData: any,
    syncMetadata: SyncMetadata
  ): boolean {
    if (!syncMetadata.lastSyncedAt) {
      return false; // Nog nooit gesynced, geen conflict mogelijk
    }

    const lastSync = new Date(syncMetadata.lastSyncedAt);
    const appModified = syncMetadata.appLastModified 
      ? new Date(syncMetadata.appLastModified) > lastSync
      : false;
    const externalModified = syncMetadata.externalLastModified
      ? new Date(syncMetadata.externalLastModified) > lastSync
      : false;

    return appModified && externalModified;
  }

  /**
   * Vergelijk velden tussen app en externe versie
   */
  private compareFields(
    appEntity: Task | TimeSlot | Objective,
    externalEntity: any,
    service: string
  ): FieldDifference[] {
    const differences: FieldDifference[] = [];
    const fieldMappings = this.getFieldMappings(service);

    for (const [appField, externalField] of Object.entries(fieldMappings)) {
      const appValue = (appEntity as any)[appField];
      const externalValue = externalEntity[externalField];

      if (!this.valuesEqual(appValue, externalValue)) {
        differences.push({
          field: appField,
          appValue,
          externalValue,
          fieldType: this.getFieldType(appValue),
          canMerge: this.canMergeField(appField, appValue, externalValue),
        });
      }
    }

    return differences;
  }

  /**
   * Field mappings per service
   */
  private getFieldMappings(service: string): { [appField: string]: string } {
    if (service === 'google_tasks') {
      return {
        title: 'title',
        completed: 'status',
        scheduledDate: 'due',
        // ... meer mappings
      };
    }
    if (service === 'google_calendar') {
      return {
        title: 'summary',
        startTime: 'start.dateTime',
        endTime: 'end.dateTime',
        // ... meer mappings
      };
    }
    return {};
  }

  /**
   * Check of waarden gelijk zijn
   */
  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    
    // Date comparison
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    
    // Object comparison
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return false;
  }

  /**
   * Bepaal field type
   */
  private getFieldType(value: any): FieldDifference['fieldType'] {
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'string';
  }

  /**
   * Check of veld kan worden gemerged
   */
  private canMergeField(field: string, appValue: any, externalValue: any): boolean {
    // Sommige velden kunnen niet worden gemerged (bijv. completed status)
    const nonMergeableFields = ['completed', 'id', 'syncMetadata'];
    if (nonMergeableFields.includes(field)) {
      return false;
    }
    
    // Arrays kunnen soms worden gemerged
    if (Array.isArray(appValue) && Array.isArray(externalValue)) {
      return true;
    }
    
    // Strings kunnen worden gemerged (bijv. descriptions)
    if (typeof appValue === 'string' && typeof externalValue === 'string') {
      return field.includes('description') || field.includes('notes');
    }
    
    return false;
  }

  /**
   * Bepaal entity type
   */
  private getEntityType(entity: Task | TimeSlot | Objective): Conflict['entityType'] {
    if ('scheduledDate' in entity) return 'task';
    if ('startTime' in entity) return 'timeSlot';
    return 'objective';
  }

  /**
   * Bereken conflict prioriteit
   */
  private calculatePriority(
    differences: FieldDifference[],
    entity: Task | TimeSlot | Objective
  ): Conflict['priority'] {
    // High priority conflicts: critical fields changed
    const criticalFields = ['title', 'completed', 'scheduledDate', 'startTime', 'endTime'];
    if (differences.some(d => criticalFields.includes(d.field))) {
      return 'high';
    }
    
    // Medium priority: important fields
    const importantFields = ['description', 'tag', 'priority'];
    if (differences.some(d => importantFields.includes(d.field))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Batch conflict detection voor meerdere entiteiten
   */
  detectConflicts(
    entities: (Task | TimeSlot | Objective)[],
    externalDataMap: Map<string, any>,
    syncMetadataMap: Map<string, SyncMetadata>
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const entity of entities) {
      const syncMetadata = syncMetadataMap.get(entity.id);
      if (!syncMetadata || !syncMetadata.externalId) continue;

      const externalData = externalDataMap.get(syncMetadata.externalId);
      if (!externalData) continue;

      const conflict = this.detectConflict(entity, externalData, syncMetadata);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }
}
```

### 1.3 Conflict Resolution Engine

**Nieuw bestand**: `utils/conflictResolution.ts`

Core logica voor conflict resolutie:

```typescript
import { Conflict, ConflictResolution, ConflictResolutionConfig, Task, TimeSlot, Objective } from '../types';

export class ConflictResolutionEngine {
  private config: ConflictResolutionConfig;

  constructor(config: ConflictResolutionConfig) {
    this.config = config;
  }

  /**
   * Los conflict op volgens geconfigureerde strategie
   */
  async resolveConflict(
    conflict: Conflict,
    strategy?: ConflictResolution['strategy']
  ): Promise<ConflictResolution> {
    const resolutionStrategy = strategy || this.getStrategyForConflict(conflict);
    
    let resolution: ConflictResolution;

    switch (resolutionStrategy) {
      case 'app_wins':
        resolution = this.resolveAppWins(conflict);
        break;
      case 'external_wins':
        resolution = this.resolveExternalWins(conflict);
        break;
      case 'last_write_wins':
        resolution = this.resolveLastWriteWins(conflict);
        break;
      case 'merge':
        resolution = this.resolveMerge(conflict);
        break;
      case 'manual':
        // Manual resolution vereist user input
        throw new Error('Manual resolution requires user interaction');
      default:
        throw new Error(`Unknown resolution strategy: ${resolutionStrategy}`);
    }

    return resolution;
  }

  /**
   * App versie wint
   */
  private resolveAppWins(conflict: Conflict): ConflictResolution {
    return {
      strategy: 'app_wins',
      resolvedBy: 'system',
      resolvedAt: new Date().toISOString(),
      finalValue: conflict.appValue,
    };
  }

  /**
   * Externe versie wint
   */
  private resolveExternalWins(conflict: Conflict): ConflictResolution {
    return {
      strategy: 'external_wins',
      resolvedBy: 'system',
      resolvedAt: new Date().toISOString(),
      finalValue: conflict.externalValue,
    };
  }

  /**
   * Laatste wijziging wint
   */
  private resolveLastWriteWins(conflict: Conflict): ConflictResolution {
    const appModified = new Date(conflict.appLastModified);
    const externalModified = new Date(conflict.externalLastModified);

    if (appModified > externalModified) {
      return this.resolveAppWins(conflict);
    } else {
      return this.resolveExternalWins(conflict);
    }
  }

  /**
   * Merge beide versies
   */
  private resolveMerge(conflict: Conflict): ConflictResolution {
    const mergedFields: { [field: string]: any } = {};
    const finalValue = { ...conflict.appValue };

    for (const diff of conflict.conflictFields) {
      if (diff.canMerge) {
        // Merge logica per field type
        if (diff.fieldType === 'array') {
          // Combineer arrays en verwijder duplicates
          const appArray = diff.appValue as any[];
          const externalArray = diff.externalValue as any[];
          mergedFields[diff.field] = [...new Set([...appArray, ...externalArray])];
        } else if (diff.fieldType === 'string' && diff.field.includes('description')) {
          // Combineer descriptions
          mergedFields[diff.field] = `${diff.appValue}\n\n---\n\n${diff.externalValue}`;
        } else {
          // Default: gebruik app waarde
          mergedFields[diff.field] = diff.appValue;
        }
      } else {
        // Niet mergeable: gebruik app waarde
        mergedFields[diff.field] = diff.appValue;
      }
    }

    // Pas merged fields toe
    Object.assign(finalValue, mergedFields);

    return {
      strategy: 'merge',
      resolvedBy: 'system',
      resolvedAt: new Date().toISOString(),
      finalValue,
      mergedFields,
    };
  }

  /**
   * Bepaal strategie voor specifiek conflict
   */
  private getStrategyForConflict(conflict: Conflict): ConflictResolution['strategy'] {
    // Check per-service strategie
    if (this.config.perServiceStrategy?.[conflict.service]) {
      return this.config.perServiceStrategy[conflict.service];
    }
    
    return this.config.defaultStrategy;
  }

  /**
   * Update configuratie
   */
  updateConfig(config: Partial<ConflictResolutionConfig>) {
    this.config = { ...this.config, ...config };
  }
}
```

### 1.4 Conflict Service Integratie

**Bestand**: `utils/syncService.ts` uitbreiden

Toevoegen van conflict management aan sync service:

```typescript
import { ConflictDetectionEngine } from './conflictDetection';
import { ConflictResolutionEngine } from './conflictResolution';
import { Conflict, ConflictResolutionConfig } from '../types';

class SyncService {
  // ... bestaande code ...
  
  private conflictDetection: ConflictDetectionEngine;
  private conflictResolution: ConflictResolutionEngine;
  private conflicts: Conflict[] = [];

  constructor() {
    // ... bestaande initialisatie ...
    
    this.conflictDetection = new ConflictDetectionEngine();
    const conflictConfig: ConflictResolutionConfig = this.loadConflictConfig();
    this.conflictResolution = new ConflictResolutionEngine(conflictConfig);
  }

  /**
   * Detecteer conflicten voor alle gesynced items
   */
  async detectConflicts(): Promise<Conflict[]> {
    if (!isGoogleConnected()) {
      return [];
    }

    // Haal alle gesynced items op
    const tasks = this.getSyncedTasks();
    const timeSlots = this.getSyncedTimeSlots();
    const objectives = this.getSyncedObjectives();

    // Haal externe data op
    const externalTasks = await this.fetchExternalTasks();
    const externalEvents = await this.fetchExternalEvents();

    // Detecteer conflicten
    const taskConflicts = this.conflictDetection.detectConflicts(
      tasks,
      externalTasks,
      this.getSyncMetadataMap(tasks)
    );

    const eventConflicts = this.conflictDetection.detectConflicts(
      timeSlots,
      externalEvents,
      this.getSyncMetadataMap(timeSlots)
    );

    const allConflicts = [...taskConflicts, ...eventConflicts];
    this.conflicts = allConflicts;

    // Update sync metadata met conflict status
    this.updateConflictStatus(allConflicts);

    return allConflicts;
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

    const resolution = await this.conflictResolution.resolveConflict(conflict, strategy);
    
    // Pas resolutie toe
    await this.applyResolution(conflict, resolution);

    // Update conflict
    conflict.resolvedAt = resolution.resolvedAt;
    conflict.resolution = resolution;
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);

    // Sync opnieuw
    await this.syncItem(conflict.entityType, 'update', conflict.entityId, resolution.finalValue);
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

  // ... helper methods ...
}
```

### 1.5 Conflict Resolution UI Componenten

**Nieuw bestand**: `components/ConflictResolver.tsx`

Component voor conflict resolutie:

```typescript
import React, { useState } from 'react';
import { Conflict, ConflictResolution } from '../types';

interface ConflictResolverProps {
  conflict: Conflict;
  onResolve: (conflictId: string, resolution: ConflictResolution) => void;
  onDismiss?: () => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  conflict,
  onResolve,
  onDismiss,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolution['strategy']>('last_write_wins');
  const [showDetails, setShowDetails] = useState(false);

  const handleResolve = () => {
    const resolution: ConflictResolution = {
      strategy: selectedStrategy,
      resolvedBy: 'user',
      resolvedAt: new Date().toISOString(),
    };
    onResolve(conflict.id, resolution);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-amber-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-text-main mb-1">
            Conflict Gedetecteerd
          </h3>
          <p className="text-sm text-text-tertiary">
            {conflict.entityType} • {conflict.service}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          conflict.priority === 'high' ? 'bg-red-100 text-red-700' :
          conflict.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {conflict.priority.toUpperCase()}
        </span>
      </div>

      {/* Conflict Details */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-primary font-medium mb-2"
        >
          {showDetails ? 'Verberg' : 'Toon'} Details
        </button>
        
        {showDetails && (
          <div className="space-y-3 mt-2">
            {conflict.conflictFields.map((field, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-bold text-text-tertiary mb-2 uppercase">
                  {field.field}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">App Versie</div>
                    <div className="text-sm text-text-main bg-white p-2 rounded">
                      {String(field.appValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Externe Versie</div>
                    <div className="text-sm text-text-main bg-white p-2 rounded">
                      {String(field.externalValue)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Strategy Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-main mb-2">
          Oplossingsstrategie
        </label>
        <select
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value as ConflictResolution['strategy'])}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="last_write_wins">Laatste wijziging wint</option>
          <option value="app_wins">App versie behouden</option>
          <option value="external_wins">Externe versie gebruiken</option>
          {conflict.conflictFields.some(f => f.canMerge) && (
            <option value="merge">Beide versies combineren</option>
          )}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleResolve}
          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Oplossen
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Later
          </button>
        )}
      </div>
    </div>
  );
};
```

### 1.6 Conflict Management View

**Nieuw bestand**: `views/ConflictManagement.tsx`

View voor conflict beheer:

```typescript
import React, { useState, useEffect } from 'react';
import { Conflict, ConflictResolution } from '../types';
import { ConflictResolver } from '../components/ConflictResolver';
import { syncService } from '../utils/syncService';

export const ConflictManagement: React.FC = () => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const detectedConflicts = await syncService.detectConflicts();
      setConflicts(detectedConflicts);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conflictId: string, resolution: ConflictResolution) => {
    try {
      await syncService.resolveConflict(conflictId, resolution.strategy);
      await loadConflicts(); // Reload
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const handleAutoResolve = async () => {
    setLoading(true);
    try {
      await syncService.autoResolveConflicts();
      await loadConflicts();
    } catch (error) {
      console.error('Failed to auto-resolve conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConflicts = conflicts.filter(c => {
    if (filter !== 'all' && c.priority !== filter) return false;
    if (serviceFilter !== 'all' && c.service !== serviceFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-32">
      {/* Header */}
      <div className="px-6 md:px-12 lg:px-16 py-6 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Conflict Beheer</h1>
            <p className="text-sm text-text-tertiary mt-1">
              {conflicts.length} conflict{conflicts.length !== 1 ? 'en' : ''} gedetecteerd
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAutoResolve}
              disabled={loading || conflicts.length === 0}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              Auto Oplossen
            </button>
            <button
              onClick={loadConflicts}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Laden...' : 'Vernieuwen'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Alle Prioriteiten</option>
            <option value="high">Hoog</option>
            <option value="medium">Medium</option>
            <option value="low">Laag</option>
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Alle Services</option>
            <option value="google_tasks">Google Tasks</option>
            <option value="google_calendar">Google Calendar</option>
            <option value="google_contacts">Google Contacts</option>
          </select>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="px-6 md:px-12 lg:px-16 py-6">
        {filteredConflicts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-tertiary">
              {conflicts.length === 0 
                ? 'Geen conflicten gedetecteerd' 
                : 'Geen conflicten met huidige filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConflicts.map(conflict => (
              <ConflictResolver
                key={conflict.id}
                conflict={conflict}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 1.7 DataContext Integratie

**Bestand**: `context/DataContext.tsx` uitbreiden

Toevoegen van conflict management functies:

```typescript
// In DataContextType interface toevoegen:
conflicts: Conflict[];
getConflicts: () => Conflict[];
getConflictsByType: (entityType: Conflict['entityType']) => Conflict[];
getConflictsByService: (service: Conflict['service']) => Conflict[];
detectConflicts: () => Promise<Conflict[]>;
resolveConflict: (conflictId: string, strategy?: ConflictResolution['strategy']) => Promise<void>;
autoResolveConflicts: () => Promise<void>;
updateConflictResolutionConfig: (config: Partial<ConflictResolutionConfig>) => void;
```

---

## Deel 2: Google Tasks Bi-directionele Synchronisatie

### 2.1 Google Tasks Import Functionaliteit

**Bestand**: `utils/googleSync.ts` uitbreiden

Toevoegen van import functies:

```typescript
/**
 * Import Google Tasks naar app
 */
export async function importGoogleTasks(
  taskListId?: string,
  dateRange?: { start: Date; end: Date }
): Promise<Task[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated with Google');
  }

  // Haal task lists op
  const taskLists = await getGoogleTaskLists();
  const listsToImport = taskListId 
    ? taskLists.filter(list => list.id === taskListId)
    : taskLists;

  const importedTasks: Task[] = [];

  for (const list of listsToImport) {
    // Haal tasks op van deze list
    const googleTasks = await fetchGoogleTasks(list.id, dateRange);
    
    for (const googleTask of googleTasks) {
      // Map Google Task naar app Task
      const appTask = mapGoogleTaskToAppTask(googleTask, list.id);
      importedTasks.push(appTask);
    }
  }

  return importedTasks;
}

/**
 * Haal Google Tasks op van specifieke task list
 */
async function fetchGoogleTasks(
  taskListId: string,
  dateRange?: { start: Date; end: Date }
): Promise<any[]> {
  const accessToken = await getAccessToken();
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
  
  const params = new URLSearchParams({
    showCompleted: 'true',
    showHidden: 'false',
    maxResults: '100',
  });

  if (dateRange) {
    // Filter op due date range
    params.append('dueMin', dateRange.start.toISOString());
    params.append('dueMax', dateRange.end.toISOString());
  }

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Tasks: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Map Google Task naar app Task
 */
function mapGoogleTaskToAppTask(googleTask: any, taskListId: string): Task {
  const task: Task = {
    id: `gt-${googleTask.id}`, // Prefix om Google Tasks te identificeren
    title: googleTask.title || '',
    tag: 'Work', // Default tag, kan later worden aangepast
    completed: googleTask.status === 'completed',
    priority: googleTask.position ? parseInt(googleTask.position) < 10 : false,
    googleTaskId: googleTask.id,
    syncMetadata: {
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced',
      externalId: googleTask.id,
      externalService: 'google_tasks',
      syncDirection: 'import',
      externalLastModified: googleTask.updated || googleTask.updated || new Date().toISOString(),
    },
  };

  // Map due date
  if (googleTask.due) {
    const dueDate = new Date(googleTask.due);
    task.scheduledDate = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Als er een tijd is, voeg die toe
    if (googleTask.due.includes('T')) {
      const time = dueDate.toTimeString().slice(0, 5); // HH:mm
      task.scheduledTime = time;
    }
  }

  // Map notes
  if (googleTask.notes) {
    // Notes kunnen worden opgeslagen in description veld (als dat bestaat)
    // Of in een apart notes veld
  }

  // Map parent task (voor subtasks)
  if (googleTask.parent) {
    // Link naar parent task via parentTaskId (als dat veld bestaat)
  }

  return task;
}

/**
 * Haal Google Task Lists op
 */
export async function getGoogleTaskLists(): Promise<Array<{ id: string; title: string }>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated with Google');
  }

  const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch task lists: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.items || []).map((list: any) => ({
    id: list.id,
    title: list.title,
  }));
}
```

### 2.2 Duplicate Detection & Merge Logica

**Bestand**: `utils/googleSync.ts` uitbreiden

```typescript
/**
 * Detecteer duplicates tussen app tasks en Google Tasks
 */
export function detectDuplicateTasks(
  appTasks: Task[],
  googleTasks: Task[]
): Array<{ appTask: Task; googleTask: Task; matchType: 'id' | 'title+date' | 'title' }> {
  const duplicates: Array<{ appTask: Task; googleTask: Task; matchType: string }> = [];

  for (const appTask of appTasks) {
    // Match op Google Task ID
    if (appTask.googleTaskId) {
      const googleTask = googleTasks.find(gt => gt.googleTaskId === appTask.googleTaskId);
      if (googleTask) {
        duplicates.push({ appTask, googleTask, matchType: 'id' });
        continue;
      }
    }

    // Match op title + scheduledDate
    if (appTask.scheduledDate) {
      const googleTask = googleTasks.find(gt => 
        gt.title === appTask.title && 
        gt.scheduledDate === appTask.scheduledDate
      );
      if (googleTask) {
        duplicates.push({ appTask, googleTask, matchType: 'title+date' });
        continue;
      }
    }

    // Match op title alleen (zwakke match)
    const googleTask = googleTasks.find(gt => gt.title === appTask.title);
    if (googleTask) {
      duplicates.push({ appTask, googleTask, matchType: 'title' });
    }
  }

  return duplicates;
}

/**
 * Merge app task met Google Task
 */
export function mergeTasks(appTask: Task, googleTask: Task, strategy: 'app' | 'google' | 'merge'): Task {
  if (strategy === 'app') {
    return { ...appTask, googleTaskId: googleTask.googleTaskId || appTask.googleTaskId };
  }
  
  if (strategy === 'google') {
    return { ...googleTask, id: appTask.id };
  }

  // Merge strategie: combineer beide
  return {
    ...appTask,
    // Behoud app ID
    id: appTask.id,
    // Gebruik Google Task ID als die bestaat
    googleTaskId: googleTask.googleTaskId || appTask.googleTaskId,
    // Combineer titles (als verschillend)
    title: appTask.title !== googleTask.title 
      ? `${appTask.title} / ${googleTask.title}` 
      : appTask.title,
    // Gebruik meest recente completion status
    completed: appTask.completed || googleTask.completed,
    // Gebruik meest recente scheduled date
    scheduledDate: googleTask.scheduledDate || appTask.scheduledDate,
    scheduledTime: googleTask.scheduledTime || appTask.scheduledTime,
    // Update sync metadata
    syncMetadata: {
      ...appTask.syncMetadata,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced',
      syncDirection: 'bidirectional',
    },
  };
}
```

### 2.3 Auto-Import Service

**Bestand**: `utils/syncService.ts` uitbreiden

Toevoegen van auto-import functionaliteit:

```typescript
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
  if (!isGoogleConnected()) {
    return { imported: 0, updated: 0, conflicts: 0 };
  }

  const config = this.getConfig();
  if (!config.syncTasks) {
    return { imported: 0, updated: 0, conflicts: 0 };
  }

  try {
    // Haal Google Tasks op
    const googleTasks = await importGoogleTasks();
    
    // Haal huidige app tasks op
    const appTasks = this.getTasks(); // Helper method nodig
    
    // Detecteer duplicates
    const duplicates = detectDuplicateTasks(appTasks, googleTasks);
    
    // Filter nieuwe tasks (geen duplicate)
    const newTasks = googleTasks.filter(gt => 
      !duplicates.some(d => d.googleTask.id === gt.id)
    );

    let imported = 0;
    let updated = 0;
    let conflicts = 0;

    // Import nieuwe tasks
    for (const task of newTasks) {
      await this.addTask(task); // Helper method nodig
      imported++;
    }

    // Update duplicates
    for (const duplicate of duplicates) {
      // Check voor conflicten
      const conflict = await this.detectTaskConflict(duplicate.appTask, duplicate.googleTask);
      
      if (conflict) {
        conflicts++;
        // Conflict wordt opgelost via conflict resolution systeem
        continue;
      }

      // Merge tasks
      const merged = mergeTasks(duplicate.appTask, duplicate.googleTask, 'merge');
      await this.updateTask(merged); // Helper method nodig
      updated++;
    }

    return { imported, updated, conflicts };
  } catch (error) {
    console.error('Import from Google failed:', error);
    throw error;
  }
}
```

### 2.4 Google Tasks Sync Settings UI

**Bestand**: `views/SyncedAccounts.tsx` uitbreiden

Toevoegen van Google Tasks sync settings:

```typescript
// In SyncedAccounts component toevoegen:

const [taskLists, setTaskLists] = useState<Array<{ id: string; title: string }>>([]);
const [selectedTaskLists, setSelectedTaskLists] = useState<string[]>([]);
const [syncDirection, setSyncDirection] = useState<'export' | 'import' | 'bidirectional'>('bidirectional');

useEffect(() => {
  loadTaskLists();
}, []);

const loadTaskLists = async () => {
  try {
    const lists = await getGoogleTaskLists();
    setTaskLists(lists);
    
    // Load saved selection
    const saved = localStorage.getItem('google_tasks_selected_lists');
    if (saved) {
      setSelectedTaskLists(JSON.parse(saved));
    } else {
      // Default: selecteer alle lists
      setSelectedTaskLists(lists.map(l => l.id));
    }
  } catch (error) {
    console.error('Failed to load task lists:', error);
  }
};

const handleImportTasks = async () => {
  try {
    const result = await syncService.importFromGoogle();
    alert(`Import voltooid: ${result.imported} nieuw, ${result.updated} bijgewerkt, ${result.conflicts} conflicten`);
  } catch (error) {
    alert(`Import mislukt: ${error.message}`);
  }
};

// In render toevoegen:
<section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
  <h3 className="text-lg font-bold text-text-main mb-4">Google Tasks Sync</h3>
  
  {/* Task Lists Selector */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-text-main mb-2">
      Selecteer Task Lists
    </label>
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {taskLists.map(list => (
        <label key={list.id} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedTaskLists.includes(list.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTaskLists([...selectedTaskLists, list.id]);
              } else {
                setSelectedTaskLists(selectedTaskLists.filter(id => id !== list.id));
              }
            }}
            className="rounded"
          />
          <span className="text-sm text-text-main">{list.title}</span>
        </label>
      ))}
    </div>
  </div>

  {/* Sync Direction */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-text-main mb-2">
      Sync Richting
    </label>
    <select
      value={syncDirection}
      onChange={(e) => setSyncDirection(e.target.value as any)}
      className="w-full p-2 border border-gray-300 rounded-lg"
    >
      <option value="export">Alleen Export (App → Google)</option>
      <option value="import">Alleen Import (Google → App)</option>
      <option value="bidirectional">Bi-directioneel</option>
    </select>
  </div>

  {/* Actions */}
  <div className="flex gap-3">
    <button
      onClick={handleImportTasks}
      className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark"
    >
      Import Nu
    </button>
    <button
      onClick={() => {
        localStorage.setItem('google_tasks_selected_lists', JSON.stringify(selectedTaskLists));
        syncService.updateConfig({ syncDirection });
        alert('Instellingen opgeslagen');
      }}
      className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
    >
      Opslaan
    </button>
  </div>
</section>
```

### 2.5 DataContext Integratie voor Import

**Bestand**: `context/DataContext.tsx` uitbreiden

Toevoegen van import functies:

```typescript
// In DataContextType interface toevoegen:
importTasksFromGoogle: (taskListIds?: string[]) => Promise<{ imported: number; updated: number; conflicts: number }>;
importTimeSlotsFromCalendar: (calendarIds?: string[]) => Promise<{ imported: number; updated: number; conflicts: number }>;
startAutoImport: (intervalMinutes?: number) => Promise<void>;
stopAutoImport: () => void;
```

---

## Implementatie Volgorde

### Sprint 1: Conflict Detection Foundation (Week 1)
1. Type definities uitbreiden (Conflict, ConflictResolution, etc.)
2. ConflictDetectionEngine implementeren
3. Basis conflict detection in syncService
4. Unit tests voor conflict detection

### Sprint 2: Conflict Resolution (Week 2)
1. ConflictResolutionEngine implementeren
2. Resolution strategieën (app_wins, external_wins, last_write_wins, merge)
3. Conflict resolutie in syncService
4. Conflict configuratie systeem

### Sprint 3: Conflict UI (Week 3)
1. ConflictResolver component
2. ConflictManagement view
3. Conflict status indicators in UI
4. Auto-resolve functionaliteit

### Sprint 4: Google Tasks Import (Week 4)
1. Google Tasks API import functies
2. Task mapping (Google → App)
3. Duplicate detection
4. Merge logica

### Sprint 5: Bi-directionele Sync (Week 5)
1. Auto-import service
2. Sync settings UI
3. Conflict detection voor Google Tasks
4. End-to-end testing

### Sprint 6: Polish & Testing (Week 6)
1. Error handling verbeteren
2. Performance optimalisatie
3. UI/UX verbeteringen
4. Documentatie
5. E2E tests

---

## Technische Overwegingen

### Performance
- Conflict detection moet efficient zijn (niet alle items elke keer)
- Incremental sync (alleen gewijzigde items)
- Batch processing voor grote hoeveelheden

### Data Consistency
- Atomic operations voor conflict resolution
- Rollback mechanisme bij failed resolutions
- Sync versioning voor conflict detection

### User Experience
- Duidelijke conflict notifications
- Preview van resolutie voordat toepassen
- Bulk conflict resolution
- Auto-resolve opties met user controle

### Error Handling
- Graceful degradation bij API failures
- Retry logic voor failed imports
- Clear error messages
- Conflict recovery mechanisme

---

## Testing Strategie

### Unit Tests
- Conflict detection logica
- Conflict resolution strategieën
- Task mapping functies
- Duplicate detection

### Integration Tests
- End-to-end sync flows
- Conflict detection en resolution
- Import/export cycles
- Error scenarios

### E2E Tests
- Complete conflict resolution workflow
- Google Tasks import/export
- Auto-import functionaliteit
- Settings wijzigingen

---

## Documentatie

### Code Comments
- Alle conflict detection functies documenteren
- Resolution strategieën uitleggen
- Complexe merge logica documenteren

### User Documentation
- Conflict resolution guide
- Google Tasks sync setup
- Troubleshooting guide
- Best practices

---

## To-Do Checklist

### Conflict Resolution
- [ ] Type definities toevoegen (Conflict, ConflictResolution, etc.)
- [ ] ConflictDetectionEngine implementeren
- [ ] ConflictResolutionEngine implementeren
- [ ] Conflict detection in syncService integreren
- [ ] ConflictResolver component maken
- [ ] ConflictManagement view maken
- [ ] Conflict status indicators in UI
- [ ] Auto-resolve functionaliteit
- [ ] Conflict configuratie systeem
- [ ] Unit tests voor conflict detection
- [ ] Integration tests voor conflict resolution

### Google Tasks Bi-directionele Sync
- [ ] Google Tasks import functies implementeren
- [ ] Task mapping (Google → App)
- [ ] Duplicate detection logica
- [ ] Merge logica implementeren
- [ ] Auto-import service
- [ ] Sync settings UI
- [ ] Task lists selector
- [ ] Sync direction configuratie
- [ ] Conflict detection voor Google Tasks
- [ ] DataContext integratie
- [ ] End-to-end tests

### Algemeen
- [ ] Error handling verbeteren
- [ ] Performance optimalisatie
- [ ] UI/UX verbeteringen
- [ ] Documentatie schrijven
- [ ] Code review
- [ ] Deployment
