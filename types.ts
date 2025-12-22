
export enum View {
  DASHBOARD = 'DASHBOARD',
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
  OBJECTIVES_OVERVIEW = 'OBJECTIVES_OVERVIEW',
  LIFE_AREAS = 'LIFE_AREAS', // Life Planner
  LIFE_AREA_DETAIL = 'LIFE_AREA_DETAIL', // Life Area detail view
  CALENDAR = 'CALENDAR', // Calendar view
  GOAL_TIMELINE = 'GOAL_TIMELINE', // Goal Timeline (Gantt)
  TODAY = 'TODAY', // Enhanced Today view
  DAY_PARTS_SETTINGS = 'DAY_PARTS_SETTINGS', // Day Parts Configuration
  STATISTICS = 'STATISTICS', // Statistics Dashboard
  FIREBASE_AUTH = 'FIREBASE_AUTH' // Firebase Authentication
}

export type EntityType = 'task' | 'habit' | 'friend' | 'objective' | 'keyResult' | 'place' | 'lifeArea' | 'vision' | 'timeSlot';

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
  // Sync fields
  syncMetadata?: SyncMetadata;
  googleContactId?: string; // Google Contact ID
  email?: string; // Email from Google Contacts
  phone?: string; // Phone from Google Contacts
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
}

// Sync Metadata
export interface SyncMetadata {
  lastSyncedAt?: string; // ISO timestamp
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  externalId?: string; // ID in external service
  externalService: 'google_calendar' | 'google_tasks' | 'google_contacts' | 'asana';
  conflictDetails?: {
    field: string;
    appValue: any;
    externalValue: any;
  }[];
}

export interface Task {
  id: string;
  title: string;
  tag: string;
  time?: string;
  completed: boolean;
  priority?: boolean;
  // Time Management fields
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm of "HH:mm-HH:mm"
  timeSlotId?: string; // Link naar TimeSlot
  dayPart?: string; // "Morning", "Afternoon", "Evening", "All Day"
  allDay?: boolean; // Voor all-day events
  duration?: number; // Minuten
  // Goal-First fields
  objectiveId?: string; // Link naar Goal
  lifeAreaId?: string; // Link naar Life Area
  keyResultId?: string; // Link naar Subgoal
  calendarEventId?: string; // Voor Google Calendar sync
  // Relationship fields
  friendId?: string; // Link naar Friend (My Orbit)
  // Sync fields
  syncMetadata?: SyncMetadata;
  googleTaskId?: string; // Google Tasks ID
  asanaTaskId?: string; // Asana Task ID
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
  progressContribution?: number; // How much this habit contributes to Key Result (e.g., 0.5 km per completion)
  // Goal-First fields
  objectiveId?: string; // Link naar Goal
  lifeAreaId?: string; // Link naar Life Area
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
  progress: number; // 0-100 (can be auto-calculated)
  // Goal-First fields
  lifeAreaId: string; // VERPLICHT - elk goal moet een Life Area hebben
  visionId?: string; // Optioneel - link naar specifieke vision
  deadline?: string; // "1m left", "3d left", etc. (formatted)
  lifescan?: number; // Score 1-10 voor deze Life Area
  // Timeline fields - VERPLICHT
  startDate: string; // YYYY-MM-DD voor timeline
  endDate: string; // YYYY-MM-DD voor timeline
  timelineColor?: string; // Voor Gantt chart
}

// Child Result
export interface KeyResult {
  id: string;
  objectiveId: string; // Foreign key
  title: string;
  current: number;
  target: number;
  measurementType: 'percentage' | 'number' | 'currency'; // Type of measurement
  currency?: string; // Currency code (e.g., 'EUR', 'USD') - only for currency type
  decimals: number; // Number of decimal places (0-2)
  status: 'On Track' | 'At Risk' | 'Off Track';
  owner?: string; // Optional override
  ownerImage?: string; // Owner profile image
  // Timeline fields - VERPLICHT
  startDate: string; // YYYY-MM-DD voor timeline
  endDate: string; // YYYY-MM-DD voor timeline
  // Legacy field for backwards compatibility
  unit?: string; // Deprecated - use measurementType instead
}

