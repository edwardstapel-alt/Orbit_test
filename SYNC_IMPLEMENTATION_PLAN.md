# Sync Implementatie Plan - To-Do's

## Huidige Status ✅

### Wat werkt nu:
- ✅ Automatische export: Tasks, Time Slots en Goals worden automatisch naar Google gesynchroniseerd bij wijzigingen
- ✅ Background sync: Elke 15 minuten worden items in de queue verwerkt
- ✅ Handmatige sync: Trigger via de UI in SyncedAccounts view
- ✅ Sync service: Queue systeem met retry logica
- ✅ Basis export functionaliteit: Tasks → Google Tasks, Time Slots → Google Calendar, Goals → Calendar

---

## Fase 1: Sync Metadata Tracking 🔴 PRIORITEIT 1

**Doel**: Bijhouden welke items gesynchroniseerd zijn en hun externe IDs

### 1.1 Types uitbreiden
- [ ] **SyncMetadata interface uitbreiden** (`types.ts`)
  - [ ] `lastSyncedAt: string` toevoegen (timestamp van laatste sync)
  - [ ] `syncVersion: number` toevoegen (voor conflict detection)
  - [ ] `syncErrors: string[]` toevoegen (lijst van sync errors)
  - [ ] `syncDirection: 'export' | 'import' | 'bidirectional'` toevoegen

### 1.2 Externe IDs bijhouden
- [ ] **Task interface uitbreiden** (`types.ts`)
  - [ ] Zorgen dat `googleTaskId` wordt opgeslagen na export
  - [ ] `syncMetadata` object bijwerken na elke sync actie
  - [ ] `lastSyncedAt` timestamp bijwerken

- [ ] **TimeSlot interface uitbreiden** (`types.ts`)
  - [ ] Zorgen dat `googleCalendarEventId` wordt opgeslagen na export
  - [ ] `syncMetadata` object bijwerken na elke sync actie
  - [ ] `recurringEventId` bijhouden voor recurring events

- [ ] **Objective interface uitbreiden** (`types.ts`)
  - [ ] `googleCalendarEventId` toevoegen voor deadline events
  - [ ] `syncMetadata` object bijwerken

### 1.3 Sync service uitbreiden
- [ ] **syncService.ts: updateSyncMetadata functie**
  - [ ] Functie maken die sync metadata bijwerkt na succesvolle sync
  - [ ] Externe ID opslaan in entity
  - [ ] `lastSyncedAt` timestamp bijwerken
  - [ ] `syncVersion` incrementeren

- [ ] **syncService.ts: syncItem functie uitbreiden**
  - [ ] Na succesvolle sync: metadata bijwerken via `updateSyncMetadata`
  - [ ] Bij error: error message toevoegen aan `syncMetadata.syncErrors`

- [ ] **DataContext.tsx: update functies uitbreiden**
  - [ ] `updateTask`: sync metadata behouden bij updates
  - [ ] `updateTimeSlot`: sync metadata behouden bij updates
  - [ ] `updateObjective`: sync metadata behouden bij updates

---

## Fase 2: Bi-directionele Sync (Import van Google) 🔴 PRIORITEIT 2

**Doel**: Wijzigingen in Google ook terug naar de app halen

### 2.1 Google Calendar Import
- [ ] **googleSync.ts: importCalendarEvents functie**
  - [ ] Events ophalen van Google Calendar API
  - [ ] Filteren op date range (bijv. laatste 30 dagen + komende 90 dagen)
  - [ ] Events mappen naar Time Slots
  - [ ] Recurring events detecteren en behandelen
  - [ ] Event attendees → Friends linking (optioneel)
  - [ ] Event locations → Places linking (optioneel)

- [ ] **googleSync.ts: mapCalendarEventToTimeSlot functie**
  - [ ] Google Calendar event → TimeSlot object converteren
  - [ ] Event title → TimeSlot title
  - [ ] Event start/end → TimeSlot startTime/endTime
  - [ ] Event date → TimeSlot date
  - [ ] Event color → TimeSlot color
  - [ ] Event description → TimeSlot description
  - [ ] Event ID → TimeSlot googleCalendarEventId

- [ ] **syncService.ts: importFromGoogle functie**
  - [ ] Functie om import te triggeren
  - [ ] Calendar events importeren
  - [ ] Duplicate detection (check op googleCalendarEventId)
  - [ ] Alleen nieuwe events toevoegen (of update bestaande)

