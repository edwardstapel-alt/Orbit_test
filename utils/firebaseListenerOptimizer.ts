// Firebase Listener Optimizer
// Optimizes real-time listeners to reduce quota usage

interface ListenerConfig {
  collectionName: string;
  throttleMs: number;
  skipUnchanged: boolean;
  usePolling?: boolean;
  pollingInterval?: number;
}

class FirebaseListenerOptimizer {
  private listenerConfigs: Map<string, ListenerConfig> = new Map();
  private lastSnapshotData: Map<string, any> = new Map();
  private throttledCallbacks: Map<string, NodeJS.Timeout> = new Map();

  // Configure a listener
  configureListener(
    collectionName: string,
    config: Partial<ListenerConfig>
  ): void {
    const defaultConfig: ListenerConfig = {
      collectionName,
      throttleMs: 1000, // Default 1 second throttle
      skipUnchanged: true,
      usePolling: false,
      pollingInterval: 30000 // 30 seconds default polling
    };

    this.listenerConfigs.set(collectionName, {
      ...defaultConfig,
      ...config
    });
  }

  // Throttle a listener callback
  throttleCallback(
    collectionName: string,
    callback: (data: any[]) => void,
    data: any[]
  ): void {
    const config = this.listenerConfigs.get(collectionName);
    if (!config) {
      // No config, execute immediately
      callback(data);
      return;
    }

    // Check if data actually changed
    if (config.skipUnchanged) {
      const lastData = this.lastSnapshotData.get(collectionName);
      if (this.isDataEqual(lastData, data)) {
        // Data unchanged, skip callback
        return;
      }
      this.lastSnapshotData.set(collectionName, JSON.parse(JSON.stringify(data)));
    }

    // Check if there's a pending throttled callback
    const existingTimeout = this.throttledCallbacks.get(collectionName);
    if (existingTimeout) {
      // Already throttled, skip
      return;
    }

    // Set throttle timeout
    const timeout = setTimeout(() => {
      callback(data);
      this.throttledCallbacks.delete(collectionName);
    }, config.throttleMs);

    this.throttledCallbacks.set(collectionName, timeout);
  }

  // Check if data is equal (deep comparison)
  private isDataEqual(data1: any, data2: any): boolean {
    if (data1 === data2) return true;
    if (!data1 || !data2) return false;
    if (Array.isArray(data1) && Array.isArray(data2)) {
      if (data1.length !== data2.length) return false;
      // Compare by ID and updatedAt
      const map1 = new Map(data1.map((item: any) => [item.id, item.updatedAt || item.createdAt]));
      const map2 = new Map(data2.map((item: any) => [item.id, item.updatedAt || item.createdAt]));
      
      if (map1.size !== map2.size) return false;
      
      for (const [id, timestamp] of map1) {
        if (map2.get(id) !== timestamp) return false;
      }
      return true;
    }
    return JSON.stringify(data1) === JSON.stringify(data2);
  }

  // Get config for a collection
  getConfig(collectionName: string): ListenerConfig | undefined {
    return this.listenerConfigs.get(collectionName);
  }

  // Clear throttle for a collection
  clearThrottle(collectionName: string): void {
    const timeout = this.throttledCallbacks.get(collectionName);
    if (timeout) {
      clearTimeout(timeout);
      this.throttledCallbacks.delete(collectionName);
    }
  }

  // Clear all throttles
  clearAll(): void {
    this.throttledCallbacks.forEach(timeout => clearTimeout(timeout));
    this.throttledCallbacks.clear();
  }
}

export const firebaseListenerOptimizer = new FirebaseListenerOptimizer();

// Configure default listener settings
firebaseListenerOptimizer.configureListener('tasks', {
  throttleMs: 1000, // 1 second throttle for tasks
  skipUnchanged: true
});

firebaseListenerOptimizer.configureListener('habits', {
  throttleMs: 2000, // 2 seconds for habits (less critical)
  skipUnchanged: true
});

firebaseListenerOptimizer.configureListener('objectives', {
  throttleMs: 2000,
  skipUnchanged: true
});

firebaseListenerOptimizer.configureListener('keyResults', {
  throttleMs: 2000,
  skipUnchanged: true
});

// Less critical collections can have longer throttles
firebaseListenerOptimizer.configureListener('reviews', {
  throttleMs: 5000,
  skipUnchanged: true
});

firebaseListenerOptimizer.configureListener('retrospectives', {
  throttleMs: 5000,
  skipUnchanged: true
});

