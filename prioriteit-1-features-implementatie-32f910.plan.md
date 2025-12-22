<!-- f99fed3f-e858-4f41-9acb-9f2496ff8b0e 6cabac45-062f-41b6-ae5c-f0a4975bfc4d -->
# Prioriteit 1 Features Implementatie Plan

Dit plan beschrijft de implementatie van drie kritieke features voor het stroomlijnen van het dagelijks leven: Notifications & Reminders, Recurring Tasks & Habits, en Templates & Quick Actions.

## Fase 1: Notifications & Reminders Systeem

### 1.1 Type Definities Uitbreiden

**Bestand**: `types.ts`

Nieuwe interfaces toevoegen:

- `Notification` interface voor opgeslagen notificaties
- `Reminder` interface voor reminder configuraties
- `NotificationSettings` interface voor gebruikersinstellingen
- Uitbreiden van `Task`, `Habit`, `Objective`, `TimeSlot` met `reminder` veld
```typescript
export interface Notification {
  id: string;
  type: 'task' | 'habit' | 'objective' | 'timeSlot' | 'keyResult' | 'system';
  entityId?: string; // ID van gerelateerde entiteit
  title: string;
  message: string;
  scheduledFor: string; // ISO timestamp
  delivered: boolean;
  deliveredAt?: string; // ISO timestamp
  actionUrl?: string; // Deep link naar relevante view
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface Reminder {
  id: string;
  entityType: 'task' | 'habit' | 'objective' | 'timeSlot';
  entityId: string;
  enabled: boolean;
  // Timing opties
  timeBefore?: number; // Minuten voor event (bijv. 60 = 1 uur voor)
  specificTime?: string; // HH:mm voor habits
  daysOfWeek?: number[]; // 0-6 (zondag-zaterdag) voor habits
  skipWeekends?: boolean;
  // Advanced patterns
  nthWeekday?: { // Bijv. elke 2e maandag
    weekday: number; // 0-6
    n: number; // 1-5 (1e, 2e, 3e, etc.)
  };
  customInterval?: {
    unit: 'days' | 'weeks' | 'months';
    value: number;
  };
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours?: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  weekendMode?: {
    enabled: boolean;
    differentSchedule?: boolean;
  };
  groupingEnabled: boolean;
  priorityFilter: 'all' | 'high' | 'high+medium';
}
```


### 1.2 Notification Service Implementatie

**Nieuw bestand**: `utils/notificationService.ts`

Core service voor notification management:

- `scheduleNotification()` - Plan notificatie
- `cancelNotification()` - Annuleer notificatie
- `getUpcomingNotifications()` - Haal aankomende notificaties op
- `markAsDelivered()` - Markeer als afgeleverd
- `checkAndTriggerReminders()` - Controleer reminders en trigger notificaties

**Nieuw bestand**: `utils/webNotificationService.ts`

Web-specifieke implementatie:

- Browser Notification API wrapper
- Permission handling
- Local storage voor scheduled notifications
- Background check via service worker of interval

**Nieuw bestand**: `utils/mobileNotificationService.ts`

Mobile-specifieke implementatie:

- Capacitor Local Notifications plugin wrapper
- Native notification scheduling
- Permission handling voor Android/iOS

### 1.3 Reminder Engine

**Nieuw bestand**: `utils/reminderEngine.ts`

Core logica voor reminder berekeningen:

- `calculateNextReminderTime()` - Bereken volgende reminder tijd op basis van reminder config
- `shouldTriggerReminder()` - Check of reminder getriggerd moet worden
- `parseRecurringPattern()` - Parse advanced recurring patterns
- Support voor: daily, weekly, monthly, nth weekday, custom intervals, skip weekends

### 1.4 DataContext Integratie

**Bestand**: `context/DataContext.tsx`

Uitbreiden met:

- `notifications: Notification[]` state
- `reminders: Reminder[]` state
- `notificationSettings: NotificationSettings` state
- `addReminder()`, `updateReminder()`, `deleteReminder()` functies
- `addNotification()`, `updateNotification()` functies
- Auto-sync reminders naar Firebase
- Auto-schedule notificaties bij task/habit/objective updates

### 1.5 UI Componenten

**Bestand**: `views/Notifications.tsx` (herwerken)

Vervang mock data met echte notificaties:

- Lijst van alle notificaties (geleverd + upcoming)
- Filter op type, status, datum
- Markeer als gelezen
- Deep links naar gerelateerde entiteiten
- Batch acties (markeer alle als gelezen, verwijder oud)

