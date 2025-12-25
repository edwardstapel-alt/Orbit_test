// Firebase Debouncer
// Prevents excessive syncs by debouncing rapid successive updates

interface DebouncedSync {
  collectionName: string;
  entity: any;
  entityId: string;
  timestamp: number;
}

class FirebaseDebouncer {
  private pendingSyncs: Map<string, DebouncedSync> = new Map();
  private syncTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY = 500; // 500ms debounce delay
  private readonly MAX_DEBOUNCE_DELAY = 2000; // Max 2 seconds

  // Debounce a sync operation
  debounceSync(
    collectionName: string,
    entity: any,
    entityId: string,
    syncFunction: (collectionName: string, entity: any, entityId: string) => Promise<any>
  ): void {
    const key = `${collectionName}_${entityId}`;
    const now = Date.now();

    // Store the latest entity data
    this.pendingSyncs.set(key, {
      collectionName,
      entity,
      entityId,
      timestamp: now
    });

    // Clear existing timeout
    const existingTimeout = this.syncTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Calculate debounce delay (longer if multiple rapid updates)
    const pendingSync = this.pendingSyncs.get(key);
    const timeSinceFirst = now - (pendingSync?.timestamp || now);
    const delay = Math.min(
      this.DEBOUNCE_DELAY + Math.floor(timeSinceFirst / 1000) * 100,
      this.MAX_DEBOUNCE_DELAY
    );

    // Set new timeout
    const timeout = setTimeout(() => {
      const sync = this.pendingSyncs.get(key);
      if (sync) {
        // Execute sync
        syncFunction(sync.collectionName, sync.entity, sync.entityId)
          .catch(error => {
            console.error(`Error in debounced sync for ${key}:`, error);
          })
          .finally(() => {
            // Cleanup
            this.pendingSyncs.delete(key);
            this.syncTimeouts.delete(key);
          });
      }
    }, delay);

    this.syncTimeouts.set(key, timeout);
  }

  // Force immediate sync (bypass debounce)
  forceSync(
    collectionName: string,
    entity: any,
    entityId: string,
    syncFunction: (collectionName: string, entity: any, entityId: string) => Promise<any>
  ): Promise<any> {
    const key = `${collectionName}_${entityId}`;
    
    // Clear any pending debounced sync
    const timeout = this.syncTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.syncTimeouts.delete(key);
    }
    this.pendingSyncs.delete(key);

    // Execute immediately
    return syncFunction(collectionName, entity, entityId);
  }

  // Cancel pending sync
  cancelSync(collectionName: string, entityId: string): void {
    const key = `${collectionName}_${entityId}`;
    const timeout = this.syncTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.syncTimeouts.delete(key);
    }
    this.pendingSyncs.delete(key);
  }

  // Get pending syncs count
  getPendingCount(): number {
    return this.pendingSyncs.size;
  }

  // Clear all pending syncs
  clearAll(): void {
    this.syncTimeouts.forEach(timeout => clearTimeout(timeout));
    this.syncTimeouts.clear();
    this.pendingSyncs.clear();
  }
}

export const firebaseDebouncer = new FirebaseDebouncer();

