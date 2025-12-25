// Firebase Rate Limiter
// Prevents quota exhaustion by limiting and queuing Firebase operations

interface QueuedOperation {
  id: string;
  collectionName: string;
  entity: any;
  entityId: string;
  resolve: (result: { success: boolean; error?: string }) => void;
  reject: (error: Error) => void;
  retries: number;
  timestamp: number;
}

class FirebaseRateLimiter {
  private writeQueue: QueuedOperation[] = [];
  private isProcessing = false;
  private lastWriteTime = 0;
  private consecutiveErrors = 0;
  private readonly MIN_WRITE_INTERVAL = 100; // Minimum 100ms between writes
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_BACKOFF = 1000; // 1 second
  private readonly MAX_BACKOFF = 60000; // 60 seconds
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly BATCH_SIZE = 10; // Process up to 10 operations at once

  // Add operation to queue
  async queueWrite(
    collectionName: string,
    entity: any,
    entityId: string
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve, reject) => {
      // Check queue size
      if (this.writeQueue.length >= this.MAX_QUEUE_SIZE) {
        console.warn('⚠️ Firebase write queue is full, dropping oldest operation');
        const oldest = this.writeQueue.shift();
        if (oldest) {
          oldest.reject(new Error('Queue full, operation dropped'));
        }
      }

      const operation: QueuedOperation = {
        id: `${collectionName}_${entityId}_${Date.now()}`,
        collectionName,
        entity,
        entityId,
        resolve,
        reject,
        retries: 0,
        timestamp: Date.now()
      };

      this.writeQueue.push(operation);
      this.processQueue();
    });
  }

  // Process queue with rate limiting
  private async processQueue() {
    if (this.isProcessing || this.writeQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.writeQueue.length > 0) {
      // Rate limiting: wait if needed
      const timeSinceLastWrite = Date.now() - this.lastWriteTime;
      if (timeSinceLastWrite < this.MIN_WRITE_INTERVAL) {
        await this.sleep(this.MIN_WRITE_INTERVAL - timeSinceLastWrite);
      }

      // Get batch of operations (up to BATCH_SIZE)
      const batch = this.writeQueue.splice(0, this.BATCH_SIZE);
      
      // Process batch
      await Promise.allSettled(
        batch.map(op => this.executeOperation(op))
      );

      this.lastWriteTime = Date.now();

      // If we had errors, add exponential backoff
      if (this.consecutiveErrors > 0) {
        const backoff = Math.min(
          this.INITIAL_BACKOFF * Math.pow(2, this.consecutiveErrors - 1),
          this.MAX_BACKOFF
        );
        console.log(`⏳ Rate limiter backoff: ${backoff}ms (${this.consecutiveErrors} consecutive errors)`);
        await this.sleep(backoff);
      }
    }

    this.isProcessing = false;
  }

  // Execute a single operation
  private async executeOperation(operation: QueuedOperation) {
    try {
      // Dynamic import to avoid circular dependency
      const firebaseSyncModule = await import('./firebaseSync');
      const syncFunction = (firebaseSyncModule as any).syncEntityToFirebaseDirect;
      
      if (!syncFunction) {
        throw new Error('syncEntityToFirebaseDirect not found');
      }
      
      const result = await syncFunction(
        operation.collectionName,
        operation.entity,
        operation.entityId
      );

      if (result.success) {
        this.consecutiveErrors = 0;
        operation.resolve(result);
      } else {
        // Check if it's a quota error
        if (result.error?.includes('resource-exhausted') || result.error?.includes('quota')) {
          this.consecutiveErrors++;
          
          if (operation.retries < this.MAX_RETRIES) {
            // Retry with exponential backoff
            operation.retries++;
            const backoff = Math.min(
              this.INITIAL_BACKOFF * Math.pow(2, operation.retries - 1),
              this.MAX_BACKOFF
            );
            
            console.warn(`⚠️ Quota error for ${operation.collectionName}/${operation.entityId}, retrying in ${backoff}ms (attempt ${operation.retries}/${this.MAX_RETRIES})`);
            
            setTimeout(() => {
              this.writeQueue.push(operation);
              this.processQueue();
            }, backoff);
            
            return;
          } else {
            console.error(`❌ Max retries reached for ${operation.collectionName}/${operation.entityId}`);
            operation.reject(new Error(result.error || 'Max retries reached'));
          }
        } else {
          // Non-quota error, don't retry
          this.consecutiveErrors = 0;
          operation.resolve(result);
        }
      }
    } catch (error: any) {
      this.consecutiveErrors++;
      
      if (operation.retries < this.MAX_RETRIES && 
          (error.message?.includes('resource-exhausted') || error.message?.includes('quota'))) {
        operation.retries++;
        const backoff = Math.min(
          this.INITIAL_BACKOFF * Math.pow(2, operation.retries - 1),
          this.MAX_BACKOFF
        );
        
        setTimeout(() => {
          this.writeQueue.push(operation);
          this.processQueue();
        }, backoff);
      } else {
        operation.reject(error);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.writeQueue.length,
      isProcessing: this.isProcessing,
      consecutiveErrors: this.consecutiveErrors
    };
  }

  // Clear queue (useful for testing or emergency)
  clearQueue() {
    this.writeQueue.forEach(op => {
      op.reject(new Error('Queue cleared'));
    });
    this.writeQueue = [];
  }
}

export const firebaseRateLimiter = new FirebaseRateLimiter();