- [ ] **DataContext.tsx: import functies**
  - [ ] `importTimeSlotFromCalendar` functie toevoegen
  - [ ] Duplicate detection logica
  - [ ] Merge strategie (update bestaande of skip)

### 2.2 Google Tasks Import
- [ ] **googleSync.ts: importGoogleTasks functie**
  - [ ] Tasks ophalen van Google Tasks API
  - [ ] Task lists ophalen (meerdere lists ondersteunen)
  - [ ] Tasks mappen naar app Tasks
  - [ ] Task subtasks syncen (optioneel)
  - [ ] Task notes/descriptions syncen
  - [ ] Task due dates syncen
  - [ ] Task completion status syncen

- [ ] **googleSync.ts: mapGoogleTaskToAppTask functie**
  - [ ] Google Task → Task object converteren
  - [ ] Task title → Task title
  - [ ] Task due date → Task scheduledDate
  - [ ] Task notes → Task description
  - [ ] Task status → Task completed
  - [ ] Task ID → Task googleTaskId

- [ ] **syncService.ts: importFromGoogle uitbreiden**
  - [ ] Google Tasks importeren
  - [ ] Duplicate detection (check op googleTaskId)
  - [ ] Alleen nieuwe tasks toevoegen (of update bestaande)

- [ ] **DataContext.tsx: import functies**
  - [ ] `importTaskFromGoogleTasks` functie toevoegen
  - [ ] Duplicate detection logica
  - [ ] Merge strategie

### 2.3 Auto-import trigger
- [ ] **syncService.ts: startAutoImport functie**
  - [ ] Polling interval voor import (bijv. elke 30 minuten)
  - [ ] Check op nieuwe/gewijzigde items in Google
  - [ ] Alleen items importeren die nieuw zijn of gewijzigd sinds laatste sync

- [ ] **syncService.ts: detectChanges functie**
  - [ ] Compare Google items met app items
  - [ ] Detecteer nieuwe items
  - [ ] Detecteer gewijzigde items (via `updated` timestamp)
  - [ ] Detecteer verwijderde items (optioneel)

- [ ] **DataContext.tsx: auto-import setup**
  - [ ] useEffect hook om auto-import te starten
  - [ ] Alleen actief als Google verbonden is
  - [ ] Cleanup bij unmount

### 2.4 UI voor Import
- [ ] **SyncedAccounts.tsx: Import sectie**
  - [ ] "Import from Google Calendar" button
  - [ ] "Import from Google Tasks" button
  - [ ] Import status indicator
  - [ ] Import history (laatste import tijd)

---

## Fase 3: Conflict Resolution 🟡 PRIORITEIT 3

**Doel**: Omgaan met conflicterende wijzigingen tussen app en Google

### 3.1 Conflict Detection
- [ ] **syncService.ts: detectConflicts functie**
  - [ ] Compare `syncVersion` tussen app en Google
  - [ ] Compare `lastSyncedAt` timestamps
  - [ ] Detecteer items die in beide systemen zijn gewijzigd
  - [ ] Return conflict list met details

- [ ] **types.ts: Conflict interface**
  - [ ] `entityId: string`
  - [ ] `entityType: 'task' | 'timeSlot' | 'objective'`
  - [ ] `appValue: any` (huidige waarde in app)
  - [ ] `googleValue: any` (huidige waarde in Google)
  - [ ] `conflictFields: string[]` (welke velden conflicteren)
  - [ ] `appLastModified: string`
  - [ ] `googleLastModified: string`

### 3.2 Conflict Resolution Strategie
- [ ] **syncService.ts: resolveConflict functie**
  - [ ] Last-write-wins strategie (standaard)
  - [ ] Merge strategie (optioneel)
  - [ ] User choice strategie (optioneel - vereist UI)

- [ ] **syncService.ts: conflictResolutionStrategy config**
  - [ ] `'last-write-wins'` (standaard)
  - [ ] `'app-wins'` (app heeft altijd voorrang)
  - [ ] `'google-wins'` (Google heeft altijd voorrang)
  - [ ] `'manual'` (gebruiker kiest per conflict)

### 3.3 Conflict UI
- [ ] **components/ConflictResolver.tsx**
  - [ ] Component om conflicten te tonen
  - [ ] Side-by-side comparison
  - [ ] "Keep App Version" button
  - [ ] "Keep Google Version" button
  - [ ] "Merge" button (optioneel)
  - [ ] Conflict details weergeven

