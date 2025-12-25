import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Task, Habit, Friend, Objective, KeyResult, Place, TeamMember, DataContextType, UserProfile, LifeArea, Vision, TimeSlot, DayPart, StatusUpdate, Conflict, ConflictResolution, ConflictResolutionConfig, Reminder, Notification, NotificationSettings, EntityType, TaskTemplate, ObjectiveTemplate, QuickAction, View, Review, Retrospective, ReviewInsight, ActionPlanProgress } from '../types';
import { syncService, DataContextCallbacks } from '../utils/syncService';
import { importGoogleTasks, detectDuplicateAppTasks, mergeAppTasks, getAccessToken } from '../utils/googleSync';
import { recordHabitCompletion, recordHabitMiss } from '../utils/habitHistory';
import { isAuthenticated, onAuthStateChange } from '../utils/firebaseAuth';
import { syncEntityToFirebase, syncAllFromFirebase, syncAllToFirebase, watchFirebaseChanges, deleteEntityFromFirebase, deleteAllUserDataFromFirebase } from '../utils/firebaseSync';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import { notificationScheduler } from '../utils/notificationScheduler';
import { getTaskTemplates, createTaskFromTemplate as createTaskFromTemplateUtil, addCustomTaskTemplate, updateTaskTemplate as updateTaskTemplateUtil, deleteTaskTemplate as deleteTaskTemplateUtil, updateTemplateUsage as updateTaskTemplateUsage, defaultTaskTemplates } from '../utils/taskTemplates';
import { getObjectiveTemplates, createObjectiveFromTemplate as createObjectiveFromTemplateUtil, addCustomObjectiveTemplate, updateObjectiveTemplate as updateObjectiveTemplateUtil, deleteObjectiveTemplate as deleteObjectiveTemplateUtil, updateTemplateUsage as updateObjectiveTemplateUsage, defaultObjectiveTemplates } from '../utils/objectiveTemplates';
import { getQuickActions, addCustomQuickAction, updateQuickAction as updateQuickActionUtil, deleteQuickAction as deleteQuickActionUtil, updateActionUsage, defaultQuickActions } from '../utils/quickActions';
import { recurringEngine } from '../utils/recurringEngine';

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Example Data ---
const defaultProfile: UserProfile = {
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex.morgan@example.com',
    dob: '1992-05-15',
    image: 'https://picsum.photos/id/64/200/200'
};

const exampleTasks: Task[] = [
  { id: '1', title: 'Review Q3 Financials', tag: 'Finance', time: '2:00 PM', completed: false, priority: false },
  { id: '2', title: '1:1 with CTO', tag: 'Meeting', time: '4:30 PM', completed: false, priority: false },
  { id: '3', title: 'Draft Keynote Speech', tag: 'Strategy', time: 'High Priority', completed: false, priority: true },
  { id: '4', title: 'Book Dentist Appt', tag: 'Health', time: 'Morning', completed: false, priority: false },
];

const exampleObjectives: Objective[] = [
  { 
    id: 'obj1', 
    title: 'Earn customer love', 
    description: 'Improve NPS and retention rates by Q4', 
    owner: 'Alex Morgan',
    ownerImage: 'https://picsum.photos/id/64/200/200',
    status: 'On Track', 
    category: 'professional', 
    progress: 65,
    lifeAreaId: 'la1', // Work & Career
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    timelineColor: '#8B5CF6'
  },
  { 
    id: 'obj2', 
    title: 'Achieve Peak Fitness', 
    description: 'Run a marathon and lower body fat', 
    owner: 'Alex Morgan', 
    ownerImage: 'https://picsum.photos/id/64/200/200',
    status: 'At Risk', 
    category: 'personal', 
    progress: 40,
    lifeAreaId: 'la2', // Sport & Health
    startDate: '2024-06-01',
    endDate: '2024-11-15',
    timelineColor: '#F97316'
  }
];

const exampleKeyResults: KeyResult[] = [
  { id: 'kr1', objectiveId: 'obj1', title: 'Increase NPS to 50+', current: 42, target: 50, measurementType: 'number', decimals: 0, status: 'On Track', owner: 'Alex Morgan', startDate: '2024-01-01', endDate: '2024-12-31' },
  { id: 'kr2', objectiveId: 'obj1', title: 'Reduce Churn to <2%', current: 2.5, target: 2.0, measurementType: 'percentage', decimals: 1, status: 'At Risk', owner: 'Sarah Jenkins', startDate: '2024-01-01', endDate: '2024-10-30' },
  { id: 'kr3', objectiveId: 'obj2', title: 'Run 500km total', current: 350, target: 500, measurementType: 'number', decimals: 0, status: 'On Track', owner: 'Alex Morgan', startDate: '2024-06-01', endDate: '2024-11-01' },
];

// Habits now linked to KRs
// Assumes a standard week where index 0 is Sunday.
const exampleHabits: Habit[] = [
  { id: 'h1', name: 'Morning Meditation', icon: 'self_improvement', streak: 12, completed: false, time: '15 mins', linkedKeyResultId: 'kr1', weeklyProgress: [true, true, true, false, false, false, false] },
  { id: 'h2', name: 'Inbox Zero', icon: 'mail', streak: 5, completed: false, time: 'Daily', linkedKeyResultId: 'kr2', weeklyProgress: [false, true, true, false, false, false, false] },
  { id: 'h3', name: '5km Run', icon: 'directions_run', streak: 3, completed: true, time: 'Morning', linkedKeyResultId: 'kr3', weeklyProgress: [true, false, true, false, false, false, false] },
  { id: 'h4', name: 'Read 20 pages', icon: 'menu_book', streak: 21, completed: true, time: 'Evening', weeklyProgress: [true, true, true, true, false, false, false] },
];

const exampleFriends: Friend[] = [
  { id: 'f1', name: 'Sarah Jenkins', role: 'Close Friend', roleType: 'friend', image: 'https://picsum.photos/id/65/200/200', lastSeen: '2d ago', location: 'Chicago' },
  { id: 'f2', name: 'David Chen', role: 'Professional', roleType: 'professional', image: 'https://picsum.photos/id/338/200/200', lastSeen: '3 months ago' },
];

const examplePlaces: Place[] = [
  { id: 'p1', name: 'Blue Bottle Coffee', address: '300 S Broadway, LA', type: 'Coffee', rating: '4.8' }
];

const exampleTeamMembers: TeamMember[] = [
  { id: 'tm1', name: 'Alex Morgan', role: 'You', image: 'https://picsum.photos/id/64/200/200' },
  { id: 'tm2', name: 'Sarah Jenkins', role: 'Product Lead', image: 'https://picsum.photos/id/65/200/200' },
  { id: 'tm3', name: 'David Chen', role: 'Engineering', image: 'https://picsum.photos/id/338/200/200' },
  { id: 'tm4', name: 'Emily Rose', role: 'Marketing', image: 'https://picsum.photos/id/129/200/200' },
];

