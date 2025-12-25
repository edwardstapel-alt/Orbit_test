// Firebase Sync Service
// Handles synchronization between local storage and Firebase Firestore

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  Timestamp,
  serverTimestamp,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Task, Habit, Objective, KeyResult, LifeArea, TimeSlot, Friend, UserProfile, StatusUpdate, Review, Retrospective } from '../types';

// Helper to get current user ID
const getUserId = (): string | null => {
  const user = auth.currentUser;
  if (user) {
    console.log('🔐 getUserId called:', {
      uid: user.uid,
      email: user.email,
      timestamp: new Date().toISOString()
    });
  } else {
    console.warn('⚠️ getUserId called but user is not authenticated');
  }
  return user ? user.uid : null;
};

// Helper to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

// Helper to get user collection path
const getUserCollection = (collectionName: string): string => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  return `users/${userId}/${collectionName}`;
};

// Direct sync function (used by rate limiter, no queueing)
export const syncEntityToFirebaseDirect = async (
  collectionName: string,
  entity: any,
  entityId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = getUserId();
    if (!userId) {
      console.warn(`⚠️ Cannot sync ${collectionName} to Firebase: user not authenticated`);
      return { success: false, error: 'User not authenticated' };
    }

    // Special handling for profile collection (uses different path structure)
    let docRef;
    if (collectionName === 'profile') {
      docRef = doc(db, `users/${userId}/profile`, entityId);
    } else {
      docRef = doc(db, getUserCollection(collectionName), entityId);
    }

    const dataToSync = {
      ...entity,
      updatedAt: serverTimestamp(),
      syncedAt: serverTimestamp(),
      userId // Store userId for security (except for profile)
    };
    
    // Don't add userId to profile
    if (collectionName === 'profile') {
      delete dataToSync.userId;
    }
    
    // Ensure createdAt is set if not present
    if (!dataToSync.createdAt) {
      dataToSync.createdAt = new Date().toISOString();
    }
    
    await setDoc(docRef, dataToSync, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    // Check for quota errors
    const isQuotaError = error.code === 'resource-exhausted' || 
                        error.message?.includes('quota') ||
                        error.message?.includes('Quota exceeded');
    
    if (isQuotaError) {
      console.warn(`⚠️ Quota exceeded for ${collectionName}/${entityId}, will retry`);
    } else {
      console.error(`❌ Error syncing ${collectionName} to Firebase:`, {
        id: entityId,
        error: error.message,
        code: error.code
      });
    }
    
    return { success: false, error: error.message || error.code || 'Unknown error' };
  }
};

// Sync a single entity to Firebase (with rate limiting, debouncing, and change detection)
export const syncEntityToFirebase = async (
  collectionName: string,
  entity: any,
  entityId: string,
  options?: { immediate?: boolean; skipChangeCheck?: boolean }
): Promise<{ success: boolean; error?: string }> => {
  // Import utilities dynamically to avoid circular dependency
  const { firebaseRateLimiter } = await import('./firebaseRateLimiter');
  const { firebaseDebouncer } = await import('./firebaseDebouncer');
  const { firebaseSyncChecker } = await import('./firebaseSyncChecker');
  
  // Check if sync is needed (unless explicitly skipped)
  if (!options?.skipChangeCheck && !firebaseSyncChecker.shouldSync(collectionName, entityId, entity)) {
    // Data unchanged, no need to sync
    return { success: true };
  }
  
  // If immediate sync requested, bypass debouncing
  if (options?.immediate) {
    const result = await firebaseRateLimiter.queueWrite(collectionName, entity, entityId);
    if (result.success) {
      firebaseSyncChecker.markSynced(collectionName, entityId, entity);
    }
    return result;
  }
  
  // Use debouncing for normal syncs (except for critical operations)
  // Critical collections that need immediate sync: deletedTaskIds, profile
  const criticalCollections = ['deletedTaskIds', 'profile'];
  if (criticalCollections.includes(collectionName)) {
    const result = await firebaseRateLimiter.queueWrite(collectionName, entity, entityId);
    if (result.success) {
      firebaseSyncChecker.markSynced(collectionName, entityId, entity);
    }
    return result;
  }
  
  // For other collections, use debouncing
  // Return a promise that resolves when debounced sync completes
  return new Promise((resolve) => {
    let resolved = false;
    
    firebaseDebouncer.debounceSync(
      collectionName,
      entity,
      entityId,
      async (cn: string, e: any, eid: string) => {
        try {
          const result = await firebaseRateLimiter.queueWrite(cn, e, eid);
          if (result.success) {
            firebaseSyncChecker.markSynced(cn, eid, e);
          }
          if (!resolved) {
            resolved = true;
            resolve(result);
          }
        } catch (error: any) {
          if (!resolved) {
            resolved = true;
            resolve({ success: false, error: error.message });
          }
        }
      }
    );
    
    // Resolve immediately for non-blocking behavior
    // The actual sync happens in the background via debouncer
    resolve({ success: true });
  });
};

