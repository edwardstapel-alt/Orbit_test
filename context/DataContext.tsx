import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Habit, Friend, Objective, KeyResult, Place, TeamMember, DataContextType, UserProfile } from '../types';

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
    dueDate: '2024-12-31',
    progress: 65 
  },
  { 
    id: 'obj2', 
    title: 'Achieve Peak Fitness', 
    description: 'Run a marathon and lower body fat', 
    owner: 'Alex Morgan', 
    ownerImage: 'https://picsum.photos/id/64/200/200',
    status: 'At Risk', 
    category: 'personal', 
    dueDate: '2024-11-15',
    progress: 40 
  }
];

const exampleKeyResults: KeyResult[] = [
  { id: 'kr1', objectiveId: 'obj1', title: 'Increase NPS to 50+', current: 42, target: 50, unit: 'NPS', status: 'On Track', owner: 'Alex Morgan', dueDate: '2024-12-31' },
  { id: 'kr2', objectiveId: 'obj1', title: 'Reduce Churn to <2%', current: 2.5, target: 2.0, unit: '%', status: 'At Risk', owner: 'Sarah Jenkins', dueDate: '2024-10-30' },
  { id: 'kr3', objectiveId: 'obj2', title: 'Run 500km total', current: 350, target: 500, unit: 'km', status: 'On Track', owner: 'Alex Morgan', dueDate: '2024-11-01' },
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
  const [objectives, setObjectives] = useState<Objective[]>(() => loadData('orbit_objectives', exampleObjectives));
  const [keyResults, setKeyResults] = useState<KeyResult[]>(() => loadData('orbit_keyResults', exampleKeyResults));
  const [places, setPlaces] = useState<Place[]>(() => loadData('orbit_places', examplePlaces));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadData('orbit_teamMembers', exampleTeamMembers));
  const [accentColor, setAccentColor] = useState<string>(() => loadData('orbit_accent', '#D95829'));

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('orbit_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('orbit_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('orbit_habits', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('orbit_friends', JSON.stringify(friends)); }, [friends]);
  useEffect(() => { localStorage.setItem('orbit_objectives', JSON.stringify(objectives)); }, [objectives]);
  useEffect(() => { localStorage.setItem('orbit_keyResults', JSON.stringify(keyResults)); }, [keyResults]);
  useEffect(() => { localStorage.setItem('orbit_places', JSON.stringify(places)); }, [places]);
  useEffect(() => { localStorage.setItem('orbit_teamMembers', JSON.stringify(teamMembers)); }, [teamMembers]);
  useEffect(() => { 
      localStorage.setItem('orbit_accent', JSON.stringify(accentColor)); 
      document.documentElement.style.setProperty('--color-primary', accentColor);
  }, [accentColor]);

  // --- Actions ---

  const updateUserProfile = (profile: Partial<UserProfile>) => setUserProfile(prev => ({ ...prev, ...profile }));

  const addTask = (item: Task) => setTasks([...tasks, item]);
  const updateTask = (item: Task) => setTasks(tasks.map(t => t.id === item.id ? item : t));
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const addHabit = (item: Habit) => {
    const newItem = {
        ...item,
        weeklyProgress: item.weeklyProgress || [false, false, false, false, false, false, false]
    };
    setHabits([...habits, newItem]);
  };
  const updateHabit = (item: Habit) => setHabits(habits.map(h => h.id === item.id ? item : h));
  const deleteHabit = (id: string) => setHabits(habits.filter(h => h.id !== id));

  const addFriend = (item: Friend) => setFriends([...friends, item]);
  const updateFriend = (item: Friend) => setFriends(friends.map(f => f.id === item.id ? item : f));
  const deleteFriend = (id: string) => setFriends(friends.filter(f => f.id !== id));

  const addObjective = (item: Objective) => setObjectives([...objectives, item]);
  const updateObjective = (item: Objective) => setObjectives(objectives.map(o => o.id === item.id ? item : o));
  const deleteObjective = (id: string) => {
    setObjectives(objectives.filter(o => o.id !== id));
    setKeyResults(keyResults.filter(k => k.objectiveId !== id)); 
  };

  const addKeyResult = (item: KeyResult) => setKeyResults([...keyResults, item]);
  const updateKeyResult = (item: KeyResult) => setKeyResults(keyResults.map(k => k.id === item.id ? item : k));
  const deleteKeyResult = (id: string) => setKeyResults(keyResults.filter(k => k.id !== id));

  const addPlace = (item: Place) => setPlaces([...places, item]);
  const deletePlace = (id: string) => setPlaces(places.filter(p => p.id !== id));

  const addTeamMember = (item: TeamMember) => setTeamMembers([...teamMembers, item]);
  const deleteTeamMember = (id: string) => setTeamMembers(teamMembers.filter(t => t.id !== id));

  const clearAllData = () => {
    setTasks([]);
    setHabits([]);
    setFriends([]);
    setObjectives([]);
    setKeyResults([]);
    setPlaces([]);
    setTeamMembers([]);
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
  };

  return (
    <DataContext.Provider value={{
      userProfile, tasks, habits, friends, objectives, keyResults, places, teamMembers, accentColor,
      updateUserProfile,
      addTask, updateTask, deleteTask,
      addHabit, updateHabit, deleteHabit,
      addFriend, updateFriend, deleteFriend,
      addObjective, updateObjective, deleteObjective,
      addKeyResult, updateKeyResult, deleteKeyResult,
      addPlace, deletePlace,
      addTeamMember, deleteTeamMember,
      setAccentColor,
      clearAllData, restoreExampleData
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