- [ ] **views/SyncedAccounts.tsx: Conflict sectie**
  - [ ] Lijst van conflicten tonen
  - [ ] Conflict count indicator
  - [ ] Link naar ConflictResolver component
  - [ ] Auto-resolve optie (gebruik strategie zonder user input)

### 3.4 Sync Status Indicators
- [ ] **types.ts: SyncStatus type**
  - [ ] `'synced'` - succesvol gesynchroniseerd
  - [ ] `'pending'` - wachtend op sync
  - [ ] `'syncing'` - momenteel aan het syncen
  - [ ] `'conflict'` - conflict gedetecteerd
  - [ ] `'error'` - sync error opgetreden

- [ ] **UI: Sync status badges**
  - [ ] Visual indicators in task/timeSlot/objective lists
  - [ ] Color coding (groen=synced, geel=pending, rood=conflict/error)
  - [ ] Tooltip met sync details

---

## Fase 4: Sync Settings UI 🟡 PRIORITEIT 4

**Doel**: Gebruiker kan sync gedrag configureren

### 4.1 Sync Config Interface
- [ ] **types.ts: SyncSettings interface**
  - [ ] `enabled: boolean`
  - [ ] `autoSyncOnChange: boolean`
  - [ ] `backgroundSyncInterval: number` (minuten)
  - [ ] `autoImportInterval: number` (minuten)
  - [ ] `syncTasks: boolean`
  - [ ] `syncTimeSlots: boolean`
  - [ ] `syncGoals: boolean`
  - [ ] `syncDirection: 'export' | 'import' | 'bidirectional'`
  - [ ] `conflictResolutionStrategy: 'last-write-wins' | 'app-wins' | 'google-wins' | 'manual'`

### 4.2 Calendar Sync Settings
- [ ] **types.ts: CalendarSyncSettings interface**
  - [ ] `enabled: boolean`
  - [ ] `calendarIds: string[]` (welke calendars syncen)
  - [ ] `syncDirection: 'export' | 'import' | 'bidirectional'`
  - [ ] `importFilters: { labels?: string[], colors?: string[] }`
  - [ ] `exportAsAllDay: boolean` (voor tasks zonder tijd)

- [ ] **googleSync.ts: getCalendarList functie**
  - [ ] Lijst van beschikbare calendars ophalen
  - [ ] Calendar names en IDs returnen

- [ ] **views/SyncedAccounts.tsx: Calendar Settings UI**
  - [ ] Calendar selector (multi-select)
  - [ ] Sync direction toggle
  - [ ] Import filters configuratie
  - [ ] Save settings button

### 4.3 Tasks Sync Settings
- [ ] **types.ts: TasksSyncSettings interface**
  - [ ] `enabled: boolean`
  - [ ] `taskListIds: string[]` (welke task lists syncen)
  - [ ] `syncDirection: 'export' | 'import' | 'bidirectional'`
  - [ ] `syncSubtasks: boolean`
  - [ ] `taskListMapping: { [lifeAreaId: string]: string }` (map life areas naar task lists)

- [ ] **googleSync.ts: getGoogleTaskLists functie uitbreiden**
  - [ ] Lijst van beschikbare task lists ophalen
  - [ ] Task list names en IDs returnen

- [ ] **views/SyncedAccounts.tsx: Tasks Settings UI**
  - [ ] Task list selector (multi-select)
  - [ ] Sync direction toggle
  - [ ] Subtasks sync toggle
  - [ ] Task list mapping configuratie
  - [ ] Save settings button

### 4.4 Global Sync Settings
- [ ] **views/SyncedAccounts.tsx: Global Settings sectie**
  - [ ] Auto-sync enabled/disabled toggle
  - [ ] Auto-sync on change toggle
  - [ ] Background sync interval slider/input
  - [ ] Auto-import interval slider/input
  - [ ] Conflict resolution strategy dropdown
  - [ ] Per-entity sync toggles (Tasks, Time Slots, Goals)

- [ ] **syncService.ts: loadSettings functie**
  - [ ] Settings laden uit localStorage
  - [ ] Default values toepassen als niet ingesteld

- [ ] **syncService.ts: saveSettings functie**
  - [ ] Settings opslaan naar localStorage
  - [ ] Settings toepassen op sync service

---

## Fase 5: Sync Dashboard 🟢 PRIORITEIT 5