// Status Update voor Key Results
export interface StatusUpdate {
  id: string;
  keyResultId: string; // Foreign key naar KeyResult
  date: string; // YYYY-MM-DD - datum van de update
  currentValue: number; // Nieuwe waarde op deze datum
  status: 'On Track' | 'At Risk' | 'Off Track'; // Status op dit moment
  description: string; // Geschreven uitleg van voortgang/blokkades
  author: string; // Wie heeft de update gemaakt
  authorImage?: string; // Profiel foto van auteur
  createdAt: string; // ISO timestamp wanneer update is gemaakt
}

export interface Place {
  id: string;
  name: string;
  address: string;
  type: 'Coffee' | 'Food' | 'Gym' | 'Park';
  rating: string;
}

// Life Planner - Step 1: Vision & Life Areas
export interface LifeArea {
  id: string;
  name: string; // "Work & Career", "Sport & Health", etc.
  icon: string; // Material icon name
  color: string; // Hex color voor visual identity
  description?: string; // Korte beschrijving
  image?: string; // Optionele header image
  visionStatement?: string; // Vision statement - de "Why" tekst
  visionImages?: string[]; // Array van vision images
  order: number; // Voor sortering
  createdAt: string;
  updatedAt: string;
}

export interface Vision {
  id: string;
  lifeAreaId: string; // Link naar Life Area
  statement: string; // De "Why" tekst
  images: string[]; // Array van vision images
  createdAt: string;
  updatedAt: string;
}

// Time Management
export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  type: 'deep-work' | 'goal-work' | 'life-area' | 'meeting' | 'personal';
  objectiveId?: string; // Link naar Goal
  lifeAreaId?: string; // Link naar Life Area
  color: string; // Voor visualisatie
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
  };
  // Sync fields
  syncMetadata?: SyncMetadata;
  googleCalendarEventId?: string; // Google Calendar Event ID
  recurringEventId?: string; // For recurring events
}

export interface DayPart {
  id: string;
  name: string; // "Morning", "Afternoon", "Evening", "All Day"
  startTime?: string; // Optioneel voor time-based parts
  endTime?: string; // Optioneel voor time-based parts
  order: number;
}

// Notifications & Reminders
export interface Reminder {
  id: string;
  entityType: EntityType; // 'task' | 'habit' | 'objective' | 'timeSlot'
  entityId: string; // ID van de gekoppelde entiteit
  title: string; // Titel van de reminder (meestal entiteit titel)
  scheduledTime: string; // ISO timestamp wanneer reminder moet worden getoond
  offsetMinutes: number; // Hoeveel minuten voor de scheduledTime (bijv. -15 voor 15 minuten ervoor)
  completed: boolean; // Of de reminder al is getoond/afgehandeld
  createdAt: string; // ISO timestamp wanneer reminder is aangemaakt
  updatedAt: string; // ISO timestamp laatste update
}

export interface Notification {
  id: string;
  type: 'reminder' | 'achievement' | 'system' | 'social';
  title: string;
  message: string;
  icon: string; // Material icon name
  color: string; // Hex color voor icon background
  read: boolean;
  createdAt: string; // ISO timestamp
  actionUrl?: string; // Optionele link naar gerelateerde entiteit/view
  entityType?: EntityType;
  entityId?: string;
  reminderId?: string; // Link naar Reminder als type === 'reminder'
}

export interface NotificationSettings {
  enabled: boolean; // Globale notificatie toggle
  browserNotifications: boolean; // Web browser notifications
  soundEnabled: boolean; // Geluid bij notificaties
  reminderDefaults: {
    task: number; // Default offset in minuten voor tasks (bijv. 15)
    habit: number; // Default offset voor habits
    objective: number; // Default offset voor objectives
    timeSlot: number; // Default offset voor timeSlots
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm (bijv. "22:00")
    endTime: string; // HH:mm (bijv. "08:00")
  };
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
  darkMode: boolean;
  showCategory: boolean; // Show personal/professional category split
  // Life Planner
  lifeAreas: LifeArea[];
  visions: Vision[];
  timeSlots: TimeSlot[];
  dayParts: DayPart[];
  statusUpdates: StatusUpdate[];
  reminders: Reminder[];
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  
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
  
