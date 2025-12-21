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
import { Task, Habit, Objective, KeyResult, LifeArea, TimeSlot, Friend, UserProfile, StatusUpdate } from '../types';

// Helper to get current user ID
const getUserId = (): string | null => {
  const user = auth.currentUser;
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

// Sync a single entity to Firebase
export const syncEntityToFirebase = async (
  collectionName: string,
  entity: any,
  entityId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = getUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const docRef = doc(db, getUserCollection(collectionName), entityId);
    await setDoc(docRef, {
      ...entity,
      updatedAt: serverTimestamp(),
      syncedAt: serverTimestamp(),
      userId // Store userId for security
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error(`Error syncing ${collectionName} to Firebase:`, error);
    return { success: false, error: error.message };
  }
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

    const batch = writeBatch(db);
    let synced = 0;
    let errors = 0;

    entities.forEach(entity => {
      try {
        const docRef = doc(db, getUserCollection(collectionName), entity.id);
        batch.set(docRef, {
          ...entity,
          updatedAt: serverTimestamp(),
          syncedAt: serverTimestamp(),
          userId
        }, { merge: true });
        synced++;
      } catch (error) {
        console.error(`Error adding ${entity.id} to batch:`, error);
        errors++;
      }
    });

    await batch.commit();
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
      return { success: false, data: [], error: 'User not authenticated' };
    }

    const collectionRef = collection(db, getUserCollection(collectionName));
    const snapshot = await getDocs(collectionRef);
    
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

// Watch for real-time changes in Firebase
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
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
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
      callback(data);
    }, (error) => {
      console.error(`Error watching ${collectionName}:`, error);
    });

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
    userProfile: UserProfile;
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
    userProfile: UserProfile | null;
  };
  error?: string;
}> => {
  try {
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

    const data: any = {};

    // Sync each collection
    for (const collectionName of collections) {
      const result = await syncEntitiesFromFirebase(collectionName);
      if (result.success) {
        data[collectionName] = result.data;
      } else {
        data[collectionName] = [];
      }
    }

    // Get user profile
    const userId = getUserId();
    if (userId) {
      try {
        const profileRef = doc(db, `users/${userId}/profile`, 'data');
        const profileSnap = await getDoc(profileRef);
        data.userProfile = profileSnap.exists() ? profileSnap.data() : null;
      } catch (error) {
        console.error('Error getting profile:', error);
        data.userProfile = null;
      }
    } else {
      data.userProfile = null;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error syncing all from Firebase:', error);
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