**Doel**: Centraal overzicht van alle sync status

### 5.1 Sync Status Overview
- [ ] **components/SyncDashboard.tsx**
  - [ ] Overview card met totaal aantal gesynced items
  - [ ] Per-integratie status (Calendar, Tasks, Contacts)
  - [ ] Last sync timestamps
  - [ ] Sync statistics (items synced, conflicts, errors)
  - [ ] Quick sync buttons

- [ ] **syncService.ts: getSyncStatistics functie**
  - [ ] Totaal aantal gesynced items
  - [ ] Aantal pending items
  - [ ] Aantal conflicten
  - [ ] Aantal errors
  - [ ] Last sync timestamps per integratie

### 5.2 Sync History
- [ ] **types.ts: SyncHistoryEntry interface**
  - [ ] `id: string`
  - [ ] `timestamp: string`
  - [ ] `type: 'export' | 'import'`
  - [ ] `entityType: 'task' | 'timeSlot' | 'objective'`
  - [ ] `entityId: string`
  - [ ] `status: 'success' | 'error'`
  - [ ] `errorMessage?: string`
  - [ ] `itemsCount: number`

- [ ] **syncService.ts: syncHistory array**
  - [ ] Log elke sync actie
  - [ ] Max 100 entries (oudste verwijderen)
  - [ ] Persist naar localStorage

- [ ] **components/SyncHistory.tsx**
  - [ ] Lijst van sync history entries
  - [ ] Filter op type, status, date range
  - [ ] Error details tonen
  - [ ] Export naar CSV optie (optioneel)

### 5.3 Per-Integration Status
- [ ] **components/IntegrationStatus.tsx**
  - [ ] Status card per integratie (Calendar, Tasks, Contacts)
  - [ ] Connected/disconnected status
  - [ ] Last sync timestamp
  - [ ] Items synced count
  - [ ] Conflicts count
  - [ ] Errors count
  - [ ] Quick actions (sync now, disconnect)

- [ ] **views/SyncedAccounts.tsx: Dashboard sectie**
  - [ ] IntegrationStatus componenten
  - [ ] Sync statistics overview
  - [ ] Sync history link

### 5.4 Error Logging
- [ ] **syncService.ts: logError functie**
  - [ ] Log sync errors met details
  - [ ] Error timestamp
  - [ ] Error message
  - [ ] Entity details
  - [ ] Stack trace (development only)

- [ ] **components/ErrorLog.tsx**
  - [ ] Lijst van sync errors
  - [ ] Filter op severity, date range
  - [ ] Error details expandable
  - [ ] Retry failed syncs button

---

## Fase 6: Uitbreidingen & Verbeteringen 🟢 PRIORITEIT 6

### 6.1 Recurring Events/Tasks
- [ ] **googleSync.ts: handleRecurringEvents functie**
  - [ ] Recurring events detecteren
  - [ ] Recurring pattern parseren (RRULE)
  - [ ] Recurring events syncen als series

- [ ] **types.ts: RecurringPattern interface**
  - [ ] `frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'`
  - [ ] `interval: number` (elke X dagen/weken/etc)
  - [ ] `endDate?: string`
  - [ ] `count?: number`

- [ ] **TimeSlot interface uitbreiden**
  - [ ] `recurringPattern?: RecurringPattern`
  - [ ] `recurringEventId?: string`
  - [ ] `isRecurringInstance: boolean`

### 6.2 Event Attendees → Friends Linking
- [ ] **googleSync.ts: mapAttendeesToFriends functie**
  - [ ] Event attendees ophalen
  - [ ] Match attendees met Friends (op email)
  - [ ] Link event naar Friends

- [ ] **TimeSlot interface uitbreiden**
  - [ ] `attendeeIds: string[]` (Friend IDs)

### 6.3 Event Locations → Places Linking
- [ ] **googleSync.ts: mapLocationToPlace functie**
  - [ ] Event location ophalen
  - [ ] Match location met Places (op naam/adres)
  - [ ] Link event naar Place

- [ ] **TimeSlot interface uitbreiden**
  - [ ] `placeId?: string`

### 6.4 Task Lists Organisatie
- [ ] **googleSync.ts: organizeTaskLists functie**
  - [ ] App tasks groeperen per Life Area
  - [ ] Task lists maken in Google Tasks per Life Area
  - [ ] Tasks toewijzen aan juiste task list