// Sync multiple entities to Firebase (batch write)
export const syncEntitiesToFirebase = async (
  collectionName: string,
  entities: any[]
): Promise<{ success: boolean; synced: number; errors: number; error?: string }> => {
  try {
    const userId = getUserId();
    if (!userId) {
      return { success: false, synced: 0, errors: 0, error: 'User not authenticated' };
    }

    // Firestore batch limit is 500 operations
    const BATCH_LIMIT = 500;
    let synced = 0;
    let errors = 0;
    const allErrors: string[] = [];

    // Process in batches of 500
    for (let i = 0; i < entities.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const batchEntities = entities.slice(i, i + BATCH_LIMIT);
      
      batchEntities.forEach(entity => {
        try {
          const docRef = doc(db, getUserCollection(collectionName), entity.id);
          batch.set(docRef, {
            ...entity,
            updatedAt: serverTimestamp(),
            syncedAt: serverTimestamp(),
            userId
          }, { merge: true });
          synced++;
        } catch (error: any) {
          console.error(`Error adding ${entity.id} to batch:`, error);
          errors++;
          allErrors.push(error.message || 'Unknown error');
        }
      });

      try {
        await batch.commit();
        
        // Small delay between batches to avoid rate limiting
        if (i + BATCH_LIMIT < entities.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        // Check for quota errors
        if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
          console.warn(`⚠️ Quota exceeded during batch sync of ${collectionName}, partial sync completed`);
          // Return partial success
          return { 
            success: false, 
            synced, 
            errors: errors + (batchEntities.length - synced), 
            error: 'Quota exceeded - partial sync completed' 
          };
        }
        throw error;
      }
    }

    return { success: true, synced, errors };
  } catch (error: any) {
    console.error(`Error syncing ${collectionName} batch to Firebase:`, error);
    return { success: false, synced: 0, errors: entities.length, error: error.message };
  }
};

// Get all entities from Firebase
export const syncEntitiesFromFirebase = async (
  collectionName: string
): Promise<{ success: boolean; data: any[]; error?: string }> => {
  try {
    const userId = getUserId();
    if (!userId) {
      console.warn(`⚠️ Cannot sync ${collectionName}: User not authenticated`);
      return { success: false, data: [], error: 'User not authenticated' };
    }

    const collectionRef = collection(db, getUserCollection(collectionName));
    const snapshot = await getDocs(collectionRef);
    console.log(`📥 Fetched ${snapshot.docs.length} ${collectionName} from Firebase`);
    
    const data = snapshot.docs
      .map(doc => {
        const docData = doc.data();
        // Skip deleted items
        if (docData.deleted === true) {
          return null;
        }
        // Convert Firestore Timestamps to ISO strings
        const processed: any = { ...docData };
        if (processed.updatedAt && processed.updatedAt.toDate) {
          processed.updatedAt = processed.updatedAt.toDate().toISOString();
        }
        if (processed.syncedAt && processed.syncedAt.toDate) {
          processed.syncedAt = processed.syncedAt.toDate().toISOString();
        }
        if (processed.createdAt && processed.createdAt.toDate) {
          processed.createdAt = processed.createdAt.toDate().toISOString();
        }
        return processed;
      })
      .filter(item => item !== null); // Remove null items (deleted)

    return { success: true, data };
  } catch (error: any) {
    console.error(`Error syncing ${collectionName} from Firebase:`, error);
    return { success: false, data: [], error: error.message };
  }
};