**Nieuw bestand**: `components/ReminderEditor.tsx`

Component voor reminder configuratie:

- Entity selector (task/habit/objective/timeSlot)
- Timing opties (time before, specific time)
- Advanced pattern selector (nth weekday, custom interval)
- Weekend skip toggle
- Preview volgende reminder tijden

**Nieuw bestand**: `views/NotificationSettings.tsx`

Settings pagina voor notificaties:

- Enable/disable notificaties
- Sound/vibration toggles
- Quiet hours configuratie
- Weekend mode instellingen
- Notification grouping preferences
- Permission status en request button

### 1.6 Editor Integratie

**Bestand**: `views/Editor.tsx`

Reminder sectie toevoegen aan:

- Task editor
- Habit editor
- Objective editor
- TimeSlot editor

Integreer `ReminderEditor` component in relevante editors.

### 1.7 Background Processing

**Nieuw bestand**: `utils/notificationScheduler.ts`

Background service die:

- Periodiek checkt op reminders die getriggerd moeten worden
- Nieuwe notificaties schedule wanneer reminders worden toegevoegd
- Cleanup oude notificaties
- Sync met Firebase voor cross-device notificaties

**Bestand**: `App.tsx`

Initialiseer notification scheduler bij app start:

- Start interval check (elke minuut)
- Setup service worker voor web (optioneel)
- Register Capacitor listeners voor mobile

### 1.8 Capacitor Plugin Setup

**Bestand**: `package.json`

Toevoegen dependencies:

- `@capacitor/local-notifications`
- `@capacitor/push-notifications` (optioneel voor push)

**Bestand**: `capacitor.config.ts`

Configuratie voor notification plugins.

**Bestand**: `android/app/src/main/AndroidManifest.xml`

Notification permissions toevoegen.

## Fase 2: Recurring Tasks & Habits

### 2.1 Type Definities Uitbreiden

**Bestand**: `types.ts`

Uitbreiden `Task` en `Habit` interfaces:

```typescript
// In Task interface toevoegen:
recurring?: {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number; // Bijv. elke 2 weken
  daysOfWeek?: number[]; // 0-6 voor weekly
  dayOfMonth?: number; // 1-31 voor monthly
  nthWeekday?: {
    weekday: number; // 0-6
    n: number; // 1-5
  };
  endDate?: string; // YYYY-MM-DD
  endAfterOccurrences?: number;
  skipWeekends?: boolean;
  skipHolidays?: boolean;
  timezone?: string;
  lastGenerated?: string; // YYYY-MM-DD van laatste gegenereerde instance
  nextGenerationDate?: string; // YYYY-MM-DD wanneer volgende instance gegenereerd moet worden
  parentTaskId?: string; // ID van parent recurring task
  instanceNumber?: number; // Voor tracking welke instance dit is
};

// In Habit interface toevoegen:
recurring?: {
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[]; // Voor weekly habits
  specificDays?: number[]; // 1-31 voor monthly
  skipWeekends?: boolean;
  reminderTime?: string; // HH:mm
};
```

### 2.2 Recurring Engine

**Nieuw bestand**: `utils/recurringEngine.ts`

Core logica voor recurring patterns:

- `calculateNextOccurrence()` - Bereken volgende occurrence datum
- `generateRecurringInstances()` - Genereer task instances voor komende periode
- `parseRecurringPattern()` - Parse en valideer recurring config
- `shouldSkipDate()` - Check of datum overgeslagen moet worden (weekends, holidays)
- Support voor alle advanced patterns: daily, weekly, monthly, yearly, nth weekday, custom intervals

### 2.3 DataContext Integratie

**Bestand**: `context/DataContext.tsx`

Uitbreiden met:

- `generateRecurringTasks()` - Genereer nieuwe task instances
- `generateRecurringHabits()` - Update habit schedule
- Auto-generatie bij app start en dagelijks
- Cleanup oude completed recurring instances (optioneel)
- Parent-child relatie tussen recurring template en instances

### 2.4 Editor Uitbreidingen

**Bestand**: `views/Editor.tsx`

Recurring sectie toevoegen:

- Toggle "Make this recurring"
- Pattern selector (daily/weekly/monthly/yearly/custom)
- Advanced opties (interval, days of week, nth weekday)
- End date/occurrences selector
- Skip weekends/holidays toggles
- Preview volgende occurrences
- Visualisatie van gegenereerde instances

### 2.5 Recurring Management UI

