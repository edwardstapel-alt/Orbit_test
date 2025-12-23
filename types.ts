
export enum View {
  DASHBOARD = 'DASHBOARD',
  RELATIONSHIPS = 'RELATIONSHIPS',
  FRIEND_DETAIL = 'FRIEND_DETAIL',
  MAP = 'MAP',
  TASKS = 'TASKS', // Tasks Week View
  TASKS_OVERVIEW = 'TASKS_OVERVIEW', // Tasks Overview Page
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
  FIREBASE_AUTH = 'FIREBASE_AUTH', // Firebase Authentication
  CONFLICT_MANAGEMENT = 'CONFLICT_MANAGEMENT', // Conflict Management
  HABIT_DETAIL = 'HABIT_DETAIL', // Habit Detail View
  HABIT_ANALYTICS = 'HABIT_ANALYTICS', // Habit Analytics Dashboard
  HABIT_TEMPLATES = 'HABIT_TEMPLATES', // Habit Template Library
  TEMPLATE_LIBRARY = 'TEMPLATE_LIBRARY', // Template Library (Tasks & Habits)
  GOAL_PLANS = 'GOAL_PLANS', // Goal Plans / Objective Templates
  HABITS = 'HABITS', // Habits Overview Page
  WEEKLY_REVIEW = 'WEEKLY_REVIEW', // Weekly Review
  MONTHLY_REVIEW = 'MONTHLY_REVIEW', // Monthly Review
  REVIEWS_OVERVIEW = 'REVIEWS_OVERVIEW', // Reviews Overview
  RETROSPECTIVE = 'RETROSPECTIVE' // Retrospective
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
  syncStatus: 'synced' | 'pending' | 'syncing' | 'conflict' | 'error';
  externalId?: string; // ID in external service
  externalService: 'google_calendar' | 'google_tasks' | 'google_contacts' | 'asana';
  syncVersion?: number; // Versie nummer voor conflict detection
  syncDirection?: 'export' | 'import' | 'bidirectional';
  syncErrors?: string[]; // Lijst van sync errors
  conflictDetails?: ConflictDetails;
  appLastModified?: string; // ISO timestamp laatste wijziging in app
  externalLastModified?: string; // ISO timestamp laatste wijziging in externe service
}

// Conflict Details
export interface ConflictDetails {
  field: string;
  appValue: any;
  externalValue: any;
}

// Conflict interface
export interface Conflict {
  id: string;
  entityType: 'task' | 'timeSlot' | 'objective' | 'friend';
  entityId: string;
  service: 'google_calendar' | 'google_tasks' | 'google_contacts' | 'asana';
  appValue: any; // Huidige waarde in app
  externalValue: any; // Huidige waarde in externe service
  conflictFields: FieldDifference[]; // Welke velden conflicteren
  appLastModified: string; // ISO timestamp
  externalLastModified: string; // ISO timestamp
  detectedAt: string; // ISO timestamp wanneer conflict gedetecteerd is
  resolvedAt?: string; // ISO timestamp wanneer conflict opgelost is
  resolution?: ConflictResolution;
  priority: 'low' | 'medium' | 'high'; // Prioriteit van conflict
}

// Field difference details
export interface FieldDifference {
  field: string; // Naam van het veld
  appValue: any; // Waarde in app
  externalValue: any; // Waarde in externe service
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  canMerge: boolean; // Of velden kunnen worden gemerged
}

// Conflict resolution strategie
export interface ConflictResolution {
  strategy: 'app_wins' | 'external_wins' | 'last_write_wins' | 'merge' | 'manual';
  resolvedBy?: string; // User ID of 'system'
  resolvedAt: string; // ISO timestamp
  finalValue?: any; // Finale waarde na resolutie
  mergedFields?: { [field: string]: any }; // Voor merge strategie
}