- [ ] **syncService.ts: taskListMapping config**
  - [ ] Map Life Area ID → Google Task List ID
  - [ ] Auto-create task lists indien nodig

### 6.5 Subtasks Sync
- [ ] **types.ts: Task interface uitbreiden**
  - [ ] `parentTaskId?: string` (voor subtasks)
  - [ ] `subtaskIds: string[]` (lijst van subtask IDs)

- [ ] **googleSync.ts: syncSubtasks functie**
  - [ ] Subtasks ophalen van Google Tasks
  - [ ] Subtasks mappen naar app Tasks
  - [ ] Parent-child relaties behouden

---

## Fase 7: Asana Integratie 🔵 PRIORITEIT 7

### 7.1 OAuth Setup
- [ ] **utils/asanaAuth.ts**
  - [ ] Asana OAuth 2.0 flow
  - [ ] Access token opslaan
  - [ ] Token refresh handling

- [ ] **views/SyncedAccounts.tsx: Asana connectie**
  - [ ] "Connect Asana" button
  - [ ] OAuth flow UI
  - [ ] Connection status indicator

### 7.2 Asana API Integration
- [ ] **utils/asanaSync.ts**
  - [ ] `getAsanaWorkspaces` functie
  - [ ] `getAsanaProjects` functie
  - [ ] `getAsanaTasks` functie
  - [ ] `createAsanaTask` functie
  - [ ] `updateAsanaTask` functie
  - [ ] `createAsanaProject` functie

### 7.3 Import van Asana
- [ ] **asanaSync.ts: importAsanaTasks functie**
  - [ ] Tasks ophalen van Asana
  - [ ] Tasks mappen naar app Tasks
  - [ ] Task details syncen (assignee, due date, etc.)

- [ ] **asanaSync.ts: importAsanaProjects functie**
  - [ ] Projects ophalen van Asana
  - [ ] Projects mappen naar app Goals
  - [ ] Project members → Team Members

### 7.4 Export naar Asana
- [ ] **asanaSync.ts: exportTaskToAsana functie**
  - [ ] App Task → Asana Task converteren
  - [ ] Task details syncen
  - [ ] Task assignment (app owner → Asana assignee)

- [ ] **asanaSync.ts: exportGoalToAsana functie**
  - [ ] App Goal → Asana Project converteren
  - [ ] Key Results → Asana Tasks of Sections

### 7.5 Bi-directionele Sync met Asana
- [ ] **syncService.ts: Asana sync toevoegen**
  - [ ] Asana sync queue items
  - [ ] Auto-sync bij wijzigingen
  - [ ] Conflict resolution

---

## Fase 8: Fitbit Integratie 🔵 PRIORITEIT 8

**Doel**: Health & Fitness data integreren voor een compleet overzicht van je leven

### 8.1 OAuth Setup
- [ ] **utils/fitbitAuth.ts**
  - [ ] Fitbit OAuth 2.0 flow
  - [ ] Access token opslaan
  - [ ] Token refresh handling (Fitbit tokens vervallen na 8 uur)
  - [ ] Refresh token management

- [ ] **views/SyncedAccounts.tsx: Fitbit connectie**
  - [ ] "Connect Fitbit" button
  - [ ] OAuth flow UI
  - [ ] Connection status indicator
  - [ ] Scope permissions uitleg (activity, sleep, heart rate, etc.)

### 8.2 Fitbit API Integration
- [ ] **utils/fitbitSync.ts**
  - [ ] `getFitbitProfile` functie (user info)
  - [ ] `getFitbitActivity` functie (daily activity data)
  - [ ] `getFitbitSleep` functie (sleep data)
  - [ ] `getFitbitHeartRate` functie (heart rate data)
  - [ ] `getFitbitWeight` functie (weight/body metrics)
  - [ ] `getFitbitWorkouts` functie (exercise/workout data)
  - [ ] `getFitbitGoals` functie (daily/weekly goals)

