
export enum View {
  DASHBOARD = 'DASHBOARD',
  GROWTH = 'GROWTH',
  RELATIONSHIPS = 'RELATIONSHIPS',
  FRIEND_DETAIL = 'FRIEND_DETAIL',
  MAP = 'MAP',
  TASKS = 'TASKS',
  PROFILE = 'PROFILE', // Personal Settings
  SETTINGS = 'SETTINGS', // General Settings
  SYNCED_ACCOUNTS = 'SYNCED_ACCOUNTS', // New
  TEAM_SETTINGS = 'TEAM_SETTINGS', // New
  DATA_MANAGEMENT = 'DATA_MANAGEMENT', // New
  NOTIFICATIONS = 'NOTIFICATIONS',
  EDITOR = 'EDITOR',
  OBJECTIVE_DETAIL = 'OBJECTIVE_DETAIL',
  OBJECTIVES_OVERVIEW = 'OBJECTIVES_OVERVIEW'
}

export type EntityType = 'task' | 'habit' | 'friend' | 'objective' | 'keyResult' | 'place';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  image: string;
}

export interface Friend {
  id: string;
  name: string;
  role: string;
  roleType: 'friend' | 'professional' | 'family' | 'mentor' | 'gym';
  image: string;
  lastSeen: string;
  location?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
}

export interface Task {
  id: string;
  title: string;
  tag: string;
  time?: string;
  completed: boolean;
  priority?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completed: boolean;
  time?: string;
  linkedKeyResultId?: string; // Link to a parent goal
  weeklyProgress?: boolean[]; // Array of last 7 days status (true=done)
}

// Parent Goal
export interface Objective {
  id: string;
  title: string;
  description?: string;
  owner: string;
  ownerImage?: string;
  status: 'On Track' | 'At Risk' | 'Off Track';
  category: 'personal' | 'professional';
  dueDate: string;
  progress: number; // 0-100 (can be auto-calculated)
}

// Child Result
export interface KeyResult {
  id: string;
  objectiveId: string; // Foreign key
  title: string;
  current: number;
  target: number;
  unit: string; // e.g., '%', '$', '#'
  status: 'On Track' | 'At Risk' | 'Off Track';
  owner?: string; // Optional override
  dueDate?: string; // Optional override
}

export interface Place {
  id: string;
  name: string;
  address: string;
  type: 'Coffee' | 'Food' | 'Gym' | 'Park';
  rating: string;
}

export interface DataContextType {
  userProfile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  friends: Friend[];
  objectives: Objective[];
  keyResults: KeyResult[];
  places: Place[];
  teamMembers: TeamMember[];
  accentColor: string;
  
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  
  addHabit: (habit: Habit) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (id: string) => void;

  addFriend: (friend: Friend) => void;
  updateFriend: (friend: Friend) => void;
  deleteFriend: (id: string) => void;

  addObjective: (obj: Objective) => void;
  updateObjective: (obj: Objective) => void;
  deleteObjective: (id: string) => void;

  addKeyResult: (kr: KeyResult) => void;
  updateKeyResult: (kr: KeyResult) => void;
  deleteKeyResult: (id: string) => void;

  addPlace: (place: Place) => void;
  deletePlace: (id: string) => void;

  addTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;

  setAccentColor: (color: string) => void;

  clearAllData: () => void;
  restoreExampleData: () => void;
}