// Conflict resolution configuratie
export interface ConflictResolutionConfig {
  defaultStrategy: 'app_wins' | 'external_wins' | 'last_write_wins' | 'merge' | 'manual';
  autoResolve: boolean; // Automatisch oplossen zonder user input
  notifyOnConflict: boolean; // Notificatie bij conflict
  perServiceStrategy?: {
    [service: string]: 'app_wins' | 'external_wins' | 'last_write_wins' | 'merge' | 'manual';
  };
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
  // Recurring fields
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval?: number; // Bijv. elke 2 weken
    daysOfWeek?: number[]; // 0-6 (zondag-zaterdag) voor weekly
    dayOfMonth?: number; // 1-31 voor monthly
    nthWeekday?: {
      weekday: number; // 0-6
      n: number; // 1-5 (1e, 2e, 3e, etc.)
    };
    endDate?: string; // YYYY-MM-DD
    endAfterOccurrences?: number;
    skipWeekends?: boolean;
    timezone?: string;
    lastGenerated?: string; // YYYY-MM-DD van laatste gegenereerde instance
    nextGenerationDate?: string; // YYYY-MM-DD wanneer volgende instance gegenereerd moet worden
    parentTaskId?: string; // ID van parent recurring task
    instanceNumber?: number; // Voor tracking welke instance dit is
  };
  // Metadata
  createdAt?: string; // ISO timestamp wanneer taak is aangemaakt
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
  // Extended History (Fase 2)
  monthlyHistory?: { [date: string]: boolean }; // Extended history: date -> completed (YYYY-MM-DD format)
  completionHistory?: CompletionRecord[]; // All completions with timestamps
  longestStreak?: number; // All-time best streak
  totalCompletions?: number; // All-time count
  createdAt?: string; // When habit was created (ISO timestamp)
  // Editor improvements (Fase 2)
  targetFrequency?: number; // e.g., 5 (times per week)
  reminderTime?: string; // e.g., "08:00"
  color?: string; // Custom color for habit
  category?: string; // e.g., "Health", "Productivity"
  notes?: string; // User notes/reflections
  // Template reference (Fase 4)
  templateId?: string; // ID of template used to create this habit
  // Recurring fields
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // Voor weekly habits (0-6, zondag-zaterdag)
    specificDays?: number[]; // 1-31 voor monthly
    skipWeekends?: boolean;
    reminderTime?: string; // HH:mm
  };
}

// Completion record with timestamp
export interface CompletionRecord {
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO timestamp
  timeOfDay?: string; // HH:mm (optional, for analytics)
}

// Action Plan Task
export interface ActionPlanTask {
  id: string;
  title: string;
  scheduledDate?: string; // YYYY-MM-DD
  week?: number; // Which week this task belongs to
  order?: number; // Order within the week
}

// Action Plan Week
export interface ActionPlanWeek {
  weekNumber: number;
  title: string;
  tasks: ActionPlanTask[];
}

// Habit Template (Fase 4)
export interface ObjectiveTemplate {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: string; // Life Area category (e.g., "Work & Career", "Sport & Health")
  objectiveData: Partial<Objective>; // Alle objective velden behalve id
  actionPlan?: {
    weeks: ActionPlanWeek[];
    duration?: number; // Duration in weeks
  };
  usageCount: number;
  lastUsed?: string; // ISO timestamp
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[]; // For search/filtering
}

export interface HabitTemplate {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: string; // "Health", "Productivity", "Learning", etc.
  color?: string;
  // Template data
  habitData: Partial<Habit>; // All habit fields except id, completed, streak
  // Metadata
  usageCount: number;
  lastUsed?: string; // ISO timestamp
  isDefault: boolean; // System template vs user template
  createdAt: string;
  updatedAt: string;
  tags?: string[]; // For search/filtering
}

// Task Template
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category: string; // "Work", "Personal", "Health", etc.
  icon?: string;
  // Template data
  taskData: Partial<Task>; // Alle task velden behalve id, completed
  // Metadata
  usageCount: number;
  lastUsed?: string; // ISO timestamp
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[]; // For search/filtering
}

// Quick Action
export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  type: 'template' | 'navigation' | 'custom';
  // Voor template type
  templateId?: string;
  templateType?: 'task' | 'habit';
  // Voor navigation type
  targetView?: View;
  // Voor custom type
  customHandler?: string; // Function name
  // Metadata
  order: number;
  isPinned: boolean;
  usageCount: number;
  lastUsed?: string;
}