### 8.3 Data Types & Interfaces
- [ ] **types.ts: FitbitData interfaces**
  - [ ] `FitbitActivity` interface
    - [ ] `date: string`
    - [ ] `steps: number`
    - [ ] `calories: number`
    - [ ] `distance: number` (km)
    - [ ] `floors: number`
    - [ ] `activeMinutes: number`
    - [ ] `sedentaryMinutes: number`
  
  - [ ] `FitbitSleep` interface
    - [ ] `date: string`
    - [ ] `duration: number` (minuten)
    - [ ] `efficiency: number` (percentage)
    - [ ] `minutesAsleep: number`
    - [ ] `minutesAwake: number`
    - [ ] `minutesToFallAsleep: number`
    - [ ] `sleepStages: { deep: number, light: number, rem: number, wake: number }`
  
  - [ ] `FitbitHeartRate` interface
    - [ ] `date: string`
    - [ ] `restingHeartRate: number`
    - [ ] `heartRateZones: { fatBurn: number, cardio: number, peak: number }`
  
  - [ ] `FitbitWeight` interface
    - [ ] `date: string`
    - [ ] `weight: number` (kg)
    - [ ] `bmi: number`
    - [ ] `fat: number` (percentage, optioneel)
  
  - [ ] `FitbitWorkout` interface
    - [ ] `id: string`
    - [ ] `date: string`
    - [ ] `activityType: string`
    - [ ] `duration: number` (minuten)
    - [ ] `calories: number`
    - [ ] `distance: number` (km)
    - [ ] `averageHeartRate?: number`

### 8.4 Data Import & Sync
- [ ] **fitbitSync.ts: importFitbitData functie**
  - [ ] Import activity data voor date range
  - [ ] Import sleep data voor date range
  - [ ] Import heart rate data voor date range
  - [ ] Import weight data voor date range
  - [ ] Import workouts voor date range
  - [ ] Data opslaan in localStorage of aparte storage

- [ ] **fitbitSync.ts: syncFitbitData functie**
  - [ ] Auto-sync dagelijks (bijv. elke ochtend)
  - [ ] Sync laatste 7 dagen data
  - [ ] Update bestaande data (niet dupliceren)
  - [ ] Error handling voor API rate limits

### 8.5 Data Visualisatie & Integratie
- [ ] **components/FitbitDashboard.tsx**
  - [ ] Overview card met vandaag's stats (stappen, calorieën, slaap)
  - [ ] Activity chart (stappen over tijd)
  - [ ] Sleep chart (slaapduur en kwaliteit)
  - [ ] Heart rate trends
  - [ ] Weight trends
  - [ ] Workout history

- [ ] **views/Dashboard.tsx: Fitbit sectie**
  - [ ] Fitbit data widget toevoegen
  - [ ] Quick stats (vandaag's stappen, gisteren's slaap)
  - [ ] Link naar volledige Fitbit dashboard

- [ ] **views/Health.tsx (nieuwe view)**
  - [ ] Complete health & fitness overview
  - [ ] Activity trends
  - [ ] Sleep analysis
  - [ ] Heart rate analysis
  - [ ] Weight/Body metrics
  - [ ] Workout history
  - [ ] Goals progress (Fitbit goals vs app Goals)

### 8.6 Koppeling met App Features
- [ ] **Habits → Fitbit Activity**
  - [ ] Habit "Walk 10,000 steps" → link naar Fitbit stappen
  - [ ] Auto-complete habit als Fitbit doel behaald
  - [ ] Progress tracking via Fitbit data

- [ ] **Key Results → Fitbit Metrics**
  - [ ] Key Result "Lose 5kg" → link naar Fitbit weight data
  - [ ] Key Result "Run 500km" → link naar Fitbit workout distance
  - [ ] Auto-update Key Result progress via Fitbit data

- [ ] **Life Area "Sport & Health" → Fitbit Data**
  - [ ] Fitbit activity data tonen in Life Area overview
  - [ ] Health trends in Lifescan berekening
  - [ ] Fitness goals gekoppeld aan Fitbit goals

- [ ] **Time Slots → Fitbit Workouts**
  - [ ] Workout Time Slots → link naar Fitbit workouts
  - [ ] Auto-detect workout Time Slots en sync naar Fitbit
  - [ ] Workout details (calorieën, hartslag) tonen in Time Slot

### 8.7 Goals & Insights
- [ ] **fitbitSync.ts: calculateInsights functie**
  - [ ] Activity trends analyseren
  - [ ] Sleep quality trends
  - [ ] Correlatie tussen activiteit en slaap
  - [ ] Weekly/monthly summaries

- [ ] **components/FitbitInsights.tsx**
  - [ ] Insights cards (bijv. "Je slaapt beter na dagen met >10k stappen")
  - [ ] Recommendations (bijv. "Probeer 30 minuten eerder naar bed")
  - [ ] Goal suggestions gebaseerd op data