// Watch for real-time changes in Firebase (optimized)
export const watchFirebaseChanges = (
  collectionName: string,
  callback: (data: any[]) => void
): (() => void) => {
  const userId = getUserId();
  if (!userId) {
    console.warn('Cannot watch Firebase changes: user not authenticated');
    return () => {}; // Return empty unsubscribe function
  }

  try {
    const collectionRef = collection(db, getUserCollection(collectionName));
    console.log(`👂 Setting up Firebase listener for ${collectionName}, collection path: ${getUserCollection(collectionName)}`);
    
    const unsubscribe = onSnapshot(
      collectionRef,
      { includeMetadataChanges: false }, // Don't trigger on metadata-only changes
      async (snapshot) => {
        // Import listener optimizer dynamically
        const { firebaseListenerOptimizer } = await import('./firebaseListenerOptimizer');
        // Check for quota errors in metadata
        if (snapshot.metadata.fromCache && snapshot.metadata.hasPendingWrites === false) {
          // This might indicate we're using cached data due to quota issues
          console.warn(`⚠️ Using cached data for ${collectionName} - may indicate quota issues`);
        }
        
        const data = snapshot.docs
          .map(doc => {
            const docData = doc.data();
            // Skip deleted items
            if (docData.deleted === true) {
              return null;
            }
            // Convert Firestore Timestamps to ISO strings
            const processed: any = { ...docData };
            if (processed.updatedAt && processed.updatedAt.toDate) {
              processed.updatedAt = processed.updatedAt.toDate().toISOString();
            }
            if (processed.syncedAt && processed.syncedAt.toDate) {
              processed.syncedAt = processed.syncedAt.toDate().toISOString();
            }
            if (processed.createdAt && processed.createdAt.toDate) {
              processed.createdAt = processed.createdAt.toDate().toISOString();
            }
          return processed;
        })
        .filter(item => item !== null); // Remove null items (deleted)
        
        // Use throttled callback to reduce quota usage
        firebaseListenerOptimizer.throttleCallback(collectionName, callback, data);
        
        // Reduced logging
        if (process.env.NODE_ENV === 'development' && collectionName === 'tasks') {
          console.log(`📦 Processed ${collectionName} data:`, {
            count: data.length,
            ids: data.map((d: any) => d.id)
          });
        }
      },
      (error) => {
        // Handle quota errors specifically
        if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
          console.error(`❌ Quota exceeded while watching ${collectionName}:`, error);
          // Don't throw, just log - the listener will retry automatically with backoff
        } else {
          console.error(`❌ Error watching ${collectionName}:`, error);
        }
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error(`Error setting up watch for ${collectionName}:`, error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Sync all app data to Firebase
export const syncAllToFirebase = async (
  data: {
    tasks: Task[];
    habits: Habit[];
    objectives: Objective[];
    keyResults: KeyResult[];
    lifeAreas: LifeArea[];
    timeSlots: TimeSlot[];
    friends: Friend[];
    statusUpdates: StatusUpdate[];
    reviews?: Review[];
    retrospectives?: Retrospective[];
    userProfile: UserProfile;
    deletedTaskIds?: string[];
  }
): Promise<{ success: boolean; synced: { [key: string]: number }; errors: { [key: string]: number } }> => {
  const results: { [key: string]: number } = {};
  const errors: { [key: string]: number } = {};

  // Sync each collection
  const collections = [
    { name: 'tasks', data: data.tasks },
    { name: 'habits', data: data.habits },
    { name: 'objectives', data: data.objectives },
    { name: 'keyResults', data: data.keyResults },
    { name: 'lifeAreas', data: data.lifeAreas },
    { name: 'timeSlots', data: data.timeSlots },
    { name: 'friends', data: data.friends },
    { name: 'statusUpdates', data: data.statusUpdates },
    { name: 'reviews', data: data.reviews || [] },
    { name: 'retrospectives', data: data.retrospectives || [] },
  ];

  for (const collection of collections) {
    const result = await syncEntitiesToFirebase(collection.name, collection.data);
    results[collection.name] = result.synced;
    errors[collection.name] = result.errors;
  }

  // Sync user profile separately
  if (data.userProfile) {
    const userId = getUserId();
    if (userId) {
      try {
        const profileRef = doc(db, `users/${userId}/profile`, 'data');
        await setDoc(profileRef, {
          ...data.userProfile,
          updatedAt: serverTimestamp(),
          syncedAt: serverTimestamp(),
        }, { merge: true });
        results['profile'] = 1;
      } catch (error: any) {
        console.error('Error syncing profile:', error);
        errors['profile'] = 1;
      }
    }
  }

  return { success: true, synced: results, errors };
};

// Sync all app data from Firebase
export const syncAllFromFirebase = async (): Promise<{
  success: boolean;
  data: {
    tasks: Task[];
    habits: Habit[];
    objectives: Objective[];
    keyResults: KeyResult[];
    lifeAreas: LifeArea[];
    timeSlots: TimeSlot[];
    friends: Friend[];
    statusUpdates: StatusUpdate[];
    reviews?: Review[];
    retrospectives?: Retrospective[];
    userProfile: UserProfile | null;
    deletedTaskIds?: { ids: string[] };
  };
  error?: string;
}> => {
  try {
    const userId = getUserId();
    
    // CRITICAL: Get deletedTaskIds FIRST before syncing tasks
    let deletedTaskIds: string[] = [];
    if (userId) {
      try {
        const deletedRef = doc(db, `users/${userId}/deletedTaskIds`, 'user');
        const deletedSnap = await getDoc(deletedRef);
        if (deletedSnap.exists()) {
          const deletedData = deletedSnap.data();
          // Support both old format (ids array) and new format (entries array)
          const entries = deletedData.entries || [];
          const ids = deletedData.ids || [];
          
          // Convert to array of IDs
          if (entries.length > 0) {
            deletedTaskIds = entries.map((e: any) => e.id || e);
          } else if (ids.length > 0) {
            deletedTaskIds = ids;
          }
          
          if (deletedTaskIds.length > 0) {
            console.log(`✅ Loaded ${deletedTaskIds.length} deleted task IDs before sync`);
          }
        }
      } catch (error) {
        console.error('❌ Error getting deletedTaskIds:', error);
      }
    }

    const collections = [
      'tasks',
      'habits',
      'objectives',
      'keyResults',
      'lifeAreas',
      'timeSlots',
      'friends',
      'statusUpdates',
      'reviews',
      'retrospectives',
    ];

    const data: any = {};

    // Sync each collection
    for (const collectionName of collections) {
      const result = await syncEntitiesFromFirebase(collectionName);
      if (result.success) {
        // CRITICAL: Filter out deleted tasks BEFORE adding to data
        if (collectionName === 'tasks' && deletedTaskIds.length > 0) {
          const filteredTasks = result.data.filter((task: Task) => !deletedTaskIds.includes(task.id));
          console.log(`🔒 Filtered ${result.data.length - filteredTasks.length} deleted tasks from sync`);
          data[collectionName] = filteredTasks;
        } else {
          data[collectionName] = result.data;
        }
      } else {
        data[collectionName] = [];
      }
    }

    // Get user profile
    if (userId) {
      try {
        const profileRef = doc(db, `users/${userId}/profile`, 'data');
        const profileSnap = await getDoc(profileRef);
        data.userProfile = profileSnap.exists() ? profileSnap.data() : null;
        if (data.userProfile) {
          console.log('✅ Synced user profile');
        } else {
          console.log('ℹ️ No user profile found in Firebase');
        }
      } catch (error) {
        console.error('❌ Error getting profile:', error);
        data.userProfile = null;
      }

      // Store deletedTaskIds in return data (already loaded above)
      const deletedRef = doc(db, `users/${userId}/deletedTaskIds`, 'user');
      const deletedSnap = await getDoc(deletedRef);
      if (deletedSnap.exists()) {
        const deletedData = deletedSnap.data();
        data.deletedTaskIds = deletedData;
        const count = deletedData.entries?.length || deletedData.ids?.length || 0;
        if (count > 0) {
          console.log(`✅ Synced ${count} deleted task IDs`);
        }
      } else {
        data.deletedTaskIds = { ids: [], entries: [] };
      }
    } else {
      console.warn('⚠️ Cannot get profile: User not authenticated');
      data.userProfile = null;
      data.deletedTaskIds = { ids: [], entries: [] };
    }

    const totalItems = Object.values(data).reduce((sum: number, arr: any) => {
      return sum + (Array.isArray(arr) ? arr.length : (arr ? 1 : 0));
    }, 0);
    console.log(`✅ Sync complete: ${totalItems} total items synced`);

    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Error syncing all from Firebase:', error);
      return {
      success: false,
      data: {
        tasks: [],
        habits: [],
        objectives: [],
        keyResults: [],
        lifeAreas: [],
        timeSlots: [],
        friends: [],
        statusUpdates: [],
        userProfile: null,
        deletedTaskIds: { ids: [] },
      },
      error: error.message,
    };
  }
};

// Delete entity from Firebase
export const deleteEntityFromFirebase = async (
  collectionName: string,
  entityId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = getUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const docRef = doc(db, getUserCollection(collectionName), entityId);
    // Actually delete the document from Firestore
    await deleteDoc(docRef);

    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting ${collectionName} from Firebase:`, error);
    return { success: false, error: error.message };
  }
};

// Delete all entities from a Firebase collection
export const deleteAllFromFirebaseCollection = async (
  collectionName: string
): Promise<{ success: boolean; deleted: number; error?: string }> => {
  try {
    const userId = getUserId();
    if (!userId) {
      return { success: false, deleted: 0, error: 'User not authenticated' };
    }

    const collectionRef = collection(db, getUserCollection(collectionName));
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      return { success: true, deleted: 0 };
    }

    // Use batch delete (max 500 operations per batch)
    const batch = writeBatch(db);
    let deleted = 0;
    const batches: typeof batch[] = [writeBatch(db)];

    snapshot.docs.forEach((docSnapshot, index) => {
      const currentBatch = batches[batches.length - 1];
      currentBatch.delete(docSnapshot.ref);
      deleted++;

      // Firestore allows max 500 operations per batch
      if ((index + 1) % 500 === 0 && index + 1 < snapshot.docs.length) {
        batches.push(writeBatch(db));
      }
    });

    // Commit all batches
    await Promise.all(batches.map(b => b.commit()));

    return { success: true, deleted };
  } catch (error: any) {
    console.error(`Error deleting all from ${collectionName}:`, error);
    return { success: false, deleted: 0, error: error.message };
  }
};

// Delete all user data from Firebase
export const deleteAllUserDataFromFirebase = async (): Promise<{
  success: boolean;
  deleted: { [key: string]: number };
  errors: { [key: string]: string };
}> => {
  const deleted: { [key: string]: number } = {};
  const errors: { [key: string]: string } = {};

  const collections = [
    'tasks',
    'habits',
    'objectives',
    'keyResults',
    'lifeAreas',
    'timeSlots',
    'friends',
    'statusUpdates',
  ];

  // Delete all collections
  for (const collectionName of collections) {
    const result = await deleteAllFromFirebaseCollection(collectionName);
    if (result.success) {
      deleted[collectionName] = result.deleted;
    } else {
      errors[collectionName] = result.error || 'Unknown error';
    }
  }

  // Delete user profile
  const userId = getUserId();
  if (userId) {
    try {
      const profileRef = doc(db, `users/${userId}/profile`, 'data');
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        await deleteDoc(profileRef);
        deleted['profile'] = 1;
      } else {
        deleted['profile'] = 0;
      }
    } catch (error: any) {
      errors['profile'] = error.message;
    }
  }

  return { success: Object.keys(errors).length === 0, deleted, errors };
};