  // Status Updates
  addStatusUpdate: (update: StatusUpdate) => void;
  updateStatusUpdate: (update: StatusUpdate) => void;
  deleteStatusUpdate: (id: string) => void;
  getStatusUpdatesByKeyResult: (keyResultId: string) => StatusUpdate[];

  addPlace: (place: Place) => void;
  deletePlace: (id: string) => void;

  addTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;

  // Life Planner actions
  addLifeArea: (lifeArea: LifeArea) => void;
  updateLifeArea: (lifeArea: LifeArea) => void;
  deleteLifeArea: (id: string) => void;
  reorderLifeAreas: (lifeAreas: LifeArea[]) => void;
  
  addVision: (vision: Vision) => void;
  updateVision: (vision: Vision) => void;
  deleteVision: (id: string) => void;
  
  addTimeSlot: (timeSlot: TimeSlot) => void;
  updateTimeSlot: (timeSlot: TimeSlot) => void;
  deleteTimeSlot: (id: string) => void;
  
  updateDayPart: (dayPart: DayPart) => void;
  deleteDayPart: (id: string) => void;
  reorderDayParts: (dayParts: DayPart[]) => void;

  // Helper functions
  getLifeAreaById: (id: string) => LifeArea | undefined;
  getVisionByLifeArea: (lifeAreaId: string) => Vision | undefined;
  getObjectivesByLifeArea: (lifeAreaId: string) => Objective[];
  getTasksByLifeArea: (lifeAreaId: string) => Task[];
  getTasksForDate: (date: string) => Task[];
  getTimeSlotsForDate: (date: string) => TimeSlot[];
  calculateLifescan: (lifeAreaId: string) => number; // 1-10 score
  formatKeyResultValue: (kr: KeyResult, value: number) => string; // Format value based on measurement type
  
  // Cross-entity helper functions for integration
  getTasksByObjective: (objectiveId: string) => Task[];
  getTasksByKeyResult: (keyResultId: string) => Task[];
  getHabitsByObjective: (objectiveId: string) => Habit[];
  getHabitsByKeyResult: (keyResultId: string) => Habit[];
  getHabitsByLifeArea: (lifeAreaId: string) => Habit[];
  getKeyResultsByObjective: (objectiveId: string) => KeyResult[];
  getTimeSlotsByObjective: (objectiveId: string) => TimeSlot[];
  getTimeSlotsByLifeArea: (lifeAreaId: string) => TimeSlot[];
  getObjectivesByKeyResult: (keyResultId: string) => Objective[]; // Via objectiveId
  getLifeAreaByObjective: (objectiveId: string) => LifeArea | undefined;

  setAccentColor: (color: string) => void;
  setDarkMode: (enabled: boolean) => void;
  setShowCategory: (enabled: boolean) => void;

  // Notifications & Reminders
  addReminder: (reminder: Reminder) => void;
  updateReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
  getRemindersByEntity: (entityType: EntityType, entityId: string) => Reminder[];
  getUpcomingReminders: (limit?: number) => Reminder[];
  
  addNotification: (notification: Notification) => void;
  updateNotification: (notification: Notification) => void;
  deleteNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  getUnreadNotificationsCount: () => number;
  
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  clearAllData: () => Promise<void>;
  restoreExampleData: () => void;
  
  // Sync service functions
  getSyncQueueStatus: () => { queueLength: number; isProcessing: boolean; items: any[] };
  triggerSync: () => Promise<void>;
  getSyncConfig: () => any;
  updateSyncConfig: (config: Partial<any>) => void;
}