- [ ] **Fitbit Goals → App Goals**
  - [ ] Fitbit daily/weekly goals importeren
  - [ ] Optioneel: sync Fitbit goals naar app Goals
  - [ ] Progress tracking voor beide systemen

### 8.8 Auto-Sync & Background Updates
- [ ] **syncService.ts: Fitbit sync toevoegen**
  - [ ] Fitbit sync queue items
  - [ ] Dagelijkse auto-sync (bijv. 06:00)
  - [ ] Background sync voor real-time updates (optioneel)
  - [ ] Error handling voor API rate limits

- [ ] **fitbitSync.ts: backgroundSync functie**
  - [ ] Check voor nieuwe data sinds laatste sync
  - [ ] Incremental updates (alleen nieuwe data)
  - [ ] Retry logic voor failed syncs

### 8.9 Settings & Configuration
- [ ] **types.ts: FitbitSyncSettings interface**
  - [ ] `enabled: boolean`
  - [ ] `autoSyncEnabled: boolean`
  - [ ] `syncInterval: 'daily' | 'hourly' | 'manual'`
  - [ ] `syncActivity: boolean`
  - [ ] `syncSleep: boolean`
  - [ ] `syncHeartRate: boolean`
  - [ ] `syncWeight: boolean`
  - [ ] `syncWorkouts: boolean`
  - [ ] `dateRange: number` (dagen terug om te syncen)

- [ ] **views/SyncedAccounts.tsx: Fitbit Settings**
  - [ ] Sync toggles per data type
  - [ ] Sync interval selector
  - [ ] Date range selector
  - [ ] Last sync timestamp
  - [ ] Manual sync button

### 8.10 Data Privacy & Permissions
- [ ] **fitbitAuth.ts: Scope management**
  - [ ] Request minimale scopes nodig
  - [ ] Scope permissions uitleggen aan gebruiker
  - [ ] Optioneel: granular permissions (alleen activity, alleen sleep, etc.)

- [ ] **Data storage**
  - [ ] Fitbit data lokaal opslaan (niet naar server)
  - [ ] Data encryption optie
  - [ ] Data retention policy (bijv. 90 dagen)
  - [ ] Clear data optie

---

## Fase 9: Unified Life Overview 🔵 PRIORITEIT 9

**Doel**: Alle data samenbrengen in één overzicht van je leven

### 9.1 Life Overview Dashboard
- [ ] **views/LifeOverview.tsx (nieuwe view)**
  - [ ] Complete overview van alle life areas
  - [ ] Health & Fitness (Fitbit data)
  - [ ] Work & Career (Goals, Tasks)
  - [ ] Relationships (Friends, Contacts)
  - [ ] Time Management (Calendar, Time Slots)
  - [ ] Personal Growth (Habits, Key Results)

### 9.2 Cross-Data Insights
- [ ] **components/LifeInsights.tsx**
  - [ ] Correlaties tussen verschillende data bronnen
  - [ ] Bijv. "Je presteert beter op werk na goede nachtrust"
  - [ ] Bijv. "Je bent actiever op dagen met minder meetings"
  - [ ] Bijv. "Je slaapt beter na dagen met sport"

### 9.3 Unified Timeline
- [ ] **components/LifeTimeline.tsx**
  - [ ] Timeline view met alle events
  - [ ] Calendar events
  - [ ] Tasks completed
  - [ ] Workouts
  - [ ] Goal milestones
  - [ ] Habit completions
  - [ ] Sleep patterns

### 9.4 Health Score
- [ ] **components/HealthScore.tsx**
  - [ ] Overall health score berekenen
  - [ ] Gebaseerd op: activity, sleep, heart rate, weight trends
  - [ ] Visual indicator (1-10 score)
  - [ ] Trends over tijd

### 9.5 Productivity Score
- [ ] **components/ProductivityScore.tsx**
  - [ ] Overall productivity score berekenen
  - [ ] Gebaseerd op: tasks completed, goals progress, time management
  - [ ] Correlatie met health score
  - [ ] Insights en recommendations

### 9.6 Life Balance Score
- [ ] **components/LifeBalanceScore.tsx**
  - [ ] Balance tussen verschillende life areas
  - [ ] Work vs Personal time
  - [ ] Activity vs Rest
  - [ ] Social vs Alone time
  - [ ] Visual balance wheel