// Habit Analytics (Fase 3)
export interface HabitAnalytics {
  habitId: string;
  // Trends
  completionTrend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number; // Percentage change
  // Patterns
  bestDayOfWeek: number; // 0-6 (Sunday-Saturday)
  bestTimeOfDay?: string; // Most common completion time
  weekdayCompletionRate: number; // 0-1
  weekendCompletionRate: number; // 0-1
  // Correlations
  correlatedHabits?: Array<{
    habitId: string;
    habitName: string;
    correlationScore: number; // 0-1 (how often done together)
  }>;
  // Milestones
  currentStreak: number;
  longestStreak: number;
  streakMilestones: number[]; // [7, 30, 100, etc.] - achieved milestones
  // Overall stats
  completionRate30Days: number; // 0-1
  completionRate90Days: number; // 0-1
  totalCompletions: number;
  averageCompletionsPerWeek: number;
}

// Parent Goal
export interface Objective {
  id: string;
  title: string;
  description?: string;
  owner: string;
  ownerImage?: string;
  status: 'On Track' | 'At Risk' | 'Off Track' | 'No status';
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
  measurementType: 'percentage' | 'number' | 'currency' | 'weight' | 'distance' | 'time' | 'height' | 'pages' | 'chapters' | 'custom'; // Type of measurement
  currency?: string; // Currency code (e.g., 'EUR', 'USD') - only for currency type
  customUnit?: string; // Custom unit label (e.g., 'reps', 'sets') - only for custom type
  decimals: number; // Number of decimal places (0-2)
  status: 'On Track' | 'At Risk' | 'Off Track' | 'No status';
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
  status: 'On Track' | 'At Risk' | 'Off Track' | 'No status'; // Status op dit moment
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

// Planning & Review Types
export interface ReviewQuestion {
  id: string;
  question: string;
  type: 'text' | 'number' | 'select' | 'multi-select';
  required: boolean;
  order: number;
  options?: string[]; // For select/multi-select types
}

export interface ReviewInsight {
  id: string;
  type: 'success' | 'warning' | 'improvement' | 'trend';
  title: string;
  description: string;
  data?: any; // Additional data for the insight
  createdAt: string;
}

export interface Review {
  id: string;
  type: 'weekly' | 'monthly';
  date: string; // YYYY-MM-DD - start date of week/month
  endDate: string; // YYYY-MM-DD - end date of week/month
  // Answers to structured questions
  answers: {
    [questionId: string]: string | number | string[]; // Answer value(s)
  };
  // Reflection text
  achievements?: string; // What did I achieve?
  goalsOnTrack?: string[]; // Objective/key result IDs that are on track
  goalsNeedingAttention?: string[]; // Objective/key result IDs needing attention
  lessons?: string; // What did I learn?
  nextWeekChanges?: string; // What will I do differently next week?
  // Monthly specific
  biggestSuccesses?: string; // Biggest successes this month
  goalsNotMet?: string; // Goals not met and why
  keyInsights?: string; // Key insights
  goalsToAdjust?: string[]; // Objective/key result IDs to adjust
  nextMonthPriorities?: string; // Priorities for next month
  // Action items
  actionItems?: Array<{
    id: string;
    title: string;
    dueDate?: string; // YYYY-MM-DD
    linkedObjectiveId?: string;
    linkedKeyResultId?: string;
    completed: boolean;
  }>;
  // Insights (auto-generated)
  insights?: ReviewInsight[];
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  completed: boolean; // Whether review is completed
}

export interface Retrospective {
  id: string;
  objectiveId?: string; // Link to objective (optional)
  keyResultId?: string; // Link to key result (optional)
  date: string; // YYYY-MM-DD - date of the retrospective
  // Start/Stop/Continue format
  start: string[]; // What should I start doing?
  stop: string[]; // What should I stop doing?
  continue: string[]; // What works well and should I continue?
  // Lessons learned
  lessonsLearned?: string; // What did I learn?
  whatWouldIDoDifferently?: string; // What would I do differently?
  biggestChallenges?: string; // What were the biggest challenges?
  // Action items
  actionItems?: Array<{
    id: string;
    title: string;
    dueDate?: string; // YYYY-MM-DD
    completed: boolean;
  }>;
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  completed: boolean; // Whether retrospective is completed
}

export interface ActionPlanProgress {
  objectiveId: string;
  totalWeeks: number;
  completedWeeks: number;
  totalTasks: number;
  completedTasks: number;
  weekProgress: Array<{
    weekNumber: number;
    weekTitle: string;
    totalTasks: number;
    completedTasks: number;
    progress: number; // 0-100
    tasks: Array<{
      id: string;
      title: string;
      scheduledDate?: string;
      completed: boolean;
      taskId?: string; // Link to actual Task if created
    }>;
  }>;
  overallProgress: number; // 0-100
  nextUpcomingTask?: {
    id: string;
    title: string;
    scheduledDate: string;
    weekNumber: number;
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
  darkMode: boolean; // Deprecated - use theme instead
  theme: 'light' | 'dark' | 'black';
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
  deletedGoogleTaskIds: string[]; // Track deleted Google Task IDs to prevent re-import
  deletedTaskIds: Array<{ id: string; deletedAt: string }>; // Track all deleted task IDs with timestamps to prevent Firebase sync from restoring them
  
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  deleteCompletedTasks: () => number; // Returns number of deleted tasks
  
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
  setDarkMode: (enabled: boolean) => void; // Deprecated - use setTheme instead
  setTheme: (theme: 'light' | 'dark' | 'black') => void;
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

  // Task Templates & Quick Actions
  addTaskTemplate: (template: TaskTemplate) => void;
  updateTaskTemplate: (template: TaskTemplate) => void;
  deleteTaskTemplate: (id: string) => void;
  createTaskFromTemplate: (templateId: string) => Task | null;
  addObjectiveTemplate: (template: ObjectiveTemplate) => void;
  updateObjectiveTemplate: (template: ObjectiveTemplate) => void;
  deleteObjectiveTemplate: (id: string) => void;
  createObjectiveFromTemplate: (templateId: string, lifeAreaId?: string) => Objective | null;
  
  addQuickAction: (action: QuickAction) => void;
  updateQuickAction: (action: QuickAction) => void;
  deleteQuickAction: (id: string) => void;
  executeQuickAction: (actionId: string) => void;

  clearAllData: () => Promise<void>;
  restoreExampleData: () => void;
  
  // Sync service functions
  getSyncQueueStatus: () => { queueLength: number; isProcessing: boolean; items: any[] };
  triggerSync: () => Promise<void>;
  getSyncConfig: () => any;
  updateSyncConfig: (config: Partial<any>) => void;
  
  // Conflict management
  conflicts: Conflict[];
  getConflicts: () => Conflict[];
  getConflictsByType: (entityType: Conflict['entityType']) => Conflict[];
  getConflictsByService: (service: Conflict['service']) => Conflict[];
  detectConflicts: () => Promise<Conflict[]>;
  resolveConflict: (conflictId: string, strategy?: ConflictResolution['strategy']) => Promise<void>;
  autoResolveConflicts: () => Promise<void>;
  updateConflictResolutionConfig: (config: Partial<ConflictResolutionConfig>) => void;
  
  // Import functions
  importTasksFromGoogle: (taskListIds?: string[]) => Promise<{ imported: number; updated: number; conflicts: number }>;
  importTimeSlotsFromCalendar: (calendarIds?: string[]) => Promise<{ imported: number; updated: number; conflicts: number }>;
  startAutoImport: (intervalMinutes?: number) => Promise<void>;
  stopAutoImport: () => void;
  
  // Planning & Review functions
  reviews: Review[];
  retrospectives: Retrospective[];
  addReview: (review: Review) => void;
  updateReview: (review: Review) => void;
  deleteReview: (id: string) => void;
  getReviewByDate: (date: string, type: 'weekly' | 'monthly') => Review | undefined;
  getLatestReview: (type: 'weekly' | 'monthly') => Review | undefined;
  generateReviewInsights: (review: Review) => ReviewInsight[];
  addRetrospective: (retrospective: Retrospective) => void;
  updateRetrospective: (retrospective: Retrospective) => void;
  deleteRetrospective: (id: string) => void;
  getRetrospectivesByObjective: (objectiveId: string) => Retrospective[];
  getRetrospectivesByKeyResult: (keyResultId: string) => Retrospective[];
  calculateActionPlanProgress: (objectiveId: string) => ActionPlanProgress;
}