**Nieuw bestand**: `components/RecurringTaskManager.tsx`

Component voor beheer van recurring tasks:

- Lijst van alle recurring templates
- Toggle enable/disable
- Edit pattern
- View generated instances
- Delete recurring (met optie om instances te behouden)

**Bestand**: `views/Tasks.tsx`

Recurring indicator toevoegen:

- Badge voor recurring tasks
- Link naar parent template
- "Edit series" optie

### 2.6 Background Generation

**Bestand**: `App.tsx` of nieuw `utils/recurringScheduler.ts`

Background service:

- Check dagelijks voor recurring tasks die instances nodig hebben
- Genereer instances voor komende week/maand
- Cleanup oude instances (optioneel)
- Sync naar Firebase

## Fase 3: Templates & Quick Actions

### 3.1 Type Definities

**Bestand**: `types.ts`

Nieuwe interfaces:

```typescript
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
}

export interface HabitTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  habitData: Partial<Habit>;
  usageCount: number;
  lastUsed?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

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
```

### 3.2 Template Service

**Nieuw bestand**: `utils/templateService.ts`

Core logica:

- `createFromTemplate()` - Maak task/habit van template
- `getTemplatesByCategory()` - Filter templates
- `getPopularTemplates()` - Sorteer op usage
- `updateTemplateUsage()` - Track usage statistics
- Default templates seeden

### 3.3 DataContext Integratie

**Bestand**: `context/DataContext.tsx`

Uitbreiden met:

- `taskTemplates: TaskTemplate[]` state
- `habitTemplates: HabitTemplate[]` state
- `quickActions: QuickAction[]` state
- `addTaskTemplate()`, `updateTaskTemplate()`, `deleteTaskTemplate()`
- `addHabitTemplate()`, `updateHabitTemplate()`, `deleteHabitTemplate()`
- `addQuickAction()`, `updateQuickAction()`, `deleteQuickAction()`
- `createFromTemplate()` - Instantieer van template
- Auto-sync naar Firebase

### 3.4 Template Library UI

**Nieuw bestand**: `views/TemplateLibrary.tsx`

Hoofdpagina voor templates:

- Tab navigatie: Task Templates, Habit Templates, Quick Actions
- Category filters
- Search functionaliteit
- Sort opties (popular, recent, alphabetical)
- Template cards met preview
- "Use Template" button
- "Create Custom Template" button

**Nieuw bestand**: `components/TemplateCard.tsx`

Herbruikbare template card component:

- Template preview
- Category badge
- Usage count
- Quick actions (use, edit, delete)

**Nieuw bestand**: `views/TemplateEditor.tsx`

Editor voor templates:

- Template naam, beschrijving, category
- Formulier gebaseerd op Task/Habit editor
- Preview van gegenereerde item
- Save als template

### 3.5 Quick Actions UI

**Nieuw bestand**: `components/QuickActionsPanel.tsx`

Floating action panel:

- Grid van quick action buttons
- Drag & drop voor reordering
- Pin/unpin functionaliteit
- "Add Quick Action" button
- Context-aware actions (bijv. in Today view andere actions dan in Tasks view)

**Bestand**: `views/Dashboard.tsx`

Quick Actions sectie toevoegen:

- Prominente quick actions
- "View All" link naar Template Library

**Bestand**: `components/BottomNav.tsx` of `components/TopNav.tsx`

Quick action button toevoegen (optioneel).

### 3.6 Default Templates Seeding

**Nieuw bestand**: `utils/defaultTemplates.ts`

Seed data voor default templates:

- Work templates (Meeting prep, Email follow-up, etc.)
- Personal templates (Grocery shopping, Exercise, etc.)
- Health templates (Morning routine, Meditation, etc.)
- Habit templates (Daily reading, Water intake, etc.)

### 3.7 Template Import/Export

**Bestand**: `views/DataManagement.tsx`

Uitbreiden export/import:

- Include templates in JSON export
- Import templates van backup
- Separate template export optie

## Implementatie Volgorde

### Week 1: Notifications Foundation

1. Type definities voor notifications en reminders
2. Web notification service implementatie
3. Reminder engine basis functionaliteit
4. DataContext integratie
5. Basic notification UI

### Week 2: Notifications Advanced

1. Mobile notification service (Capacitor)
2. Background scheduler
3. Reminder editor component
4. Notification settings pagina
5. Editor integratie voor reminders

### Week 3: Recurring Tasks & Habits

1. Type definities voor recurring patterns
2. Recurring engine implementatie
3. Editor uitbreidingen voor recurring
4. Background generation service
5. Recurring management UI

