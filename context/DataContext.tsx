import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Habit, Friend, Objective, KeyResult, Place, TeamMember, DataContextType, UserProfile, LifeArea, Vision, TimeSlot, DayPart, StatusUpdate } from '../types';
import { syncService } from '../utils/syncService';
import { isAuthenticated, onAuthStateChange } from '../utils/firebaseAuth';
import { syncEntityToFirebase, syncAllFromFirebase, syncAllToFirebase, watchFirebaseChanges } from '../utils/firebaseSync';

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

  // Helper function to reduce saturation by 30%
  const reduceSaturation = (color: string): string => {
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

    // Reduce saturation by 30%
    s = Math.max(0, s * 0.7);

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
  };

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
    const unsubscribe = onAuthStateChange(async (user) => {
      if (!isMounted) return;
      if (user) {
        console.log('User authenticated, syncing from Firebase...');
        try {
          // Initial sync from Firebase
          const syncResult = await syncAllFromFirebase();
          if (syncResult.success && syncResult.data) {
            // Check if Firebase has data
            const hasFirebaseData = Object.values(syncResult.data).some(
              (arr: any) => Array.isArray(arr) && arr.length > 0
            ) || syncResult.data.userProfile !== null;

            if (hasFirebaseData) {
              // Merge strategy: use Firebase data if it exists
              if (syncResult.data.tasks.length > 0) setTasks(syncResult.data.tasks);
              if (syncResult.data.habits.length > 0) setHabits(syncResult.data.habits);
              if (syncResult.data.objectives.length > 0) setObjectives(syncResult.data.objectives);
              if (syncResult.data.keyResults.length > 0) setKeyResults(syncResult.data.keyResults);
              if (syncResult.data.lifeAreas.length > 0) setLifeAreas(syncResult.data.lifeAreas);
              if (syncResult.data.timeSlots.length > 0) setTimeSlots(syncResult.data.timeSlots);
              if (syncResult.data.friends.length > 0) setFriends(syncResult.data.friends);
              if (syncResult.data.statusUpdates.length > 0) setStatusUpdates(syncResult.data.statusUpdates);
              if (syncResult.data.userProfile) {
                setUserProfile(prev => ({ ...prev, ...syncResult.data.userProfile }));
              }
            } else {
              // No Firebase data, upload local data
              console.log('No Firebase data found, uploading local data...');
              await syncAllToFirebase({
                tasks,
                habits,
                objectives,
                keyResults,
                lifeAreas,
                timeSlots,
                friends,
                statusUpdates,
                userProfile
              });
            }
          }
        } catch (error) {
          console.error('Error syncing from Firebase:', error);
        }

        // Set up real-time listeners for each collection
        const unsubscribers: (() => void)[] = [];

        // Watch for changes in Firebase (only update if Firebase has data)
        unsubscribers.push(watchFirebaseChanges('tasks', (firebaseTasks) => {
          if (firebaseTasks.length > 0) {
            setTasks(firebaseTasks);
          }
        }));

        unsubscribers.push(watchFirebaseChanges('objectives', (firebaseObjectives) => {
          if (firebaseObjectives.length > 0) {
            setObjectives(firebaseObjectives);
          }
        }));

        unsubscribers.push(watchFirebaseChanges('keyResults', (firebaseKeyResults) => {
          if (firebaseKeyResults.length > 0) {
            setKeyResults(firebaseKeyResults);
          }
        }));

        unsubscribers.push(watchFirebaseChanges('timeSlots', (firebaseTimeSlots) => {
          if (firebaseTimeSlots.length > 0) {
            setTimeSlots(firebaseTimeSlots);
          }
        }));

        unsubscribers.push(watchFirebaseChanges('habits', (firebaseHabits) => {
          if (firebaseHabits.length > 0) {
            setHabits(firebaseHabits);
          }
        }));

        unsubscribers.push(watchFirebaseChanges('lifeAreas', (firebaseLifeAreas) => {
          if (firebaseLifeAreas.length > 0) {
            setLifeAreas(firebaseLifeAreas);
          }
        }));

        unsubscribers.push(watchFirebaseChanges('friends', (firebaseFriends) => {
          if (firebaseFriends.length > 0) {
            setFriends(firebaseFriends);
          }
        }));

        unsubscribers.push(watchFirebaseChanges('statusUpdates', (firebaseStatusUpdates) => {
          if (firebaseStatusUpdates.length > 0) {
            setStatusUpdates(firebaseStatusUpdates);
          }
        }));

        // Cleanup function for unsubscribers
        return () => {
          unsubscribers.forEach(unsub => unsub());
        };
      } else {
        console.log('User not authenticated');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // Only run once on mount - eslint-disable-line react-hooks/exhaustive-deps

  // --- Actions ---

  const updateUserProfile = (profile: Partial<UserProfile>) => setUserProfile(prev => ({ ...prev, ...profile }));

  const addTask = (item: Task) => {
    setTasks([...tasks, item]);
    // Auto-sync to Google Tasks
    syncService.queueSync('task', 'create', item.id, item);
    // Auto-sync to Firebase (async, fire and forget)
    if (isAuthenticated()) {
      syncEntityToFirebase('tasks', item, item.id).catch(error => {
        console.error('Error syncing task to Firebase:', error);
      });
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
    setTasks(tasks.filter(t => t.id !== id));
    // Auto-sync delete to Google Tasks
    const task = tasks.find(t => t.id === id);
    if (task) {
      syncService.queueSync('task', 'delete', id, null);
    }
    // Auto-sync delete to Firebase (async, fire and forget)
    if (isAuthenticated()) {
      syncEntityToFirebase('tasks', { id, deleted: true }, id).catch(error => {
        console.error('Error deleting task from Firebase:', error);
      });
    }
  };

  const addHabit = (item: Habit) => {
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
      syncEntityToFirebase('habits', { id, deleted: true }, id).catch(error => {
        console.error('Error deleting habit from Firebase:', error);
      });
    }
  };

  const addFriend = (item: Friend) => {
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
      syncEntityToFirebase('friends', { id, deleted: true }, id).catch(error => {
        console.error('Error deleting friend from Firebase:', error);
      });
    }
  };

  const addObjective = (item: Objective) => {
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
    setKeyResults(keyResults.filter(k => k.objectiveId !== id)); 
    // Auto-sync delete to Google Calendar
    const objective = objectives.find(o => o.id === id);
    if (objective) {
      syncService.queueSync('objective', 'delete', id, null);
    }
    // Auto-sync delete to Firebase (async, fire and forget)
    if (isAuthenticated()) {
      syncEntityToFirebase('objectives', { id, deleted: true }, id).catch(error => {
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
    setKeyResults([...keyResults, item]);
  };
  
  const updateKeyResult = (item: KeyResult) => {
    setKeyResults(keyResults.map(k => k.id === item.id ? item : k));
  };
  
  const deleteKeyResult = (id: string) => {
    setKeyResults(keyResults.filter(k => k.id !== id));
  };

  const addPlace = (item: Place) => setPlaces([...places, item]);
  const deletePlace = (id: string) => setPlaces(places.filter(p => p.id !== id));

  const addTeamMember = (item: TeamMember) => setTeamMembers([...teamMembers, item]);
  const deleteTeamMember = (id: string) => setTeamMembers(teamMembers.filter(t => t.id !== id));

  // Life Planner actions
  const addLifeArea = (item: LifeArea) => {
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
    // Also delete related visions and update objectives
    setVisions(visions.filter(v => v.lifeAreaId !== id));
    // Auto-sync delete to Firebase
    if (isAuthenticated()) {
      syncEntityToFirebase('lifeAreas', { id, deleted: true }, id).catch(error => {
        console.error('Error deleting lifeArea from Firebase:', error);
      });
    }
    setObjectives(objectives.map(obj => obj.lifeAreaId === id ? { ...obj, lifeAreaId: '' } : obj));
  };
  const reorderLifeAreas = (newOrder: LifeArea[]) => setLifeAreas(newOrder);

  const addVision = (item: Vision) => setVisions([...visions, item]);
  const updateVision = (item: Vision) => setVisions(visions.map(v => v.id === item.id ? item : v));
  const deleteVision = (id: string) => setVisions(visions.filter(v => v.id !== id));

  const addTimeSlot = async (item: TimeSlot) => {
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
    // Auto-sync delete to Google Calendar
    const timeSlot = timeSlots.find(ts => ts.id === id);
    if (timeSlot) {
      syncService.queueSync('timeSlot', 'delete', id, null);
    }
    // Auto-sync delete to Firebase
    if (isAuthenticated()) {
      try {
        await syncEntityToFirebase('timeSlots', { id, deleted: true }, id);
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
    setStatusUpdates([...statusUpdates, update]);
    // Update ook de current waarde en status van het Key Result
    const kr = keyResults.find(k => k.id === update.keyResultId);
    if (kr) {
      updateKeyResult({ ...kr, current: update.currentValue, status: update.status });
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
      syncEntityToFirebase('statusUpdates', { id, deleted: true }, id).catch(error => {
        console.error('Error deleting statusUpdate from Firebase:', error);
      });
    }
  };
  const getStatusUpdatesByKeyResult = (keyResultId: string): StatusUpdate[] => {
    return statusUpdates.filter(su => su.keyResultId === keyResultId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

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
    }
    
    return formatted;
  };

  const clearAllData = () => {
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
    // Keep dayParts as they are defaults
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
  };

  return (
    <DataContext.Provider value={{
      userProfile, tasks, habits, friends, objectives, keyResults, places, teamMembers, accentColor, darkMode, showCategory,
      lifeAreas, visions, timeSlots, dayParts, statusUpdates,
      updateUserProfile,
      addTask, updateTask, deleteTask,
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
      getLifeAreaById, getVisionByLifeArea, getObjectivesByLifeArea, getTasksByLifeArea,
      getTasksForDate, getTimeSlotsForDate, calculateLifescan, formatKeyResultValue,
      getTasksByObjective, getTasksByKeyResult, getHabitsByObjective, getHabitsByKeyResult,
      getHabitsByLifeArea, getKeyResultsByObjective, getTimeSlotsByObjective, getTimeSlotsByLifeArea,
      getObjectivesByKeyResult, getLifeAreaByObjective,
      setAccentColor, setDarkMode, setShowCategory,
      clearAllData, restoreExampleData,
      // Sync service functions
      getSyncQueueStatus: () => syncService.getQueueStatus(),
      triggerSync: async () => { await syncService.triggerSync(); },
      getSyncConfig: () => syncService.getConfig(),
      updateSyncConfig: (config: Partial<any>) => syncService.updateConfig(config)
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