// Life Planner - Example Data
const exampleLifeAreas: LifeArea[] = [
  { 
    id: 'la1', 
    name: 'Work & Career', 
    icon: 'work', 
    color: '#8B5CF6', 
    description: 'Professional growth and career development',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'la2', 
    name: 'Sport & Health', 
    icon: 'fitness_center', 
    color: '#F97316', 
    description: 'Physical fitness and wellbeing',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'la3', 
    name: 'Money & Finance', 
    icon: 'account_balance_wallet', 
    color: '#10B981', 
    description: 'Financial independence and security',
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'la4', 
    name: 'Personal development', 
    icon: 'school', 
    color: '#EC4899', 
    description: 'Learning and personal growth',
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];

const exampleVisions: Vision[] = [
  {
    id: 'v1',
    lifeAreaId: 'la1',
    statement: 'I envision my business as a thriving, innovative enterprise, recognized for excellence and impact. I am committed to continuous growth, expanding my reach and influence while maintaining a fulfilling and balanced work-life dynamic.',
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const defaultDayParts: DayPart[] = [
  { id: 'all-day', name: 'All Day', order: 0 },
  { id: 'morning', name: 'Morning', startTime: '07:00', endTime: '12:00', order: 1 },
  { id: 'afternoon', name: 'Afternoon', startTime: '12:00', endTime: '17:00', order: 2 },
  { id: 'evening', name: 'Evening', startTime: '17:00', endTime: '22:00', order: 3 }
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Flag to prevent Firebase listeners from restoring data after clear
  const [isClearingData, setIsClearingData] = useState(false);
  // Helper to load from LocalStorage or fallback to default
  const loadData = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      console.error('Failed to load data', e);
      return fallback;
    }
  };

  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadData('orbit_profile', defaultProfile));
  const [tasks, setTasks] = useState<Task[]>(() => loadData('orbit_tasks', exampleTasks));
  const [habits, setHabits] = useState<Habit[]>(() => loadData('orbit_habits', exampleHabits));
  const [friends, setFriends] = useState<Friend[]>(() => loadData('orbit_friends', exampleFriends));
  const [objectives, setObjectives] = useState<Objective[]>(() => {
    const loaded = loadData('orbit_objectives', exampleObjectives);
    // Ensure all objectives have a lifeAreaId (migration for existing data)
    return loaded.map(obj => ({
      ...obj,
      lifeAreaId: obj.lifeAreaId || (obj.category === 'professional' ? 'la1' : 'la2')
    }));
  });
  const [keyResults, setKeyResults] = useState<KeyResult[]>(() => loadData('orbit_keyResults', exampleKeyResults));
  const [places, setPlaces] = useState<Place[]>(() => loadData('orbit_places', examplePlaces));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadData('orbit_teamMembers', exampleTeamMembers));
  const [accentColor, setAccentColor] = useState<string>(() => loadData('orbit_accent', '#D95829'));
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('orbit_darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Theme state: 'light' | 'dark' | 'black'
  const [theme, setTheme] = useState<'light' | 'dark' | 'black'>(() => {
    const saved = localStorage.getItem('orbit_theme');
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'black')) return saved as 'light' | 'dark' | 'black';
    // Migration: convert old darkMode boolean to theme
    const oldDarkMode = localStorage.getItem('orbit_darkMode');
    return oldDarkMode === 'true' ? 'dark' : 'light';
  });
  
  const [showCategory, setShowCategory] = useState<boolean>(() => {
    const saved = localStorage.getItem('orbit_showCategory');
    return saved ? JSON.parse(saved) : false; // Default: false (uitgeschakeld)
  });
  
  // Life Planner state
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>(() => {
    const loaded = loadData('orbit_lifeAreas', exampleLifeAreas);
    const visions = loadData('orbit_visions', exampleVisions);
    
    // Migratie: verplaats bestaande visions naar lifeAreas
    return loaded.map(la => {
      const vision = visions.find((v: Vision) => v.lifeAreaId === la.id);
      if (vision && !la.visionStatement) {
        return {
          ...la,
          visionStatement: vision.statement,
          visionImages: vision.images || []
        };
      }
      return la;
    });
  });
  const [visions, setVisions] = useState<Vision[]>(() => loadData('orbit_visions', exampleVisions));
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => loadData('orbit_timeSlots', []));
  const [dayParts, setDayParts] = useState<DayPart[]>(() => loadData('orbit_dayParts', defaultDayParts));
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>(() => loadData('orbit_statusUpdates', []));

  // Planning & Review state
  const [reviews, setReviews] = useState<Review[]>(() => loadData('orbit_reviews', []));
  const [retrospectives, setRetrospectives] = useState<Retrospective[]>(() => loadData('orbit_retrospectives', []));
  
  // Notifications & Reminders
  const defaultNotificationSettings: NotificationSettings = {
    enabled: true,
    browserNotifications: true,
    soundEnabled: true,
    reminderDefaults: {
      task: 15,
      habit: 5,
      objective: 1440, // 1 day
      timeSlot: 15
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  };
  const [reminders, setReminders] = useState<Reminder[]>(() => loadData('orbit_reminders', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadData('orbit_notifications', []));
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => 
    loadData('orbit_notificationSettings', defaultNotificationSettings)
  );
  
  // Task Templates & Quick Actions
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>(() => loadData('orbit_taskTemplates', defaultTaskTemplates));
  const [objectiveTemplates, setObjectiveTemplates] = useState<ObjectiveTemplate[]>(() => loadData('orbit_objectiveTemplates', defaultObjectiveTemplates));
  const [quickActions, setQuickActions] = useState<QuickAction[]>(() => loadData('orbit_quickActions', defaultQuickActions));
  
  // Track deleted Google Task IDs to prevent re-import
  const [deletedGoogleTaskIds, setDeletedGoogleTaskIds] = useState<string[]>(() => loadData('orbit_deletedGoogleTaskIds', []));
  // Track all deleted task IDs with timestamps to prevent Firebase sync from restoring them
  // Migrate old format (string[]) to new format (Array<{id, deletedAt}>)
  const [deletedTaskIds, setDeletedTaskIds] = useState<Array<{ id: string; deletedAt: string }>>(() => {
    const loaded = loadData('orbit_deletedTaskIds', []);
    // Migrate: if it's an array of strings, convert to new format
    if (Array.isArray(loaded) && loaded.length > 0 && typeof loaded[0] === 'string') {
      const now = new Date().toISOString();
      return (loaded as string[]).map(id => ({ id, deletedAt: now }));
    }
    return loaded;
  });
  
  // Ref to track deletedTaskIds for use in closures (real-time listeners)
  const deletedTaskIdsRef = useRef(deletedTaskIds);
  useEffect(() => {
    deletedTaskIdsRef.current = deletedTaskIds;
  }, [deletedTaskIds]);

  // Helper function to reduce saturation by 50%
  const reduceSaturation = useCallback((color: string): string => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    // Reduce saturation by 50%
    s = Math.max(0, s * 0.5);

    // Convert HSL back to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let newR, newG, newB;
    if (s === 0) {
      newR = newG = newB = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      newR = hue2rgb(p, q, h + 1/3);
      newG = hue2rgb(p, q, h);
      newB = hue2rgb(p, q, h - 1/3);
    }

    // Convert back to hex
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  }, []);

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('orbit_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('orbit_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('orbit_habits', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('orbit_friends', JSON.stringify(friends)); }, [friends]);
  useEffect(() => { localStorage.setItem('orbit_objectives', JSON.stringify(objectives)); }, [objectives]);
  useEffect(() => { localStorage.setItem('orbit_keyResults', JSON.stringify(keyResults)); }, [keyResults]);
  
  // Auto-update objective progress when key results change
  useEffect(() => {
    setObjectives(prev => prev.map(obj => {
      const calculatedProgress = calculateObjectiveProgress(obj.id, keyResults);
      if (calculatedProgress !== obj.progress) {
        return { ...obj, progress: calculatedProgress };
      }
      return obj;
    }));
  }, [keyResults]); // Only depend on keyResults to avoid infinite loop
  useEffect(() => { localStorage.setItem('orbit_places', JSON.stringify(places)); }, [places]);
  useEffect(() => { localStorage.setItem('orbit_teamMembers', JSON.stringify(teamMembers)); }, [teamMembers]);
  useEffect(() => { localStorage.setItem('orbit_lifeAreas', JSON.stringify(lifeAreas)); }, [lifeAreas]);
  useEffect(() => { localStorage.setItem('orbit_visions', JSON.stringify(visions)); }, [visions]);
  useEffect(() => { localStorage.setItem('orbit_timeSlots', JSON.stringify(timeSlots)); }, [timeSlots]);
  useEffect(() => { localStorage.setItem('orbit_dayParts', JSON.stringify(dayParts)); }, [dayParts]);
  useEffect(() => { localStorage.setItem('orbit_statusUpdates', JSON.stringify(statusUpdates)); }, [statusUpdates]);
  useEffect(() => { localStorage.setItem('orbit_reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('orbit_retrospectives', JSON.stringify(retrospectives)); }, [retrospectives]);
  useEffect(() => { localStorage.setItem('orbit_reminders', JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { localStorage.setItem('orbit_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('orbit_notificationSettings', JSON.stringify(notificationSettings)); }, [notificationSettings]);
  useEffect(() => { localStorage.setItem('orbit_taskTemplates', JSON.stringify(taskTemplates)); }, [taskTemplates]);
  useEffect(() => { localStorage.setItem('orbit_objectiveTemplates', JSON.stringify(objectiveTemplates)); }, [objectiveTemplates]);
  useEffect(() => { localStorage.setItem('orbit_quickActions', JSON.stringify(quickActions)); }, [quickActions]);
  useEffect(() => { localStorage.setItem('orbit_deletedGoogleTaskIds', JSON.stringify(deletedGoogleTaskIds)); }, [deletedGoogleTaskIds]);
  useEffect(() => { localStorage.setItem('orbit_deletedTaskIds', JSON.stringify(deletedTaskIds)); }, [deletedTaskIds]);
  
  // Cleanup oude deletedTaskIds (ouder dan 14 dagen)
  const cleanupOldDeletedTaskIds = () => {
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    setDeletedTaskIds(prev => {
      const filtered = prev.filter(entry => {
        const deletedAt = new Date(entry.deletedAt);
        return deletedAt > fourteenDaysAgo;
      });
      
      if (filtered.length !== prev.length) {
        console.log(`🧹 Cleaned up ${prev.length - filtered.length} old deleted task IDs (older than 14 days)`);
      }
      
      return filtered;
    });
  };

  // Run cleanup daily
  useEffect(() => {
    // Run cleanup on mount
    cleanupOldDeletedTaskIds();
    
    // Run cleanup daily (every 24 hours)
    const interval = setInterval(() => {
      cleanupOldDeletedTaskIds();
    }, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Sync deletedTaskIds to Firebase (with both formats for backward compatibility)
  useEffect(() => {
    if (isAuthenticated() && deletedTaskIds.length > 0) {
      syncEntityToFirebase('deletedTaskIds', { 
        ids: deletedTaskIds.map(e => e.id), // Old format for backward compatibility
        entries: deletedTaskIds // New format with timestamps
      }, 'user').catch(err => 
        console.error('Error syncing deletedTaskIds to Firebase:', err)
      );
    }
  }, [deletedTaskIds]);
  // Theme management
  useEffect(() => {
    localStorage.setItem('orbit_theme', theme);
    // Update body classes
    document.documentElement.classList.remove('dark', 'black');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'black') {
      document.documentElement.classList.add('black');
    }
    // Update primary color - reduce saturation for dark/black themes
    const primaryColor = (theme === 'dark' || theme === 'black') ? reduceSaturation(accentColor) : accentColor;
    document.documentElement.style.setProperty('--color-primary', primaryColor);
  }, [theme, accentColor, reduceSaturation]);

  // Legacy darkMode support (for backward compatibility)
  useEffect(() => { 
      localStorage.setItem('orbit_accent', JSON.stringify(accentColor)); 
      const primaryColor = darkMode ? reduceSaturation(accentColor) : accentColor;
      document.documentElement.style.setProperty('--color-primary', primaryColor);
  }, [accentColor, darkMode]);

  useEffect(() => {
      localStorage.setItem('orbit_darkMode', JSON.stringify(darkMode));
      if (darkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      // Update primary color when dark mode changes
      const primaryColor = darkMode ? reduceSaturation(accentColor) : accentColor;
      document.documentElement.style.setProperty('--color-primary', primaryColor);
  }, [darkMode, accentColor]);

  useEffect(() => {
      localStorage.setItem('orbit_showCategory', JSON.stringify(showCategory));
  }, [showCategory]);

  // Sync primary user (role 'You') with userProfile
  useEffect(() => {
      const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
      setTeamMembers(prev => {
          const primaryUser = prev.find(m => m.role === 'You');
          
          if (primaryUser) {
              // Update existing primary user only if changed
              if (primaryUser.name !== fullName || primaryUser.image !== userProfile.image) {
                  return prev.map(m => 
                      m.role === 'You' 
                          ? { ...m, name: fullName || 'You', image: userProfile.image || m.image }
                          : m
                  );
              }
              return prev;
          } else {
              // Create primary user if it doesn't exist
              const newPrimaryUser: TeamMember = {
                  id: 'primary-user',
                  name: fullName || 'You',
                  role: 'You',
                  image: userProfile.image || ''
              };
              return [newPrimaryUser, ...prev];
          }
      });
  }, [userProfile.firstName, userProfile.lastName, userProfile.image]);

  // Firebase Sync: Initial sync and auth state watching
  useEffect(() => {
    let isMounted = true;
    let syncInProgress = false;
    
    const unsubscribe = onAuthStateChange(async (user) => {
      if (!isMounted) return;
      
      if (user) {
        console.log('✅ User authenticated:', {
          email: user.email,
          uid: user.uid,
          displayName: user.displayName,
          providerId: user.providerData[0]?.providerId,
          timestamp: new Date().toISOString()
        });
        
        // Prevent multiple simultaneous syncs
        if (syncInProgress) {
          console.log('⚠️ Sync already in progress, skipping...');
          return;
        }
        
        syncInProgress = true;
        console.log('🔄 Starting Firebase sync for user:', user.uid);
        
        try {
          // Initial sync from Firebase
          const syncResult = await syncAllFromFirebase();
          console.log('📥 Sync result:', syncResult.success ? 'Success' : 'Failed', syncResult.error || '');
          
          if (syncResult.success && syncResult.data) {
            // Check if Firebase has data
            const hasFirebaseData = Object.values(syncResult.data).some(
              (arr: any) => Array.isArray(arr) && arr.length > 0
            ) || syncResult.data.userProfile !== null;

            if (hasFirebaseData) {
              // Merge strategy: merge Firebase data with local data, avoiding duplicates
              // Helper function to merge arrays by ID, keeping the most recent version
              const mergeArrays = <T extends { id: string }>(local: T[], firebase: T[], deletedIds: string[] = []): T[] => {
                const merged = new Map<string, T>();
                // First add all local items (exclude deleted)
                local.forEach(item => {
                  if (!deletedIds.includes(item.id)) {
                    merged.set(item.id, item);
                  }
                });
                // Then add/update with Firebase items (exclude deleted), Firebase wins on conflict
                firebase.forEach(item => {
                  if (!deletedIds.includes(item.id)) {
                    merged.set(item.id, item);
                  }
                });
                return Array.from(merged.values());
              };

              // Sync deletedTaskIds from Firebase first - CRITICAL: calculate merged list before tasks sync
              let mergedDeletedTaskIds: Array<{ id: string; deletedAt: string }> = [...deletedTaskIds];
              
              if (syncResult.data.deletedTaskIds) {
                // Firebase kan entries hebben (nieuwe format) of ids (oude format)
                const firebaseEntries = syncResult.data.deletedTaskIds.entries || [];
                const firebaseIds = syncResult.data.deletedTaskIds.ids || [];
                
                // Migrate oude format naar nieuwe format
                const migratedFirebase: Array<{ id: string; deletedAt: string }> = [];
                if (firebaseEntries.length > 0) {
                  migratedFirebase.push(...firebaseEntries);
                } else if (firebaseIds.length > 0) {
                  // Oude format: array van strings, converteer naar nieuwe format
                  const now = new Date().toISOString();
                  migratedFirebase.push(...firebaseIds.map((id: string) => ({ id, deletedAt: now })));
                }
                
                // Merge: combine local and Firebase deleted IDs, voorkom duplicates
                const mergedMap = new Map<string, { id: string; deletedAt: string }>();
                deletedTaskIds.forEach(entry => mergedMap.set(entry.id, entry));
                migratedFirebase.forEach(entry => {
                  if (!mergedMap.has(entry.id)) {
                    mergedMap.set(entry.id, entry);
                  } else {
                    // Keep the oldest deletedAt timestamp
                    const existing = mergedMap.get(entry.id)!;
                    if (new Date(entry.deletedAt) < new Date(existing.deletedAt)) {
                      mergedMap.set(entry.id, entry);
                    }
                  }
                });
                
                mergedDeletedTaskIds = Array.from(mergedMap.values());
                
                // Update state
                setDeletedTaskIds(mergedDeletedTaskIds);
              }

              // Merge tasks, excluding deleted ones - use mergedDeletedTaskIds to ensure we have the latest
              if (syncResult.data.tasks.length > 0) {
                const deletedIds = mergedDeletedTaskIds.map(e => e.id);
                setTasks(prev => {
                  // Filter out deleted tasks from both local and Firebase before merging
                  const filteredLocal = prev.filter(t => !deletedIds.includes(t.id));
                  const filteredFirebase = syncResult.data.tasks.filter(t => !deletedIds.includes(t.id));
                  return mergeArrays(filteredLocal, filteredFirebase, []);
                });
              }
              if (syncResult.data.habits.length > 0) {
                setHabits(prev => mergeArrays(prev, syncResult.data.habits));
              }
              if (syncResult.data.objectives.length > 0) {
                setObjectives(prev => mergeArrays(prev, syncResult.data.objectives));
              }
              if (syncResult.data.keyResults.length > 0) {
                setKeyResults(prev => mergeArrays(prev, syncResult.data.keyResults));
              }
              if (syncResult.data.lifeAreas.length > 0) {
                setLifeAreas(prev => mergeArrays(prev, syncResult.data.lifeAreas));
              }
              if (syncResult.data.timeSlots.length > 0) {
                setTimeSlots(prev => mergeArrays(prev, syncResult.data.timeSlots));
              }
              if (syncResult.data.friends.length > 0) {
                setFriends(prev => mergeArrays(prev, syncResult.data.friends));
              }
              if (syncResult.data.statusUpdates.length > 0) {
                setStatusUpdates(prev => mergeArrays(prev, syncResult.data.statusUpdates));
              }
              if (syncResult.data.reviews && syncResult.data.reviews.length > 0) {
                setReviews(prev => mergeArrays(prev, syncResult.data.reviews));
              }
              if (syncResult.data.retrospectives && syncResult.data.retrospectives.length > 0) {
                setRetrospectives(prev => mergeArrays(prev, syncResult.data.retrospectives));
              }
              if (syncResult.data.userProfile) {
                setUserProfile(prev => ({ ...prev, ...syncResult.data.userProfile }));
              }
            } else {
              // No Firebase data, upload local data
              console.log('📤 No Firebase data found, uploading local data...');
              try {
                const uploadResult = await syncAllToFirebase({
                  tasks,
                  habits,
                  objectives,
                  keyResults,
                  lifeAreas,
                  timeSlots,
                  friends,
                  statusUpdates,
                  reviews,
                  retrospectives,
                  userProfile,
                  deletedTaskIds: deletedTaskIds.map(e => e.id) // Send as array for compatibility
                });
                console.log('✅ Local data uploaded:', uploadResult.success ? 'Success' : 'Failed', uploadResult.errors || '');
              } catch (uploadError) {
                console.error('❌ Error uploading local data:', uploadError);
              }
            }
          } else {
            console.warn('⚠️ Sync failed:', syncResult.error);
          }
        } catch (error) {
          console.error('❌ Error syncing from Firebase:', error);
        } finally {
          syncInProgress = false;
        }

        // Set up real-time listeners for each collection
        const unsubscribers: (() => void)[] = [];

        // Watch for changes in Firebase - merge with local data to avoid duplicates
        // Helper function to merge arrays by ID, keeping Firebase version if both exist
        // Exclude deleted items
        const mergeArrays = <T extends { id: string }>(local: T[], firebase: T[], deletedIds: string[] = []): T[] => {
          const merged = new Map<string, T>();
          // First add all local items (exclude deleted)
          local.forEach(item => {
            if (!deletedIds.includes(item.id)) {
              merged.set(item.id, item);
            }
          });
          // Then add/update with Firebase items (exclude deleted), Firebase wins on conflict
          firebase.forEach(item => {
            if (!deletedIds.includes(item.id)) {
              merged.set(item.id, item);
            }
          });
          return Array.from(merged.values());
        };

        // Watch deletedTaskIds from Firebase
        unsubscribers.push(watchFirebaseChanges('deletedTaskIds', (firebaseDeleted) => {
          if (isClearingData) return;
          if (firebaseDeleted.length > 0) {
            const firebaseData = firebaseDeleted[0];
            setDeletedTaskIds(prev => {
              // Firebase kan entries hebben (nieuwe format) of ids (oude format)
              const firebaseEntries = firebaseData?.entries || [];
              const firebaseIds = firebaseData?.ids || [];
              
              // Migrate oude format naar nieuwe format
              const migratedFirebase: Array<{ id: string; deletedAt: string }> = [];
              if (firebaseEntries.length > 0) {
                migratedFirebase.push(...firebaseEntries);
              } else if (firebaseIds.length > 0) {
                // Oude format: array van strings, converteer naar nieuwe format
                const now = new Date().toISOString();
                migratedFirebase.push(...firebaseIds.map((id: string) => ({ id, deletedAt: now })));
              }
              
              // Merge: combine local and Firebase deleted IDs, voorkom duplicates
              const mergedMap = new Map<string, { id: string; deletedAt: string }>();
              prev.forEach(entry => mergedMap.set(entry.id, entry));
              migratedFirebase.forEach(entry => {
                if (!mergedMap.has(entry.id)) {
                  mergedMap.set(entry.id, entry);
                } else {
                  // Keep the oldest deletedAt timestamp
                  const existing = mergedMap.get(entry.id)!;
                  if (new Date(entry.deletedAt) < new Date(existing.deletedAt)) {
                    mergedMap.set(entry.id, entry);
                  }
                }
              });
              
              return Array.from(mergedMap.values());
            });
          }
        }));

        unsubscribers.push(watchFirebaseChanges('tasks', (firebaseTasks) => {
          // Don't restore data if we're in the middle of clearing
          if (isClearingData) return;
          console.log('📥 Firebase tasks listener triggered:', {
            firebaseTasksCount: firebaseTasks.length,
            firebaseTaskIds: firebaseTasks.map(t => t.id),
            timestamp: new Date().toISOString()
          });
          
          // Always merge, even if firebaseTasks is empty (to handle deletions)
          setTasks(prev => {
            // Get current deletedTaskIds from ref (always up-to-date)
            const currentDeletedIds = deletedTaskIdsRef.current.map(e => e.id);
            console.log('🔄 Merging tasks:', {
              localCount: prev.length,
              firebaseCount: firebaseTasks.length,
              deletedIdsCount: currentDeletedIds.length,
              deletedIds: currentDeletedIds,
              localTaskIds: prev.map(t => t.id),
              firebaseTaskIds: firebaseTasks.map(t => t.id)
            });
            
            // Filter out deleted tasks from both local and Firebase before merging
            const filteredLocal = prev.filter(t => !currentDeletedIds.includes(t.id));
            const filteredFirebase = firebaseTasks.filter(t => !currentDeletedIds.includes(t.id));
            
            // Merge arrays: Firebase wins on conflict (newer data)
            const merged = new Map<string, Task>();
            
            // First add all local items
            filteredLocal.forEach(item => {
              merged.set(item.id, item);
            });
            
            // Then add/update with Firebase items (Firebase wins on conflict)
            filteredFirebase.forEach(item => {
              merged.set(item.id, item);
            });
            
            const mergedArray = Array.from(merged.values());
            
            // Find new tasks from Firebase
            const newTasks = filteredFirebase.filter(f => !prev.some(p => p.id === f.id));
            
            console.log('✅ Tasks merged:', {
              filteredLocalCount: filteredLocal.length,
              filteredFirebaseCount: filteredFirebase.length,
              mergedCount: mergedArray.length,
              newTaskIds: newTasks.map(t => t.id),
              newTaskTitles: newTasks.map(t => t.title)
            });
            
            if (newTasks.length > 0) {
              console.log('🎉 New tasks detected from Firebase:', newTasks.map(t => ({ id: t.id, title: t.title })));
            }
            
            return mergedArray;
          });
        }));

        unsubscribers.push(watchFirebaseChanges('objectives', (firebaseObjectives) => {
          if (isClearingData) return;
          if (firebaseObjectives.length > 0) {
            setObjectives(prev => mergeArrays(prev, firebaseObjectives));
          }
        }));

        unsubscribers.push(watchFirebaseChanges('keyResults', (firebaseKeyResults) => {
          if (isClearingData) return;
          if (firebaseKeyResults.length > 0) {
            setKeyResults(prev => mergeArrays(prev, firebaseKeyResults));
          }
        }));

        unsubscribers.push(watchFirebaseChanges('timeSlots', (firebaseTimeSlots) => {
          if (isClearingData) return;
          if (firebaseTimeSlots.length > 0) {
            setTimeSlots(prev => mergeArrays(prev, firebaseTimeSlots));
          }
        }));

        unsubscribers.push(watchFirebaseChanges('habits', (firebaseHabits) => {
          if (isClearingData) return;
          if (firebaseHabits.length > 0) {
            setHabits(prev => mergeArrays(prev, firebaseHabits));
          }
        }));

        unsubscribers.push(watchFirebaseChanges('lifeAreas', (firebaseLifeAreas) => {
          if (isClearingData) return;
          if (firebaseLifeAreas.length > 0) {
            setLifeAreas(prev => mergeArrays(prev, firebaseLifeAreas));
          }
        }));

        unsubscribers.push(watchFirebaseChanges('friends', (firebaseFriends) => {
          if (isClearingData) return;
          if (firebaseFriends.length > 0) {
            setFriends(prev => mergeArrays(prev, firebaseFriends));
          }
        }));

        unsubscribers.push(watchFirebaseChanges('statusUpdates', (firebaseStatusUpdates) => {
          if (isClearingData) return;
          if (firebaseStatusUpdates.length > 0) {
            setStatusUpdates(prev => mergeArrays(prev, firebaseStatusUpdates));
          }
        }));

        unsubscribers.push(watchFirebaseChanges('reviews', (firebaseReviews) => {
          if (isClearingData) return;
          if (firebaseReviews.length > 0) {
            setReviews(prev => mergeArrays(prev, firebaseReviews));
          }
        }));

        unsubscribers.push(watchFirebaseChanges('retrospectives', (firebaseRetrospectives) => {
          if (isClearingData) return;
          if (firebaseRetrospectives.length > 0) {
            setRetrospectives(prev => mergeArrays(prev, firebaseRetrospectives));
          }
        }));

        // Cleanup function for unsubscribers
        return () => {
          unsubscribers.forEach(unsub => unsub());
        };
      } else {
        console.log('👤 User not authenticated');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // Only run once on mount - eslint-disable-line react-hooks/exhaustive-deps

  // --- Register SyncService Callbacks ---
  useEffect(() => {
    const callbacks: DataContextCallbacks = {
      getTasks: () => tasks,
      getTimeSlots: () => timeSlots,
      getObjectives: () => objectives,
      addTask: (task: Task) => addTask(task),
      updateTask: (task: Task) => updateTask(task),
      addTimeSlot: (timeSlot: TimeSlot) => addTimeSlot(timeSlot),
      updateTimeSlot: (timeSlot: TimeSlot) => updateTimeSlot(timeSlot),
      updateObjective: (objective: Objective) => updateObjective(objective),
    };
    syncService.registerDataContextCallbacks(callbacks);
  }, [tasks, timeSlots, objectives]); // Re-register when data changes

  // --- Actions ---

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...profile };
      // Auto-sync to Firebase (profile is stored in users/{userId}/profile/data)
      if (isAuthenticated()) {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const profileRef = doc(db, `users/${userId}/profile`, 'data');
          setDoc(profileRef, {
            ...updated,
            updatedAt: serverTimestamp(),
            syncedAt: serverTimestamp(),
          }, { merge: true }).catch(error => {
            console.error('Error syncing userProfile to Firebase:', error);
          });
        }
      }
      return updated;
    });
  };

  const addTask = (item: Task) => {
    // Check if task already exists (prevent duplicates)
    const existingIndex = tasks.findIndex(t => t.id === item.id);
    if (existingIndex >= 0) {
      // Update existing task instead of adding duplicate
      updateTask(item);
      return;
    }
    // Add createdAt timestamp if not present
    const taskWithTimestamp: Task = {
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    };
    console.log('➕ Adding task:', {
      id: taskWithTimestamp.id,
      title: taskWithTimestamp.title,
      isAuthenticated: isAuthenticated(),
      timestamp: new Date().toISOString()
    });
    setTasks([...tasks, taskWithTimestamp]);
    // Auto-sync to Google Tasks
    syncService.queueSync('task', 'create', item.id, item);
    // Auto-sync to Firebase (async, fire and forget)
    if (isAuthenticated()) {
      syncEntityToFirebase('tasks', taskWithTimestamp, taskWithTimestamp.id)
        .then(result => {
          console.log('✅ Task synced to Firebase:', {
            taskId: taskWithTimestamp.id,
            success: result.success,
            error: result.error
          });
        })
        .catch(error => {
          console.error('❌ Error syncing task to Firebase:', error);
        });
    } else {
      console.warn('⚠️ Cannot sync task to Firebase: user not authenticated');
    }
  };
  const updateTask = (item: Task) => {
    setTasks(tasks.map(t => t.id === item.id ? item : t));
    // Auto-sync to Google Tasks
    syncService.queueSync('task', 'update', item.id, item);
    // Auto-sync to Firebase (async, fire and forget)
    if (isAuthenticated()) {
      syncEntityToFirebase('tasks', item, item.id).catch(error => {
        console.error('Error syncing task to Firebase:', error);
      });
    }
  };
  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(tasks.filter(t => t.id !== id));
    
    // Voeg task ID toe aan deletedTaskIds om te voorkomen dat Firebase sync deze terugzet
    setDeletedTaskIds(prev => {
      const now = new Date().toISOString();
      if (!prev.find(e => e.id === id)) {
        return [...prev, { id, deletedAt: now }];
      }
      return prev;
    });
    
    // Als deze task een googleTaskId heeft, voeg deze toe aan deletedGoogleTaskIds
    // om te voorkomen dat deze opnieuw wordt geïmporteerd
    if (task?.googleTaskId) {
      setDeletedGoogleTaskIds(prev => {
        if (!prev.includes(task.googleTaskId!)) {
          return [...prev, task.googleTaskId!];
        }
        return prev;
      });
    }
    
    // Auto-sync delete to Google Tasks
    if (task) {
      syncService.queueSync('task', 'delete', id, null);
    }
    // Auto-sync delete to Firebase (async, fire and forget)
    if (isAuthenticated()) {
      deleteEntityFromFirebase('tasks', id).catch(error => {
        console.error('Error deleting task from Firebase:', error);
      });
    }
  };

  const deleteCompletedTasks = () => {
    const completedTasks = tasks.filter(t => t.completed);
    const completedIds = completedTasks.map(t => t.id);
    
    // Voeg alle verwijderde task IDs toe aan deletedTaskIds
    setDeletedTaskIds(prev => {
      const now = new Date().toISOString();
      const newEntries = completedIds
        .filter(id => !prev.find(e => e.id === id))
        .map(id => ({ id, deletedAt: now }));
      return newEntries.length > 0 ? [...prev, ...newEntries] : prev;
    });
    
    // Verzamel Google Task IDs van verwijderde taken
    const googleTaskIdsToBlock = completedTasks
      .filter(t => t.googleTaskId)
      .map(t => t.googleTaskId!);
    
    // Voeg Google Task IDs toe aan deletedGoogleTaskIds
    if (googleTaskIdsToBlock.length > 0) {
      setDeletedGoogleTaskIds(prev => {
        const newIds = googleTaskIdsToBlock.filter(id => !prev.includes(id));
        return newIds.length > 0 ? [...prev, ...newIds] : prev;
      });
    }
    
    // Delete all completed tasks
    setTasks(tasks.filter(t => !t.completed));
    
    // Sync deletions
    completedTasks.forEach(task => {
      syncService.queueSync('task', 'delete', task.id, null);
      if (isAuthenticated()) {
        deleteEntityFromFirebase('tasks', task.id).catch(error => {
          console.error('Error deleting task from Firebase:', error);
        });
      }
    });
    
    return completedIds.length;
  };

  const addHabit = (item: Habit) => {
    // Check if habit already exists (prevent duplicates)
    const existingIndex = habits.findIndex(h => h.id === item.id);
    if (existingIndex >= 0) {
      // Update existing habit instead of adding duplicate
      const newItem = {
        ...item,
        weeklyProgress: item.weeklyProgress || [false, false, false, false, false, false, false]
      };
      updateHabit(newItem);
      return;
    }
    const newItem = {
        ...item,
        weeklyProgress: item.weeklyProgress || [false, false, false, false, false, false, false]
    };
    setHabits([...habits, newItem]);
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('habits', newItem, newItem.id).catch(error => {
        console.error('Error syncing habit to Firebase:', error);
      });
    }
  };
  const updateHabit = (item: Habit) => {
    setHabits(habits.map(h => h.id === item.id ? item : h));
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('habits', item, item.id).catch(error => {
        console.error('Error syncing habit to Firebase:', error);
      });
    }
  };
  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    // Auto-sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('habits', id).catch(error => {
        console.error('Error deleting habit from Firebase:', error);
      });
    }
  };

  const addFriend = (item: Friend) => {
    // Check if friend already exists (prevent duplicates)
    const existingIndex = friends.findIndex(f => f.id === item.id);
    if (existingIndex >= 0) {
      // Update existing friend instead of adding duplicate
      updateFriend(item);
      return;
    }
    setFriends([...friends, item]);
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('friends', item, item.id).catch(error => {
        console.error('Error syncing friend to Firebase:', error);
      });
    }
  };
  const updateFriend = (item: Friend) => {
    setFriends(friends.map(f => f.id === item.id ? item : f));
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('friends', item, item.id).catch(error => {
        console.error('Error syncing friend to Firebase:', error);
      });
    }
  };
  const deleteFriend = (id: string) => {
    setFriends(friends.filter(f => f.id !== id));
    // Auto-sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('friends', id).catch(error => {
        console.error('Error deleting friend from Firebase:', error);
      });
    }
  };

  const addObjective = (item: Objective) => {
    // Check if objective already exists (prevent duplicates)
    const existingIndex = objectives.findIndex(o => o.id === item.id);
    if (existingIndex >= 0) {
      // Update existing objective instead of adding duplicate
      updateObjective(item);
      return;
    }
    setObjectives([...objectives, item]);
    // Auto-sync goal deadline to Google Calendar
    syncService.queueSync('objective', 'create', item.id, item);
    // Auto-sync to Firebase (async, fire and forget)
    if (isAuthenticated()) {
      syncEntityToFirebase('objectives', item, item.id).catch(error => {
        console.error('Error syncing objective to Firebase:', error);
      });
    }
  };
  const updateObjective = (item: Objective) => {
    setObjectives(objectives.map(o => o.id === item.id ? item : o));
    // Auto-sync goal deadline to Google Calendar
    syncService.queueSync('objective', 'update', item.id, item);
    // Auto-sync to Firebase (async, fire and forget)
    if (isAuthenticated()) {
      syncEntityToFirebase('objectives', item, item.id).catch(error => {
        console.error('Error syncing objective to Firebase:', error);
      });
    }
  };
  const deleteObjective = (id: string) => {
    setObjectives(objectives.filter(o => o.id !== id));
    // Cascade: Delete all key results linked to this objective
    setKeyResults(keyResults.filter(k => k.objectiveId !== id)); 
    // Cascade: Unlink all tasks linked to this objective
    setTasks(tasks.map(t => t.objectiveId === id ? { ...t, objectiveId: undefined } : t));
    // Cascade: Unlink all habits linked to this objective
    setHabits(habits.map(h => h.objectiveId === id ? { ...h, objectiveId: undefined } : h));
    // Cascade: Unlink all time slots linked to this objective
    setTimeSlots(timeSlots.map(ts => ts.objectiveId === id ? { ...ts, objectiveId: undefined } : ts));
    // Auto-sync delete to Google Calendar
    const objective = objectives.find(o => o.id === id);
    if (objective) {
      syncService.queueSync('objective', 'delete', id, null);
    }
    // Auto-sync delete to Firebase (async, fire and forget)
    if (isAuthenticated()) {
      deleteEntityFromFirebase('objectives', id).catch(error => {
        console.error('Error deleting objective from Firebase:', error);
      });
    }
  };

  // Helper function to calculate objective progress from key results
  const calculateObjectiveProgress = (objectiveId: string, krList: KeyResult[]): number => {
    const linkedKRs = krList.filter(kr => kr.objectiveId === objectiveId);
    if (linkedKRs.length === 0) return 0;
    
    const totalProgress = linkedKRs.reduce((acc, kr) => {
      const krProgress = Math.min(Math.round((kr.current / kr.target) * 100), 100);
      return acc + krProgress;
    }, 0);
    
    return Math.round(totalProgress / linkedKRs.length);
  };

  const addKeyResult = (item: KeyResult) => {
    // Check if key result already exists (prevent duplicates)
    const existingIndex = keyResults.findIndex(k => k.id === item.id);
    if (existingIndex >= 0) {
      // Update existing key result instead of adding duplicate
      updateKeyResult(item);
      return;
    }
    
    // Ensure required fields have defaults
    const keyResultWithDefaults: KeyResult = {
      ...item,
      measurementType: item.measurementType || 'number',
      decimals: item.decimals !== undefined ? item.decimals : 0,
      status: item.status || 'On Track',
      current: item.current !== undefined ? item.current : 0,
      target: item.target !== undefined ? item.target : 0,
    };
    
    setKeyResults([...keyResults, keyResultWithDefaults]);
    
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('keyResults', keyResultWithDefaults, keyResultWithDefaults.id).catch(error => {
        console.error('Error syncing keyResult to Firebase:', error);
      });
    }
  };
  
  const updateKeyResult = (item: KeyResult) => {
    setKeyResults(keyResults.map(k => k.id === item.id ? item : k));
  };
  
  const deleteKeyResult = (id: string) => {
    setKeyResults(keyResults.filter(k => k.id !== id));
    // Cascade: Unlink all habits linked to this key result
    setHabits(habits.map(h => h.linkedKeyResultId === id ? { ...h, linkedKeyResultId: undefined } : h));
    // Cascade: Unlink all tasks linked to this key result
    setTasks(tasks.map(t => t.keyResultId === id ? { ...t, keyResultId: undefined } : t));
  };

  const addPlace = (item: Place) => {
    // Check if place already exists (prevent duplicates)
    const existingIndex = places.findIndex(p => p.id === item.id);
    if (existingIndex >= 0) {
      // Place already exists, don't add duplicate
      return;
    }
    setPlaces([...places, item]);
  };
  const deletePlace = (id: string) => setPlaces(places.filter(p => p.id !== id));

  const addTeamMember = (item: TeamMember) => {
    // Check if team member already exists (prevent duplicates)
    const existingIndex = teamMembers.findIndex(t => t.id === item.id);
    if (existingIndex >= 0) {
      // Team member already exists, don't add duplicate
      return;
    }
    setTeamMembers([...teamMembers, item]);
  };
  const deleteTeamMember = (id: string) => setTeamMembers(teamMembers.filter(t => t.id !== id));

  // Life Planner actions
  const addLifeArea = (item: LifeArea) => {
    // Check if life area already exists (prevent duplicates)
    const existingIndex = lifeAreas.findIndex(la => la.id === item.id);
    if (existingIndex >= 0) {
      // Update existing life area instead of adding duplicate
      updateLifeArea(item);
      return;
    }
    setLifeAreas([...lifeAreas, item]);
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('lifeAreas', item, item.id).catch(error => {
        console.error('Error syncing lifeArea to Firebase:', error);
      });
    }
  };
  const updateLifeArea = (item: LifeArea) => {
    setLifeAreas(lifeAreas.map(la => la.id === item.id ? item : la));
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('lifeAreas', item, item.id).catch(error => {
        console.error('Error syncing lifeArea to Firebase:', error);
      });
    }
  };
  const deleteLifeArea = (id: string) => {
    setLifeAreas(lifeAreas.filter(la => la.id !== id));
    // Cascade: Delete related visions
    setVisions(visions.filter(v => v.lifeAreaId !== id));
    // Cascade: Unlink all objectives linked to this life area
    setObjectives(objectives.map(obj => obj.lifeAreaId === id ? { ...obj, lifeAreaId: '' } : obj));
    // Cascade: Unlink all tasks linked to this life area
    setTasks(tasks.map(t => t.lifeAreaId === id ? { ...t, lifeAreaId: undefined } : t));
    // Cascade: Unlink all habits linked to this life area
    setHabits(habits.map(h => h.lifeAreaId === id ? { ...h, lifeAreaId: undefined } : h));
    // Cascade: Unlink all time slots linked to this life area
    setTimeSlots(timeSlots.map(ts => ts.lifeAreaId === id ? { ...ts, lifeAreaId: undefined } : ts));
    // Auto-sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('lifeAreas', id).catch(error => {
        console.error('Error deleting lifeArea from Firebase:', error);
      });
    }
  };
  const reorderLifeAreas = (newOrder: LifeArea[]) => setLifeAreas(newOrder);

  const addVision = (item: Vision) => {
    // Check if vision already exists (prevent duplicates)
    const existingIndex = visions.findIndex(v => v.id === item.id);
    if (existingIndex >= 0) {
      // Update existing vision instead of adding duplicate
      updateVision(item);
      return;
    }
    setVisions([...visions, item]);
  };
  const updateVision = (item: Vision) => setVisions(visions.map(v => v.id === item.id ? item : v));
  const deleteVision = (id: string) => setVisions(visions.filter(v => v.id !== id));

  const addTimeSlot = async (item: TimeSlot) => {
    // Check if time slot already exists (prevent duplicates)
    const existingIndex = timeSlots.findIndex(ts => ts.id === item.id);
    if (existingIndex >= 0) {
      // Update existing time slot instead of adding duplicate
      await updateTimeSlot(item);
      return;
    }
    setTimeSlots([...timeSlots, item]);
    // Auto-sync to Google Calendar
    syncService.queueSync('timeSlot', 'create', item.id, item);
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      try {
        await syncEntityToFirebase('timeSlots', item, item.id);
      } catch (error) {
        console.error('Error syncing timeSlot to Firebase:', error);
      }
    }
  };
  const updateTimeSlot = async (item: TimeSlot) => {
    setTimeSlots(timeSlots.map(ts => ts.id === item.id ? item : ts));
    // Auto-sync to Google Calendar
    syncService.queueSync('timeSlot', 'update', item.id, item);
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      try {
        await syncEntityToFirebase('timeSlots', item, item.id);
      } catch (error) {
        console.error('Error syncing timeSlot to Firebase:', error);
      }
    }
  };
  const deleteTimeSlot = async (id: string) => {
    setTimeSlots(timeSlots.filter(ts => ts.id !== id));
    // Cascade: Unlink all tasks linked to this time slot
    // Note: Tasks don't have a direct timeSlotId field, but they might be linked via scheduledDate
    // For now, we'll unlink tasks that reference this time slot's date/time
    const timeSlot = timeSlots.find(ts => ts.id === id);
    if (timeSlot) {
      // Unlink tasks that are scheduled for this time slot's date
      // This is a soft link, so we just ensure tasks aren't orphaned
      setTasks(tasks.map(t => {
        // If task has calendarEventId matching this time slot, unlink it
        // Note: This assumes calendarEventId might reference the time slot
        return t;
      }));
    }
    // Auto-sync delete to Google Calendar
    if (timeSlot) {
      syncService.queueSync('timeSlot', 'delete', id, null);
    }
    // Auto-sync delete to Firebase
    if (isAuthenticated()) {
      try {
        await deleteEntityFromFirebase('timeSlots', id);
      } catch (error) {
        console.error('Error deleting timeSlot from Firebase:', error);
      }
    }
  };

  const updateDayPart = (item: DayPart) => {
    // If item doesn't exist, add it; otherwise update it
    const exists = dayParts.find(dp => dp.id === item.id);
    if (exists) {
      setDayParts(dayParts.map(dp => dp.id === item.id ? item : dp));
    } else {
      setDayParts([...dayParts, item]);
    }
  };
  const deleteDayPart = (id: string) => setDayParts(dayParts.filter(dp => dp.id !== id));
  const reorderDayParts = (newOrder: DayPart[]) => setDayParts(newOrder);

  // Status Updates
  const addStatusUpdate = (update: StatusUpdate) => {
    // Check if status update already exists (prevent duplicates)
    const existingIndex = statusUpdates.findIndex(su => su.id === update.id);
    if (existingIndex >= 0) {
      // Update existing status update instead of adding duplicate
      updateStatusUpdate(update);
      return;
    }
    setStatusUpdates([...statusUpdates, update]);
    // Update ook de current waarde en status van het Key Result
    const kr = keyResults.find(k => k.id === update.keyResultId);
    if (kr) {
      updateKeyResult({ ...kr, current: update.currentValue, status: update.status });
    }
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('statusUpdates', update, update.id).catch(error => {
        console.error('Error syncing statusUpdate to Firebase:', error);
      });
    }
  };
  const updateStatusUpdate = (update: StatusUpdate) => {
    setStatusUpdates(statusUpdates.map(su => su.id === update.id ? update : su));
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('statusUpdates', update, update.id).catch(error => {
        console.error('Error syncing statusUpdate to Firebase:', error);
      });
    }
  };
  const deleteStatusUpdate = (id: string) => {
    setStatusUpdates(statusUpdates.filter(su => su.id !== id));
    // Auto-sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('statusUpdates', id).catch(error => {
        console.error('Error deleting statusUpdate from Firebase:', error);
      });
    }
  };
  const getStatusUpdatesByKeyResult = (keyResultId: string): StatusUpdate[] => {
    return statusUpdates.filter(su => su.keyResultId === keyResultId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Planning & Review functions
  const addReview = (review: Review) => {
    const existingIndex = reviews.findIndex(r => r.id === review.id);
    if (existingIndex >= 0) {
      updateReview(review);
      return;
    }
    setReviews([...reviews, review]);
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('reviews', review, review.id).catch(error => {
        console.error('Error syncing review to Firebase:', error);
      });
    }
  };

  const updateReview = (review: Review) => {
    setReviews(reviews.map(r => r.id === review.id ? review : r));
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('reviews', review, review.id).catch(error => {
        console.error('Error syncing review to Firebase:', error);
      });
    }
  };

  const deleteReview = (id: string) => {
    setReviews(reviews.filter(r => r.id !== id));
    // Auto-sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('reviews', id).catch(error => {
        console.error('Error deleting review from Firebase:', error);
      });
    }
  };

  const getReviewByDate = (date: string, type: 'weekly' | 'monthly'): Review | undefined => {
    return reviews.find(r => r.type === type && r.date === date);
  };

  const getLatestReview = (type: 'weekly' | 'monthly'): Review | undefined => {
    const filtered = reviews.filter(r => r.type === type);
    if (filtered.length === 0) return undefined;
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const generateReviewInsights = useCallback((review: Review): ReviewInsight[] => {
    const insights: ReviewInsight[] = [];
    const now = new Date();
    
    // Analyze goals on track vs needing attention
    if (review.goalsOnTrack && review.goalsNeedingAttention) {
      const onTrackCount = review.goalsOnTrack.length;
      const needingAttentionCount = review.goalsNeedingAttention.length;
      const total = onTrackCount + needingAttentionCount;
      
      if (total > 0) {
        const onTrackPercentage = (onTrackCount / total) * 100;
        if (onTrackPercentage >= 75) {
          insights.push({
            id: `insight-${review.id}-success`,
            type: 'success',
            title: 'Excellent Progress',
            description: `${onTrackPercentage.toFixed(0)}% of your goals are on track!`,
            createdAt: now.toISOString()
          });
        } else if (onTrackPercentage < 50) {
          insights.push({
            id: `insight-${review.id}-warning`,
            type: 'warning',
            title: 'Needs Attention',
            description: `${needingAttentionCount} goals need your attention. Consider adjusting your priorities.`,
            createdAt: now.toISOString()
          });
        }
      }
    }
    
    // Analyze action items completion
    if (review.actionItems && review.actionItems.length > 0) {
      const completed = review.actionItems.filter(ai => ai.completed).length;
      const total = review.actionItems.length;
      const completionRate = (completed / total) * 100;
      
      if (completionRate === 100) {
        insights.push({
          id: `insight-${review.id}-action-complete`,
          type: 'success',
          title: 'All Action Items Completed',
          description: 'Great job completing all your action items!',
          createdAt: now.toISOString()
        });
      } else if (completionRate < 50) {
        insights.push({
          id: `insight-${review.id}-action-low`,
          type: 'improvement',
          title: 'Action Items Need Focus',
          description: `Only ${completionRate.toFixed(0)}% of action items completed. Consider breaking them into smaller tasks.`,
          createdAt: now.toISOString()
        });
      }
    }
    
    return insights;
  }, []);

  const addRetrospective = (retrospective: Retrospective) => {
    const existingIndex = retrospectives.findIndex(r => r.id === retrospective.id);
    if (existingIndex >= 0) {
      updateRetrospective(retrospective);
      return;
    }
    setRetrospectives([...retrospectives, retrospective]);
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      // Clean undefined values before syncing
      const cleanRetrospective: any = { ...retrospective };
      // Set optional fields to null if undefined
      if (cleanRetrospective.objectiveId === undefined) {
        cleanRetrospective.objectiveId = null;
      }
      if (cleanRetrospective.keyResultId === undefined) {
        cleanRetrospective.keyResultId = null;
      }
      // Remove any remaining undefined fields
      Object.keys(cleanRetrospective).forEach(key => {
        if (cleanRetrospective[key] === undefined) {
          delete cleanRetrospective[key];
        }
      });
      syncEntityToFirebase('retrospectives', cleanRetrospective, retrospective.id).catch(error => {
        console.error('Error syncing retrospective to Firebase:', error);
      });
    }
  };

  const updateRetrospective = (retrospective: Retrospective) => {
    setRetrospectives(retrospectives.map(r => r.id === retrospective.id ? retrospective : r));
    // Auto-sync to Firebase
    if (isAuthenticated()) {
      // Clean undefined values before syncing
      const cleanRetrospective: any = { ...retrospective };
      // Set optional fields to null if undefined
      if (cleanRetrospective.objectiveId === undefined) {
        cleanRetrospective.objectiveId = null;
      }
      if (cleanRetrospective.keyResultId === undefined) {
        cleanRetrospective.keyResultId = null;
      }
      // Remove any remaining undefined fields
      Object.keys(cleanRetrospective).forEach(key => {
        if (cleanRetrospective[key] === undefined) {
          delete cleanRetrospective[key];
        }
      });
      syncEntityToFirebase('retrospectives', cleanRetrospective, retrospective.id).catch(error => {
        console.error('Error syncing retrospective to Firebase:', error);
      });
    }
  };

  const deleteRetrospective = (id: string) => {
    setRetrospectives(retrospectives.filter(r => r.id !== id));
    // Auto-sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('retrospectives', id).catch(error => {
        console.error('Error deleting retrospective from Firebase:', error);
      });
    }
  };

  const getRetrospectivesByObjective = (objectiveId: string): Retrospective[] => {
    return retrospectives.filter(r => r.objectiveId === objectiveId).sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.date ? new Date(b.date).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA; // Newest first
    });
  };

  const getRetrospectivesByKeyResult = (keyResultId: string): Retrospective[] => {
    return retrospectives.filter(r => r.keyResultId === keyResultId).sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.date ? new Date(b.date).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA; // Newest first
    });
  };

  const calculateActionPlanProgress = useCallback((objectiveId: string): ActionPlanProgress => {
    const objective = objectives.find(o => o.id === objectiveId);
    if (!objective) {
      return {
        objectiveId,
        totalWeeks: 0,
        completedWeeks: 0,
        totalTasks: 0,
        completedTasks: 0,
        weekProgress: [],
        overallProgress: 0
      };
    }

    // Find template that was used to create this objective
    const template = objectiveTemplates.find(t => {
      // Check if objective matches template data
      return t.objectiveData.title === objective.title || t.name === objective.title;
    });

    if (!template || !template.actionPlan) {
      return {
        objectiveId,
        totalWeeks: 0,
        completedWeeks: 0,
        totalTasks: 0,
        completedTasks: 0,
        weekProgress: [],
        overallProgress: 0
      };
    }

    const actionPlan = template.actionPlan;
    const totalWeeks = actionPlan.weeks.length;
    let completedWeeks = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    const weekProgress: ActionPlanProgress['weekProgress'] = [];

    // Get all tasks linked to this objective
    const objectiveTasks = tasks.filter(t => t.objectiveId === objectiveId);

    actionPlan.weeks.forEach(week => {
      const weekTasks = week.tasks;
      totalTasks += weekTasks.length;
      let weekCompletedTasks = 0;

      const weekTaskProgress = weekTasks.map(apt => {
        // Try to find matching task
        const matchingTask = objectiveTasks.find(t => {
          // Check if task title matches or if task ID matches action plan task ID pattern
          return t.title === apt.title || t.id.includes(apt.id);
        });

        const completed = matchingTask ? matchingTask.completed : false;
        if (completed) {
          weekCompletedTasks++;
          completedTasks++;
        }

        return {
          id: apt.id,
          title: apt.title,
          scheduledDate: apt.scheduledDate,
          completed,
          taskId: matchingTask?.id
        };
      });

      const weekProgressPercent = weekTasks.length > 0 ? (weekCompletedTasks / weekTasks.length) * 100 : 0;
      if (weekProgressPercent === 100) {
        completedWeeks++;
      }

      weekProgress.push({
        weekNumber: week.weekNumber,
        weekTitle: week.title,
        totalTasks: weekTasks.length,
        completedTasks: weekCompletedTasks,
        progress: weekProgressPercent,
        tasks: weekTaskProgress
      });
    });

    const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Find next upcoming task
    const now = new Date();
    let nextUpcomingTask: ActionPlanProgress['nextUpcomingTask'] | undefined;
    for (const week of weekProgress) {
      for (const task of week.tasks) {
        if (!task.completed && task.scheduledDate) {
          const taskDate = new Date(task.scheduledDate);
          if (taskDate >= now) {
            if (!nextUpcomingTask || new Date(task.scheduledDate) < new Date(nextUpcomingTask.scheduledDate)) {
              nextUpcomingTask = {
                id: task.id,
                title: task.title,
                scheduledDate: task.scheduledDate,
                weekNumber: week.weekNumber
              };
            }
          }
        }
      }
    }

    return {
      objectiveId,
      totalWeeks,
      completedWeeks,
      totalTasks,
      completedTasks,
      weekProgress,
      overallProgress,
      nextUpcomingTask
    };
  }, [objectives, objectiveTemplates, tasks]);

  // Helper functions
  const getLifeAreaById = (id: string): LifeArea | undefined => {
    return lifeAreas.find(la => la.id === id);
  };

  const getVisionByLifeArea = (lifeAreaId: string): Vision | undefined => {
    return visions.find(v => v.lifeAreaId === lifeAreaId);
  };

  const getObjectivesByLifeArea = (lifeAreaId: string): Objective[] => {
    return objectives.filter(obj => obj.lifeAreaId === lifeAreaId);
  };

  const getTasksByLifeArea = (lifeAreaId: string): Task[] => {
    return tasks.filter(task => task.lifeAreaId === lifeAreaId);
  };

  const getTasksForDate = (date: string): Task[] => {
    return tasks.filter(task => task.scheduledDate === date);
  };

  const getTimeSlotsForDate = (date: string): TimeSlot[] => {
    return timeSlots.filter(ts => ts.date === date);
  };

  // Cross-entity helper functions for integration
  const getTasksByObjective = (objectiveId: string): Task[] => {
    return tasks.filter(task => task.objectiveId === objectiveId);
  };

  const getTasksByKeyResult = (keyResultId: string): Task[] => {
    return tasks.filter(task => task.keyResultId === keyResultId);
  };

  const getHabitsByObjective = (objectiveId: string): Habit[] => {
    return habits.filter(habit => habit.objectiveId === objectiveId);
  };

  const getHabitsByKeyResult = (keyResultId: string): Habit[] => {
    return habits.filter(habit => habit.linkedKeyResultId === keyResultId);
  };

  const getHabitsByLifeArea = (lifeAreaId: string): Habit[] => {
    return habits.filter(habit => habit.lifeAreaId === lifeAreaId);
  };

  const getKeyResultsByObjective = (objectiveId: string): KeyResult[] => {
    return keyResults.filter(kr => kr.objectiveId === objectiveId);
  };

  const getTimeSlotsByObjective = (objectiveId: string): TimeSlot[] => {
    return timeSlots.filter(ts => ts.objectiveId === objectiveId);
  };

  const getTimeSlotsByLifeArea = (lifeAreaId: string): TimeSlot[] => {
    return timeSlots.filter(ts => ts.lifeAreaId === lifeAreaId);
  };

  const getObjectivesByKeyResult = (keyResultId: string): Objective[] => {
    const kr = keyResults.find(k => k.id === keyResultId);
    if (!kr) return [];
    const obj = objectives.find(o => o.id === kr.objectiveId);
    return obj ? [obj] : [];
  };

  const getLifeAreaByObjective = (objectiveId: string): LifeArea | undefined => {
    const obj = objectives.find(o => o.id === objectiveId);
    if (!obj || !obj.lifeAreaId) return undefined;
    return lifeAreas.find(la => la.id === obj.lifeAreaId);
  };

  const calculateLifescan = (lifeAreaId: string): number => {
    // Calculate score 1-10 based on:
    // - Goal progress (40%)
    // - Goal completion rate (30%)
    // - Recent activity (20%)
    // - Balance with other areas (10%)
    const areaObjectives = getObjectivesByLifeArea(lifeAreaId);
    if (areaObjectives.length === 0) return 5; // Neutral score if no goals

    const avgProgress = areaObjectives.reduce((sum, obj) => sum + obj.progress, 0) / areaObjectives.length;
    const onTrackCount = areaObjectives.filter(obj => obj.status === 'On Track').length;
    const completionRate = (onTrackCount / areaObjectives.length) * 100;

    // Simple calculation (can be refined)
    const score = Math.round((avgProgress * 0.4 + completionRate * 0.3 + 50 * 0.2 + 50 * 0.1) / 10);
    return Math.max(1, Math.min(10, score));
  };

  // Helper function to format key result value based on measurement type
  const formatKeyResultValue = (kr: KeyResult, value: number): string => {
    const decimals = kr.decimals !== undefined ? kr.decimals : 0;
    const measurementType = kr.measurementType || (kr.unit === '%' ? 'percentage' : kr.unit && ['$', '€', 'EUR', 'USD'].includes(kr.unit) ? 'currency' : 'number');
    
    let formatted = decimals === 0 ? Math.round(value).toString() : value.toFixed(decimals);
    
    if (measurementType === 'percentage') {
      return `${formatted}%`;
    } else if (measurementType === 'currency') {
      const currency = kr.currency || 'EUR';
      const symbols: { [key: string]: string } = {
        'EUR': '€',
        'USD': '$',
        'GBP': '£',
        'JPY': '¥',
        'CNY': 'CN¥',
        'CAD': 'CA$',
        'AUD': 'A$',
        'MXN': 'MX$',
        'BRL': 'R$',
        'KRW': '₩',
        'NZD': 'NZ$',
        'CHF': 'CHF'
      };
      return `${symbols[currency] || currency} ${formatted}`;
    } else if (measurementType === 'weight') {
      return `${formatted} kg`;
    } else if (measurementType === 'distance') {
      return `${formatted} km`;
    } else if (measurementType === 'time') {
      // Format as hours (e.g., 1000 hours)
      return `${formatted} hours`;
    } else if (measurementType === 'height') {
      // Format as meters (e.g., 1.75m)
      return `${formatted} m`;
    } else if (measurementType === 'pages') {
      return `${formatted} pages`;
    } else if (measurementType === 'chapters') {
      return `${formatted} chapters`;
    } else if (measurementType === 'custom') {
      const unit = kr.customUnit || '';
      return unit ? `${formatted} ${unit}` : formatted;
    }
    
    return formatted;
  };

  const clearAllData = async () => {
    // Set flag to prevent Firebase listeners from restoring data
    setIsClearingData(true);
    
    // Clear all state (but keep userProfile - it will be updated by import)
    setTasks([]);
    setHabits([]);
    setFriends([]);
    setObjectives([]);
    setKeyResults([]);
    setPlaces([]);
    setTeamMembers([]);
    setLifeAreas([]);
    setVisions([]);
    setTimeSlots([]);
    setStatusUpdates([]);
    setReviews([]);
    setRetrospectives([]);
    setDeletedTaskIds([]);
    setDeletedGoogleTaskIds([]);
    // Keep dayParts as they are defaults
    // Note: userProfile is NOT cleared here - it will be updated by import
    
    // Clear all localStorage keys
    const localStorageKeys = [
      'orbit_profile',
      'orbit_tasks',
      'orbit_habits',
      'orbit_friends',
      'orbit_objectives',
      'orbit_keyResults',
      'orbit_places',
      'orbit_teamMembers',
      'orbit_lifeAreas',
      'orbit_visions',
      'orbit_timeSlots',
      'orbit_statusUpdates',
      'orbit_reviews',
      'orbit_retrospectives',
      'orbit_dayParts',
      'orbit_accent',
      'orbit_darkMode',
      'orbit_showCategory',
      'orbit_reminders',
      'orbit_notifications',
      'orbit_notificationSettings',
      'orbit_taskTemplates',
      'orbit_quickActions',
      'orbit_deletedGoogleTaskIds',
    ];
    
    localStorageKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Delete all Firebase data if authenticated
    if (isAuthenticated()) {
      try {
        await deleteAllUserDataFromFirebase();
        console.log('All Firebase data deleted');
      } catch (error) {
        console.error('Error deleting Firebase data:', error);
      }
    }
    
    // Wait a bit before allowing listeners to restore data (in case of race conditions)
    setTimeout(() => {
      setIsClearingData(false);
    }, 2000);
  };

  const restoreExampleData = () => {
    setUserProfile(defaultProfile);
    setTasks(exampleTasks);
    setHabits(exampleHabits);
    setFriends(exampleFriends);
    setObjectives(exampleObjectives);
    setKeyResults(exampleKeyResults);
    setPlaces(examplePlaces);
    setTeamMembers(exampleTeamMembers);
    setLifeAreas(exampleLifeAreas);
    setVisions(exampleVisions);
    setTimeSlots([]);
    setDayParts(defaultDayParts);
    setStatusUpdates([]);
    setReviews([]);
    setRetrospectives([]);
    setReminders([]);
    setNotifications([]);
    setNotificationSettings(defaultNotificationSettings);
    setDeletedGoogleTaskIds([]);
    setDeletedTaskIds([]);
  };

  // --- Reminder Functions ---
  const addReminder = (reminder: Reminder) => {
    setReminders([...reminders, reminder]);
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('reminders', reminder, reminder.id).catch(err => 
        console.error('Error syncing reminder to Firebase:', err)
      );
    }
  };

  const updateReminder = (reminder: Reminder) => {
    setReminders(reminders.map(r => r.id === reminder.id ? reminder : r));
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('reminders', reminder, reminder.id).catch(err => 
        console.error('Error syncing reminder to Firebase:', err)
      );
    }
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
    // Sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('reminders', id).catch(err => 
        console.error('Error deleting reminder from Firebase:', err)
      );
    }
  };

  const getRemindersByEntity = (entityType: EntityType, entityId: string): Reminder[] => {
    return reminders.filter(r => r.entityType === entityType && r.entityId === entityId);
  };

  const getUpcomingReminders = (limit?: number): Reminder[] => {
    const now = new Date();
    const upcoming = reminders
      .filter(r => !r.completed && new Date(r.scheduledTime) > now)
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
    return limit ? upcoming.slice(0, limit) : upcoming;
  };

  // --- Notification Functions ---
  const addNotification = (notification: Notification) => {
    setNotifications([notification, ...notifications]);
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('notifications', notification, notification.id).catch(err => 
        console.error('Error syncing notification to Firebase:', err)
      );
    }
  };

  const updateNotification = (notification: Notification) => {
    setNotifications(notifications.map(n => n.id === notification.id ? notification : n));
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('notifications', notification, notification.id).catch(err => 
        console.error('Error syncing notification to Firebase:', err)
      );
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    // Sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('notifications', id).catch(err => 
        console.error('Error deleting notification from Firebase:', err)
      );
    }
  };

  const markNotificationAsRead = (id: string) => {
    updateNotification({ ...notifications.find(n => n.id === id)!, read: true });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    // Sync all to Firebase
    if (isAuthenticated()) {
      notifications.forEach(n => {
        syncEntityToFirebase('notifications', { ...n, read: true }, n.id).catch(err => 
          console.error('Error syncing notification to Firebase:', err)
        );
      });
    }
  };

  const getUnreadNotificationsCount = (): number => {
    return notifications.filter(n => !n.read).length;
  };

  // --- Notification Settings Functions ---
  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings({ ...notificationSettings, ...settings });
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('notificationSettings', { ...notificationSettings, ...settings }, 'user').catch(err => 
        console.error('Error syncing notification settings to Firebase:', err)
      );
    }
  };

  // --- Task Templates Functions ---
  const addTaskTemplate = (template: TaskTemplate) => {
    setTaskTemplates([...taskTemplates, template]);
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('taskTemplates', template, template.id).catch(err => 
        console.error('Error syncing task template to Firebase:', err)
      );
    }
  };

  const updateTaskTemplate = (template: TaskTemplate) => {
    setTaskTemplates(taskTemplates.map(t => t.id === template.id ? updateTaskTemplateUtil(template) : t));
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('taskTemplates', template, template.id).catch(err => 
        console.error('Error syncing task template to Firebase:', err)
      );
    }
  };

  const deleteTaskTemplate = (id: string) => {
    setTaskTemplates(deleteTaskTemplateUtil(id, taskTemplates));
    // Sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('taskTemplates', id).catch(err => 
        console.error('Error deleting task template from Firebase:', err)
      );
    }
  };

  const createTaskFromTemplate = (templateId: string): Task | null => {
    const allTemplates = getTaskTemplates(taskTemplates);
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return null;

    const task = createTaskFromTemplateUtil(template);
    addTask(task);
    
    // Update template usage
    setTaskTemplates(updateTaskTemplateUsage(templateId, taskTemplates));
    
    return task;
  };

  // --- Objective Templates Functions ---
  const addObjectiveTemplate = (template: ObjectiveTemplate) => {
    setObjectiveTemplates([...objectiveTemplates, template]);
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('objectiveTemplates', template, template.id).catch(err => 
        console.error('Error syncing objective template to Firebase:', err)
      );
    }
  };

  const updateObjectiveTemplate = (template: ObjectiveTemplate) => {
    const updated = updateObjectiveTemplateUtil(template, objectiveTemplates);
    setObjectiveTemplates(updated);
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('objectiveTemplates', template, template.id).catch(err => 
        console.error('Error syncing objective template to Firebase:', err)
      );
    }
  };

  const deleteObjectiveTemplate = (id: string) => {
    setObjectiveTemplates(deleteObjectiveTemplateUtil(id, objectiveTemplates));
    // Sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('objectiveTemplates', id).catch(err => 
        console.error('Error deleting objective template from Firebase:', err)
      );
    }
  };

  const createObjectiveFromTemplate = (templateId: string, lifeAreaId?: string): Objective | null => {
    const allTemplates = getObjectiveTemplates(objectiveTemplates);
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return null;

    const objective = createObjectiveFromTemplateUtil(template, lifeAreaId);
    addObjective(objective);
    
    // Update template usage
    setObjectiveTemplates(updateObjectiveTemplateUsage(templateId, objectiveTemplates));
    
    return objective;
  };

  // --- Quick Actions Functions ---
  const addQuickAction = (action: QuickAction) => {
    setQuickActions([...quickActions, action]);
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('quickActions', action, action.id).catch(err => 
        console.error('Error syncing quick action to Firebase:', err)
      );
    }
  };

  const updateQuickAction = (action: QuickAction) => {
    setQuickActions(quickActions.map(a => a.id === action.id ? updateQuickActionUtil(action) : a));
    // Sync to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('quickActions', action, action.id).catch(err => 
        console.error('Error syncing quick action to Firebase:', err)
      );
    }
  };

  const deleteQuickAction = (id: string) => {
    setQuickActions(deleteQuickActionUtil(id, quickActions));
    // Sync delete to Firebase
    if (isAuthenticated()) {
      deleteEntityFromFirebase('quickActions', id).catch(err => 
        console.error('Error deleting quick action from Firebase:', err)
      );
    }
  };

  const executeQuickAction = (actionId: string) => {
    const allActions = getQuickActions(quickActions);
    const action = allActions.find(a => a.id === actionId);
    if (!action) return;

    // Update usage
    setQuickActions(updateActionUsage(actionId, quickActions));

    // Handle action based on type
    // Note: Navigation actions will be handled by the component that calls this
    // Custom actions would need a handler registry
  };

  // --- Recurring Tasks Generation ---
  useEffect(() => {
    // Generate recurring task instances daily
    const generateRecurringTasks = () => {
      const recurringTasks = tasks.filter(t => t.recurring && !t.recurring.parentTaskId);
      for (const task of recurringTasks) {
        const instances = recurringEngine.generateRecurringInstances(task, 30);
        for (const instance of instances) {
          // Check if instance already exists
          if (!tasks.find(t => t.id === instance.id)) {
            addTask(instance);
          }
        }
        // Update lastGenerated
        if (instances.length > 0) {
          const lastInstance = instances[instances.length - 1];
          if (lastInstance.scheduledDate) {
            updateTask({
              ...task,
              recurring: {
                ...task.recurring!,
                lastGenerated: lastInstance.scheduledDate,
              }
            });
          }
        }
      }
    };

    // Generate on mount and daily
    generateRecurringTasks();
    const interval = setInterval(generateRecurringTasks, 24 * 60 * 60 * 1000); // Daily
    return () => clearInterval(interval);
  }, [tasks]);

  // --- Notification Scheduler Integration ---
  useEffect(() => {
    if (!notificationSettings.enabled) {
      notificationScheduler.stop();
      return;
    }

    // Entity getter function for notification scheduler
    const entityGetter = (entityType: EntityType, entityId: string): Task | Habit | Objective | TimeSlot | null => {
      switch (entityType) {
        case 'task':
          return tasks.find(t => t.id === entityId) || null;
        case 'habit':
          return habits.find(h => h.id === entityId) || null;
        case 'objective':
          return objectives.find(o => o.id === entityId) || null;
        case 'timeSlot':
          return timeSlots.find(ts => ts.id === entityId) || null;
        default:
          return null;
      }
    };

    // Notification callback
    const notificationCallback = (notification: Notification) => {
      addNotification(notification);
    };

    // Start scheduler
    notificationScheduler.start(reminders, entityGetter, notificationCallback);

    // Update reminders when they change
    notificationScheduler.updateReminders(reminders);

    // Cleanup on unmount
    return () => {
      notificationScheduler.stop();
    };
  }, [reminders, notificationSettings.enabled, tasks, habits, objectives, timeSlots]);

  return (
    <DataContext.Provider value={{
      userProfile, tasks, habits, friends, objectives, keyResults, places, teamMembers, accentColor, darkMode, theme, showCategory,
      lifeAreas, visions, timeSlots, dayParts, statusUpdates,
      reviews, retrospectives,
      reminders, notifications, notificationSettings,
      taskTemplates, objectiveTemplates, quickActions,
      deletedGoogleTaskIds, deletedTaskIds,
      updateUserProfile,
      addTask, updateTask, deleteTask, deleteCompletedTasks,
      addHabit, updateHabit, deleteHabit,
      addFriend, updateFriend, deleteFriend,
      addObjective, updateObjective, deleteObjective,
      addKeyResult, updateKeyResult, deleteKeyResult,
      addPlace, deletePlace,
      addTeamMember, deleteTeamMember,
      addLifeArea, updateLifeArea, deleteLifeArea, reorderLifeAreas,
      addVision, updateVision, deleteVision,
      addTimeSlot, updateTimeSlot, deleteTimeSlot,
      updateDayPart, deleteDayPart, reorderDayParts,
      addStatusUpdate, updateStatusUpdate, deleteStatusUpdate, getStatusUpdatesByKeyResult,
      // Planning & Review
      addReview, updateReview, deleteReview, getReviewByDate, getLatestReview, generateReviewInsights,
      addRetrospective, updateRetrospective, deleteRetrospective, getRetrospectivesByObjective, getRetrospectivesByKeyResult, calculateActionPlanProgress,
      getLifeAreaById, getVisionByLifeArea, getObjectivesByLifeArea, getTasksByLifeArea,
      getTasksForDate, getTimeSlotsForDate, calculateLifescan, formatKeyResultValue,
      getTasksByObjective, getTasksByKeyResult, getHabitsByObjective, getHabitsByKeyResult,
      getHabitsByLifeArea, getKeyResultsByObjective, getTimeSlotsByObjective, getTimeSlotsByLifeArea,
      getObjectivesByKeyResult, getLifeAreaByObjective,
      setAccentColor, setDarkMode, setTheme, setShowCategory,
      clearAllData, restoreExampleData,
      // Notifications & Reminders
      addReminder, updateReminder, deleteReminder, getRemindersByEntity, getUpcomingReminders,
      addNotification, updateNotification, deleteNotification, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationsCount,
      updateNotificationSettings,
      // Task Templates & Quick Actions
      addTaskTemplate, updateTaskTemplate, deleteTaskTemplate, createTaskFromTemplate,
      addObjectiveTemplate, updateObjectiveTemplate, deleteObjectiveTemplate, createObjectiveFromTemplate,
      addQuickAction, updateQuickAction, deleteQuickAction, executeQuickAction,
      // Sync service functions
      getSyncQueueStatus: () => syncService.getQueueStatus(),
      triggerSync: async () => { await syncService.triggerSync(); },
      getSyncConfig: () => syncService.getConfig(),
      updateSyncConfig: (config: Partial<any>) => syncService.updateConfig(config),
      
      // Conflict management
      conflicts: syncService.getConflicts(),
      getConflicts: () => syncService.getConflicts(),
      getConflictsByType: (entityType: Conflict['entityType']) => syncService.getConflictsByType(entityType),
      getConflictsByService: (service: Conflict['service']) => syncService.getConflictsByService(service),
      detectConflicts: async () => { return await syncService.detectConflicts(); },
      resolveConflict: async (conflictId: string, strategy?: ConflictResolution['strategy']) => {
        await syncService.resolveConflict(conflictId, strategy);
      },
      autoResolveConflicts: async () => { await syncService.autoResolveConflicts(); },
      updateConflictResolutionConfig: (config: Partial<ConflictResolutionConfig>) => {
        syncService.updateConflictConfig(config);
      },
      
      // Import functions
      importTasksFromGoogle: async (taskListIds?: string[]) => {
        const accessToken = getAccessToken();
        if (!accessToken) {
          throw new Error('Niet verbonden met Google');
        }

        try {
          // Haal Google Tasks op
          const result = await importGoogleTasks(accessToken, taskListIds?.[0]);
          if (!result.success || !result.tasks) {
            return { imported: 0, updated: 0, conflicts: 0 };
          }

          let imported = 0;
          let updated = 0;
          let conflicts = 0;

          // Detecteer duplicates tussen bestaande tasks en geïmporteerde tasks
          const duplicates = detectDuplicateAppTasks(tasks, result.tasks);
          
          // Filter nieuwe tasks (geen duplicate EN niet in deletedGoogleTaskIds)
          const newTasks = result.tasks.filter(importedTask => {
            // Check of deze task al bestaat (duplicate)
            const isDuplicate = duplicates.some(d => 
              d.imported.id === importedTask.id || 
              d.imported.googleTaskId === importedTask.googleTaskId
            );
            
            // Check of deze Google Task ID in de deleted lijst staat
            const isDeleted = importedTask.googleTaskId && 
              deletedGoogleTaskIds.includes(importedTask.googleTaskId);
            
            // Alleen toevoegen als het geen duplicate is EN niet verwijderd is
            return !isDuplicate && !isDeleted;
          });

          // Import nieuwe tasks
          for (const task of newTasks) {
            addTask(task);
            imported++;
          }

          // Update duplicates
          for (const duplicate of duplicates) {
            // Merge tasks (gebruik merge strategie)
            // Note: duplicate.imported is al een app Task (na mapping), duplicate.existing is ook een app Task
            const merged = mergeAppTasks(duplicate.existing, duplicate.imported, 'merge');
            updateTask(merged);
            updated++;
          }

          return { imported, updated, conflicts };
        } catch (error: any) {
          console.error('Import from Google failed:', error);
          throw error;
        }
      },
      importTimeSlotsFromCalendar: async (calendarIds?: string[]) => {
        // TODO: Implement calendar import
        return { imported: 0, updated: 0, conflicts: 0 };
      },
      startAutoImport: async (intervalMinutes?: number) => {
        await syncService.startAutoImport(intervalMinutes);
      },
      stopAutoImport: () => {
        syncService.stopAutoImport();
      }
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};