### Week 4: Templates & Quick Actions

1. Type definities voor templates en quick actions
2. Template service implementatie
3. Template library UI
4. Quick actions panel
5. Default templates seeding

## Technische Overwegingen

### Firebase Sync

- Alle nieuwe data types (notifications, reminders, templates, quick actions) moeten gesynced worden naar Firebase
- Recurring instances moeten correct gelinkt worden aan parent templates
- Cross-device notificaties via Firebase Cloud Messaging (optioneel, toekomst)

### Performance

- Recurring generation moet efficient zijn (niet alle instances tegelijk genereren)
- Notification scheduler moet lightweight zijn
- Template library moet lazy loading ondersteunen

### User Experience

- Duidelijke feedback bij reminder/notification setup
- Preview functionaliteit voor recurring patterns
- Template preview voordat gebruik

### Testing

- Unit tests voor recurring engine logica
- Integration tests voor notification scheduling
- E2E tests voor template workflow

### To-dos

- [x] Firebase SDK installeren
- [x] Firebase configuratie bestand maken
- [x] Authenticatie setup (Email/Password)
- [x] Firestore database schema en security rules
- [x] Firebase sync service maken
- [ ] DataContext integreren met Firebase
- [x] Login/Register UI maken
- [ ] Sync status indicators in UI
- [ ] Type definities toevoegen voor Notification, Reminder, NotificationSettings in types.ts
- [ ] Web notification service implementeren (utils/webNotificationService.ts)
- [ ] Reminder engine implementeren (utils/reminderEngine.ts)
- [ ] DataContext uitbreiden met notifications, reminders, notificationSettings state en functies
- [ ] Notifications.tsx herwerken met echte notificaties i.p.v. mock data
- [ ] ReminderEditor component maken (components/ReminderEditor.tsx)
- [ ] NotificationSettings view maken (views/NotificationSettings.tsx)
- [ ] Editor.tsx uitbreiden met reminder sectie voor tasks, habits, objectives, timeSlots
- [ ] Notification scheduler implementeren (utils/notificationScheduler.ts)
- [ ] Capacitor Local Notifications plugin installeren en configureren
- [ ] Mobile notification service implementeren (utils/mobileNotificationService.ts)
- [ ] Type definities uitbreiden voor recurring patterns in Task en Habit interfaces
- [ ] Recurring engine implementeren (utils/recurringEngine.ts)
- [ ] DataContext uitbreiden met generateRecurringTasks en generateRecurringHabits functies
- [ ] Editor.tsx uitbreiden met recurring sectie voor tasks en habits
- [ ] RecurringTaskManager component maken (components/RecurringTaskManager.tsx)
- [ ] Background recurring scheduler implementeren (utils/recurringScheduler.ts)
- [ ] Type definities toevoegen voor TaskTemplate, HabitTemplate, QuickAction in types.ts
- [ ] Template service implementeren (utils/templateService.ts)
- [ ] DataContext uitbreiden met taskTemplates, habitTemplates, quickActions state en functies
- [ ] TemplateLibrary view maken (views/TemplateLibrary.tsx)
- [ ] TemplateCard component maken (components/TemplateCard.tsx)
- [ ] TemplateEditor view maken (views/TemplateEditor.tsx)
- [ ] QuickActionsPanel component maken (components/QuickActionsPanel.tsx)
- [ ] Default templates seeden (utils/defaultTemplates.ts)
- [ ] DataManagement.tsx uitbreiden met template export/import
- [x] Firebase SDK installeren
- [x] Firebase configuratie bestand maken
- [x] Authenticatie setup (Email/Password)
- [x] Firestore database schema en security rules
- [x] Firebase sync service maken
- [ ] DataContext integreren met Firebase
- [x] Login/Register UI maken
- [ ] Sync status indicators in UI
- [ ] Type definities toevoegen voor Notification, Reminder, NotificationSettings in types.ts
- [ ] Web notification service implementeren (utils/webNotificationService.ts)
- [ ] Reminder engine implementeren (utils/reminderEngine.ts)
- [ ] DataContext uitbreiden met notifications, reminders, notificationSettings state en functies
- [ ] Notifications.tsx herwerken met echte notificaties i.p.v. mock data
- [ ] ReminderEditor component maken (components/ReminderEditor.tsx)
- [ ] NotificationSettings view maken (views/NotificationSettings.tsx)
- [ ] Editor.tsx uitbreiden met reminder sectie voor tasks, habits, objectives, timeSlots
- [ ] Notification scheduler implementeren (utils/notificationScheduler.ts)
- [ ] Capacitor Local Notifications plugin installeren en configureren
- [ ] Mobile notification service implementeren (utils/mobileNotificationService.ts)
- [ ] Type definities uitbreiden voor recurring patterns in Task en Habit interfaces
- [ ] Recurring engine implementeren (utils/recurringEngine.ts)
- [ ] DataContext uitbreiden met generateRecurringTasks en generateRecurringHabits functies
- [ ] Editor.tsx uitbreiden met recurring sectie voor tasks en habits
- [ ] RecurringTaskManager component maken (components/RecurringTaskManager.tsx)
- [ ] Background recurring scheduler implementeren (utils/recurringScheduler.ts)
- [ ] Type definities toevoegen voor TaskTemplate, HabitTemplate, QuickAction in types.ts
- [ ] Template service implementeren (utils/templateService.ts)
- [ ] DataContext uitbreiden met taskTemplates, habitTemplates, quickActions state en functies
- [ ] TemplateLibrary view maken (views/TemplateLibrary.tsx)
- [ ] TemplateCard component maken (components/TemplateCard.tsx)
- [ ] TemplateEditor view maken (views/TemplateEditor.tsx)
- [ ] QuickActionsPanel component maken (components/QuickActionsPanel.tsx)
- [ ] Default templates seeden (utils/defaultTemplates.ts)
- [ ] DataManagement.tsx uitbreiden met template export/import
- [x] Firebase SDK installeren
- [x] Firebase configuratie bestand maken
- [x] Authenticatie setup (Email/Password)
- [x] Firestore database schema en security rules
- [x] Firebase sync service maken
- [ ] DataContext integreren met Firebase
- [x] Login/Register UI maken
- [ ] Sync status indicators in UI
- [ ] Type definities toevoegen voor Notification, Reminder, NotificationSettings in types.ts
- [ ] Web notification service implementeren (utils/webNotificationService.ts)
- [ ] Reminder engine implementeren (utils/reminderEngine.ts)
- [ ] DataContext uitbreiden met notifications, reminders, notificationSettings state en functies
- [ ] Notifications.tsx herwerken met echte notificaties i.p.v. mock data
- [ ] ReminderEditor component maken (components/ReminderEditor.tsx)
- [ ] NotificationSettings view maken (views/NotificationSettings.tsx)
- [ ] Editor.tsx uitbreiden met reminder sectie voor tasks, habits, objectives, timeSlots
- [ ] Notification scheduler implementeren (utils/notificationScheduler.ts)
- [ ] Capacitor Local Notifications plugin installeren en configureren
- [ ] Mobile notification service implementeren (utils/mobileNotificationService.ts)
- [ ] Type definities uitbreiden voor recurring patterns in Task en Habit interfaces
- [ ] Recurring engine implementeren (utils/recurringEngine.ts)
- [ ] DataContext uitbreiden met generateRecurringTasks en generateRecurringHabits functies
- [ ] Editor.tsx uitbreiden met recurring sectie voor tasks en habits
- [ ] RecurringTaskManager component maken (components/RecurringTaskManager.tsx)
- [ ] Background recurring scheduler implementeren (utils/recurringScheduler.ts)
- [ ] Type definities toevoegen voor TaskTemplate, HabitTemplate, QuickAction in types.ts
- [ ] Template service implementeren (utils/templateService.ts)
- [ ] DataContext uitbreiden met taskTemplates, habitTemplates, quickActions state en functies
- [ ] TemplateLibrary view maken (views/TemplateLibrary.tsx)
- [ ] TemplateCard component maken (components/TemplateCard.tsx)
- [ ] TemplateEditor view maken (views/TemplateEditor.tsx)
- [ ] QuickActionsPanel component maken (components/QuickActionsPanel.tsx)
- [ ] Default templates seeden (utils/defaultTemplates.ts)
- [ ] DataManagement.tsx uitbreiden met template export/import
- [x] Firebase SDK installeren
- [x] Firebase configuratie bestand maken
- [x] Authenticatie setup (Email/Password)
- [x] Firestore database schema en security rules
- [x] Firebase sync service maken
- [ ] DataContext integreren met Firebase
- [x] Login/Register UI maken
- [ ] Sync status indicators in UI
- [ ] Type definities toevoegen voor Notification, Reminder, NotificationSettings in types.ts
- [ ] Web notification service implementeren (utils/webNotificationService.ts)
- [ ] Reminder engine implementeren (utils/reminderEngine.ts)
- [ ] DataContext uitbreiden met notifications, reminders, notificationSettings state en functies
- [ ] Notifications.tsx herwerken met echte notificaties i.p.v. mock data
- [ ] ReminderEditor component maken (components/ReminderEditor.tsx)
- [ ] NotificationSettings view maken (views/NotificationSettings.tsx)
- [ ] Editor.tsx uitbreiden met reminder sectie voor tasks, habits, objectives, timeSlots
- [ ] Notification scheduler implementeren (utils/notificationScheduler.ts)
- [ ] Capacitor Local Notifications plugin installeren en configureren
- [ ] Mobile notification service implementeren (utils/mobileNotificationService.ts)
- [ ] Type definities uitbreiden voor recurring patterns in Task en Habit interfaces
- [ ] Recurring engine implementeren (utils/recurringEngine.ts)
- [ ] DataContext uitbreiden met generateRecurringTasks en generateRecurringHabits functies
- [ ] Editor.tsx uitbreiden met recurring sectie voor tasks en habits
- [ ] RecurringTaskManager component maken (components/RecurringTaskManager.tsx)
- [ ] Background recurring scheduler implementeren (utils/recurringScheduler.ts)
- [ ] Type definities toevoegen voor TaskTemplate, HabitTemplate, QuickAction in types.ts
- [ ] Template service implementeren (utils/templateService.ts)
- [ ] DataContext uitbreiden met taskTemplates, habitTemplates, quickActions state en functies
- [ ] TemplateLibrary view maken (views/TemplateLibrary.tsx)
- [ ] TemplateCard component maken (components/TemplateCard.tsx)
- [ ] TemplateEditor view maken (views/TemplateEditor.tsx)
- [ ] QuickActionsPanel component maken (components/QuickActionsPanel.tsx)
- [ ] Default templates seeden (utils/defaultTemplates.ts)
- [ ] DataManagement.tsx uitbreiden met template export/import
- [x] Firebase SDK installeren
- [x] Firebase configuratie bestand maken
- [x] Authenticatie setup (Email/Password)
- [x] Firestore database schema en security rules
- [x] Firebase sync service maken
- [ ] DataContext integreren met Firebase
- [x] Login/Register UI maken
- [ ] Sync status indicators in UI
- [ ] Type definities toevoegen voor Notification, Reminder, NotificationSettings in types.ts
- [ ] Web notification service implementeren (utils/webNotificationService.ts)
- [ ] Reminder engine implementeren (utils/reminderEngine.ts)
- [ ] DataContext uitbreiden met notifications, reminders, notificationSettings state en functies
- [ ] Notifications.tsx herwerken met echte notificaties i.p.v. mock data
- [ ] ReminderEditor component maken (components/ReminderEditor.tsx)
- [ ] NotificationSettings view maken (views/NotificationSettings.tsx)
- [ ] Editor.tsx uitbreiden met reminder sectie voor tasks, habits, objectives, timeSlots
- [ ] Notification scheduler implementeren (utils/notificationScheduler.ts)
- [ ] Capacitor Local Notifications plugin installeren en configureren
- [ ] Mobile notification service implementeren (utils/mobileNotificationService.ts)
- [ ] Type definities uitbreiden voor recurring patterns in Task en Habit interfaces
- [ ] Recurring engine implementeren (utils/recurringEngine.ts)
- [ ] DataContext uitbreiden met generateRecurringTasks en generateRecurringHabits functies
- [ ] Editor.tsx uitbreiden met recurring sectie voor tasks en habits
- [ ] RecurringTaskManager component maken (components/RecurringTaskManager.tsx)
- [ ] Background recurring scheduler implementeren (utils/recurringScheduler.ts)
- [ ] Type definities toevoegen voor TaskTemplate, HabitTemplate, QuickAction in types.ts
- [ ] Template service implementeren (utils/templateService.ts)
- [ ] DataContext uitbreiden met taskTemplates, habitTemplates, quickActions state en functies
- [ ] TemplateLibrary view maken (views/TemplateLibrary.tsx)
- [ ] TemplateCard component maken (components/TemplateCard.tsx)
- [ ] TemplateEditor view maken (views/TemplateEditor.tsx)
- [ ] QuickActionsPanel component maken (components/QuickActionsPanel.tsx)
- [ ] Default templates seeden (utils/defaultTemplates.ts)
- [ ] DataManagement.tsx uitbreiden met template export/import