### 9.7 Weekly/Monthly Reports
- [ ] **components/LifeReport.tsx**
  - [ ] Weekly summary genereren
  - [ ] Monthly summary genereren
  - [ ] Highlights (beste prestaties)
  - [ ] Areas for improvement
  - [ ] Goals progress overview
  - [ ] Health trends
  - [ ] Productivity trends

### 9.8 Data Export
- [ ] **utils/exportLifeData.ts**
  - [ ] Export alle data naar CSV/JSON
  - [ ] Per data type (Fitbit, Calendar, Tasks, etc.)
  - [ ] Combined export
  - [ ] Date range selector

---

## Testing & Quality Assurance

### Unit Tests
- [ ] **tests/syncService.test.ts**
  - [ ] Queue management tests
  - [ ] Sync item processing tests
  - [ ] Conflict detection tests
  - [ ] Retry logic tests

- [ ] **tests/googleSync.test.ts**
  - [ ] Export functies tests
  - [ ] Import functies tests
  - [ ] Mapping functies tests

### Integration Tests
- [ ] **tests/syncIntegration.test.ts**
  - [ ] End-to-end sync flow tests
  - [ ] Bi-directionele sync tests
  - [ ] Conflict resolution tests

### Manual Testing Checklist
- [ ] Test automatische export bij task create/update
- [ ] Test automatische export bij timeSlot create/update
- [ ] Test automatische export bij goal create/update
- [ ] Test background sync interval
- [ ] Test handmatige sync trigger
- [ ] Test import van Google Calendar events
- [ ] Test import van Google Tasks
- [ ] Test conflict detection
- [ ] Test conflict resolution
- [ ] Test sync settings wijzigingen
- [ ] Test error handling (offline, API errors)

---

## Documentatie

- [ ] **README_SYNC.md**
  - [ ] Overzicht van sync functionaliteit
  - [ ] Hoe sync werkt
  - [ ] Sync settings uitleg
  - [ ] Troubleshooting guide

- [ ] **Code comments**
  - [ ] Alle sync functies documenteren
  - [ ] Complexe logica uitleggen
  - [ ] API response formats documenteren

---

## Volgorde van Implementatie

### Sprint 1: Foundation (Fase 1)
1. Sync metadata tracking
2. Externe IDs bijhouden
3. Sync service uitbreiden

### Sprint 2: Import (Fase 2)
1. Google Calendar import
2. Google Tasks import
3. Auto-import trigger
4. Import UI

### Sprint 3: Conflicts (Fase 3)
1. Conflict detection
2. Conflict resolution strategie
3. Conflict UI

### Sprint 4: Settings (Fase 4)
1. Sync config interface
2. Calendar sync settings
3. Tasks sync settings
4. Global sync settings

### Sprint 5: Dashboard (Fase 5)
1. Sync status overview
2. Sync history
3. Per-integration status
4. Error logging

### Sprint 6: Uitbreidingen (Fase 6)
1. Recurring events
2. Attendees/Friends linking
3. Locations/Places linking
4. Task lists organisatie
5. Subtasks sync

### Sprint 7: Asana (Fase 7)
1. OAuth setup
2. API integration
3. Import/Export
4. Bi-directionele sync

### Sprint 8: Fitbit (Fase 8)
1. OAuth setup
2. API integration
3. Data import (activity, sleep, heart rate, weight, workouts)
4. Data visualisatie
5. Koppeling met app features (Habits, Key Results, Life Areas)
6. Auto-sync & background updates
7. Settings & configuration

### Sprint 9: Unified Overview (Fase 9)
1. Life Overview Dashboard
2. Cross-data insights
3. Unified Timeline
4. Health/Productivity/Balance scores
5. Weekly/Monthly reports
6. Data export

---

## Notities

- **Performance**: Houd rekening met rate limiting van Google APIs en Fitbit API
- **Error Handling**: Graceful degradation bij API failures
- **User Experience**: Duidelijke feedback bij sync acties
- **Data Privacy**: Zorg dat sync data veilig wordt opgeslagen
- **Testing**: Test met echte Google accounts, Fitbit accounts en data
- **Fitbit API**: 
  - Tokens vervallen na 8 uur, refresh token nodig
  - Rate limits: 150 requests per hour per user
  - Data is meestal beschikbaar met 1 dag vertraging
  - Real-time data vereist premium subscription
- **Data Retention**: Overweeg data retention policy voor Fitbit data (veel data over tijd)

