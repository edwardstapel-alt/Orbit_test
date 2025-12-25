// Firebase Sync Checker
// Only syncs when data has actually changed

interface SyncCache {
  [key: string]: {
    data: any;
    hash: string;
    timestamp: number;
  };
}

class FirebaseSyncChecker {
  private cache: SyncCache = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Generate a hash of the entity data (excluding timestamps)
  private hashEntity(entity: any): string {
    // Create a copy without timestamps and metadata
    const cleanEntity = { ...entity };
    delete cleanEntity.updatedAt;
    delete cleanEntity.syncedAt;
    delete cleanEntity.createdAt;
    
    // Simple hash function
    const str = JSON.stringify(cleanEntity);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Check if entity needs syncing
  shouldSync(collectionName: string, entityId: string, entity: any): boolean {
    const key = `${collectionName}_${entityId}`;
    const cached = this.cache[key];
    const now = Date.now();

    // No cache or cache expired
    if (!cached || (now - cached.timestamp) > this.CACHE_TTL) {
      return true;
    }

    // Check if data actually changed
    const currentHash = this.hashEntity(entity);
    if (currentHash !== cached.hash) {
      return true;
    }

    // Data unchanged, no need to sync
    return false;
  }

  // Mark entity as synced
  markSynced(collectionName: string, entityId: string, entity: any): void {
    const key = `${collectionName}_${entityId}`;
    this.cache[key] = {
      data: JSON.parse(JSON.stringify(entity)),
      hash: this.hashEntity(entity),
      timestamp: Date.now()
    };
  }

  // Clear cache for a specific entity
  clearCache(collectionName: string, entityId: string): void {
    const key = `${collectionName}_${entityId}`;
    delete this.cache[key];
  }

  // Clear all cache
  clearAll(): void {
    this.cache = {};
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    Object.values(this.cache).forEach(cached => {
      if ((now - cached.timestamp) <= this.CACHE_TTL) {
        valid++;
      } else {
        expired++;
      }
    });

    return {
      total: Object.keys(this.cache).length,
      valid,
      expired
    };
  }
}

export const firebaseSyncChecker = new FirebaseSyncChecker();

