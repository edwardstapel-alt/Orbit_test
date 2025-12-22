# Integratie Plan - Volledige Koppeling tussen Onderdelen

## Huidige Situatie

### Bestaande Integraties
- ✅ Google OAuth 2.0 setup
- ✅ Google People API - Profiel data (naam, foto, email, geboortedatum)
- ✅ Google Calendar API - Read-only (events ophalen)
- ✅ Google Tasks API - Read-only (tasks ophalen)
- ⚠️ **Geen bi-directionele sync** - alleen import, geen export
- ⚠️ **Geen real-time sync** - alleen handmatige import
- ⚠️ **Geen Asana integratie**

### Huidige Data Model Koppelingen
- Tasks hebben: `calendarEventId`, `friendId`, `objectiveId`, `keyResultId`, `lifeAreaId`
- Objectives hebben: `lifeAreaId`, `visionId`
- Habits hebben: `objectiveId`, `lifeAreaId`, `linkedKeyResultId`
- Time Slots hebben: `objectiveId`, `lifeAreaId`

## Integratie Plan

### Fase 1: Interne App Integratie (App → App)
**Doel**: Alle onderdelen van de app naadloos met elkaar verbinden

#### 1.1 Cross-Entity Linking & Navigation
- [ ] **Bidirectional Links**
  - Van Life Area → zie alle gekoppelde Goals, Tasks, Habits, Time Slots
  - Van Goal → zie alle gekoppelde Life Area, Key Results, Tasks, Habits, Time Slots
  - Van Task → zie gekoppelde Goal, Life Area, Time Slot, Friend
  - Van Habit → zie gekoppelde Goal, Key Result, Life Area
  - Van Time Slot → zie gekoppelde Goal, Life Area, Tasks

- [ ] **Quick Link Actions**
  - "Link to..." buttons in editors
  - Multi-select voor bulk linking
  - Unlink functionaliteit
  - Link suggestions (bijv. "Link deze task aan een goal?")

- [ ] **Contextual Views**
  - "Related Items" sectie in detail views
  - Filter views op linked entities
  - "Show all tasks for this goal" shortcuts

#### 1.2 Data Consistency & Auto-Updates
- [ ] **Cascade Updates**
  - Als Goal wordt verwijderd → unlink alle gekoppelde items
  - Als Life Area wordt verwijderd → opties: verplaats items of verwijder
  - Als Key Result wordt verwijderd → update habit links
  - Als Time Slot wordt verwijderd → unlink tasks

- [ ] **Auto-Linking Rules**
  - Nieuwe task in Life Area → auto-suggest link naar Goal in die Life Area
  - Habit gekoppeld aan Goal → auto-suggest link naar Key Result
  - Task met scheduledDate → auto-suggest link naar Time Slot op die dag

- [ ] **Progress Auto-Calculation**
  - Goal progress → berekend van Key Results (✅ al geïmplementeerd)
  - Key Result progress → kan worden bijgewerkt door Habits (✅ al geïmplementeerd)
  - Life Area "Lifescan" → berekend van Goals (✅ al geïmplementeerd)

#### 1.3 Unified Search & Filtering
- [ ] **Global Search**
  - Zoek in alle entities (Goals, Tasks, Habits, Life Areas, etc.)
  - Filter op type, status, date range, owner
  - Quick filters: "My tasks", "Overdue", "This week", etc.

- [ ] **Smart Filters**
  - Filter tasks by linked Goal
  - Filter habits by linked Life Area
  - Filter time slots by linked Goal
  - Cross-entity filters (bijv. "All items for Goal X")

### Fase 2: Google Calendar Integratie (Bi-directioneel)
**Doel**: Volledige sync tussen app en Google Calendar

#### 2.1 Calendar → App (Import)
- [x] **Bestaand**: Events ophalen (read-only)
- [ ] **Uitbreiden**:
  - Auto-import nieuwe events (polling of webhook)
  - Event details: title, description, attendees, location
  - Recurring events detecteren en behandelen
  - Event colors/categories mappen naar Time Slots
  - Event reminders syncen

#### 2.2 App → Calendar (Export)
- [ ] **Time Slots → Calendar Events**
  - Time Slots automatisch als events naar Google Calendar
  - Recurring Time Slots → recurring events
  - Event colors gebaseerd op Time Slot type/color
  - Event descriptions met links naar Goals/Life Areas

- [ ] **Tasks → Calendar Events** (optioneel)
  - Tasks met scheduledDate/time → calendar events
  - All-day tasks → all-day events
  - Task completion status → event status

- [ ] **Goals Deadlines → Calendar**
  - Goal endDate → calendar event (deadline reminder)
  - Key Result deadlines → calendar events
  - Milestone events voor belangrijke datums

#### 2.3 Bi-directionele Sync
- [ ] **Conflict Resolution**
  - Wat gebeurt er als event in Calendar wordt gewijzigd?
  - Wat gebeurt er als Time Slot in app wordt gewijzigd?
  - Last-write-wins of merge strategy
  - Sync status indicator (synced, pending, conflict)

- [ ] **Sync Settings**
  - Welke calendars syncen? (selecteer specifieke calendars)
  - Sync direction (import only, export only, bidirectional)
  - Auto-sync interval (realtime, hourly, daily)
  - Sync filters (bijv. alleen events met bepaalde labels)

#### 2.4 Calendar Event Mapping
- [ ] **Event → Time Slot Mapping**
  - Automatisch Time Slots maken van Calendar events
  - Event type detectie (meeting, deep work, etc.)
  - Event attendees → link naar Friends
  - Event location → link naar Places

- [ ] **Event → Task Mapping**
  - Calendar events met "task" label → Tasks
  - Event reminders → Task reminders
  - Event completion → Task completion

### Fase 3: Google Tasks Integratie (Bi-directioneel)
**Doel**: Volledige sync tussen app Tasks en Google Tasks

#### 3.1 Google Tasks → App (Import)
- [x] **Bestaand**: Tasks ophalen (read-only)
- [ ] **Uitbreiden**:
  - Auto-import nieuwe tasks
  - Task lists syncen (meerdere task lists)
  - Task subtasks syncen
  - Task notes/descriptions
  - Task due dates en reminders
  - Task completion status

#### 3.2 App → Google Tasks (Export)
- [ ] **Tasks → Google Tasks**
  - App tasks automatisch naar Google Tasks
  - Task priority mapping
  - Task due dates syncen
  - Task completion status syncen
  - Task notes/descriptions syncen

- [ ] **Task Lists Organisatie**
  - App tasks groeperen in Google Task lists
  - Bijv. "Life Planner - Goals", "Life Planner - Personal", etc.
  - Of per Life Area: "Health Tasks", "Career Tasks", etc.

#### 3.3 Bi-directionele Sync
- [ ] **Conflict Resolution**
  - Last-write-wins of merge strategy
  - Sync status per task
  - Manual sync trigger

- [ ] **Sync Settings**
  - Welke task lists syncen?
  - Sync direction
  - Auto-sync interval
  - Task mapping rules (bijv. alleen tasks met bepaalde tags)

### Fase 4: Google People/Contacts Integratie
**Doel**: Sync met Google Contacts en gebruik in app

#### 4.1 Google Contacts → App (Import)
- [x] **Bestaand**: Basis contact info (naam, foto)
- [ ] **Uitbreiden**:
  - Volledige contact lijst importeren
  - Contact groups syncen
  - Contact details: email, phone, address, notes
  - Contact photos syncen
  - Auto-update bij wijzigingen in Google Contacts

#### 4.2 App → Google Contacts (Export)
- [ ] **Friends → Google Contacts**
  - App Friends automatisch naar Google Contacts
  - Friend details syncen
  - Friend photos syncen
  - Friend relationships/roles als contact groups

#### 4.3 Bi-directionele Sync
- [ ] **Contact Matching**
  - Match app Friends met Google Contacts
  - Duplicate detection en merge
  - Contact update sync

- [ ] **Contact Usage in App**
  - Link tasks aan contacts (✅ al geïmplementeerd)
  - Link calendar events aan contacts (via attendees)
  - Contact info in Friend Detail view
  - Quick contact actions (call, email, message)

### Fase 5: Asana Integratie (Nieuw)
**Doel**: Sync met Asana voor project/task management

#### 5.1 Asana Setup
- [ ] **OAuth 2.0 Setup**
  - Asana API credentials
  - OAuth flow implementeren
  - Token management

- [ ] **Workspace/Project Selection**
  - Selecteer welke Asana workspaces syncen
  - Selecteer welke projects syncen
  - Project mapping naar Life Areas of Goals

#### 5.2 Asana → App (Import)
- [ ] **Tasks Import**
  - Asana tasks → App tasks
  - Task details: title, description, due date, assignee
  - Task subtasks → nested tasks of separate tasks
  - Task tags → app categories/tags
  - Task completion status

- [ ] **Projects Import**
  - Asana projects → App Goals (of Life Areas)
  - Project milestones → Goal milestones
  - Project members → Team Members

- [ ] **Sections/Columns**
  - Asana sections → app statuses of categories

#### 5.3 App → Asana (Export)
- [ ] **Tasks Export**
  - App tasks → Asana tasks
  - Task details syncen
  - Task assignment (app owner → Asana assignee)
  - Task due dates syncen

- [ ] **Goals Export**
  - App Goals → Asana projects
  - Key Results → Asana tasks of sections
  - Goal progress → project status

#### 5.4 Bi-directionele Sync
- [ ] **Conflict Resolution**
  - Last-write-wins of merge strategy
  - Sync status indicators
  - Manual sync trigger

- [ ] **Sync Settings**
  - Workspace/project selection
  - Sync direction
  - Auto-sync interval
  - Field mapping (Asana fields ↔ App fields)

### Fase 6: Unified Sync Dashboard
**Doel**: Centraal overzicht en beheer van alle integraties

#### 6.1 Sync Status Dashboard
- [ ] **Overview**
  - Status van alle integraties (connected, syncing, error)
  - Last sync timestamps
  - Sync statistics (items synced, conflicts, errors)
  - Quick sync buttons

- [ ] **Sync History**
  - Log van alle sync acties
  - Error logs en troubleshooting
  - Sync performance metrics

#### 6.2 Sync Configuration
- [ ] **Per-Integration Settings**
  - Google Calendar: welke calendars, sync direction, filters
  - Google Tasks: welke task lists, sync direction
  - Google Contacts: sync direction, auto-update
  - Asana: workspace/project selection, sync direction

- [ ] **Global Sync Settings**
  - Auto-sync enabled/disabled
  - Sync frequency (realtime, hourly, daily, manual)
  - Conflict resolution strategy
  - Sync notifications

#### 6.3 Conflict Resolution UI
- [ ] **Conflict Detection**
  - Detecteer conflicten tussen app en externe services
  - Visual conflict indicators
  - Conflict details (wat is verschillend)

- [ ] **Conflict Resolution**
  - Side-by-side comparison
  - Choose which version to keep
  - Merge options (indien mogelijk)
  - Bulk conflict resolution

### Fase 7: Smart Integrations & Automation
**Doel**: Intelligente automatische koppelingen

#### 7.1 Auto-Mapping Rules
- [ ] **Calendar Events → Time Slots**
  - Automatisch Time Slots maken van bepaalde event types
  - Event title patterns → Time Slot types
  - Event attendees → link naar Friends

- [ ] **Google Tasks → App Tasks**
  - Automatisch app tasks maken van Google Tasks
  - Task list mapping → Life Areas
  - Task tags → app categories

- [ ] **Asana Tasks → App Tasks**
  - Automatisch app tasks maken van Asana tasks
  - Project mapping → Goals
  - Section mapping → statuses

#### 7.2 Smart Suggestions
- [ ] **Link Suggestions**
  - "This task might belong to Goal X" (op basis van keywords)
  - "This habit might link to Key Result Y" (op basis van naam)
  - "This time slot might be for Goal Z" (op basis van tijd/type)

- [ ] **Duplicate Detection**
  - Detecteer duplicate tasks tussen app en externe services
  - Suggest merge of link
  - Prevent duplicate creation

#### 7.3 Automation Rules
- [ ] **IF-THEN Rules**
  - "If Google Calendar event has 'Deep Work' in title → create Time Slot"
  - "If Asana task is completed → mark app task as completed"
  - "If Goal deadline is approaching → create reminder in Google Calendar"
  - "If Habit streak reaches 30 days → celebrate in Google Calendar"

## Technische Implementatie Details

### Data Model Uitbreidingen

```typescript
// Sync Metadata
interface SyncMetadata {
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

// Extended Task
interface Task {
  // ... existing fields
  syncMetadata?: SyncMetadata;
  googleTaskId?: string;
  asanaTaskId?: string;
  calendarEventId?: string; // ✅ already exists
}

// Extended TimeSlot
interface TimeSlot {
  // ... existing fields
  syncMetadata?: SyncMetadata;
  googleCalendarEventId?: string;
  recurringEventId?: string; // For recurring events
}

// Extended Friend
interface Friend {
  // ... existing fields
  syncMetadata?: SyncMetadata;
  googleContactId?: string;
}

// New: Sync Configuration
interface SyncConfig {
  id: string;
  service: 'google_calendar' | 'google_tasks' | 'google_contacts' | 'asana';
  enabled: boolean;
  direction: 'import' | 'export' | 'bidirectional';
  autoSync: boolean;
  syncInterval?: number; // minutes
  filters?: {
    calendars?: string[]; // For Google Calendar
    taskLists?: string[]; // For Google Tasks
    projects?: string[]; // For Asana
  };
  fieldMappings?: {
    [appField: string]: string; // Maps app field to external field
  };
  conflictResolution: 'app_wins' | 'external_wins' | 'last_write_wins' | 'manual';
}
```

### API Integrations

#### Google Calendar API
- **Scopes nodig**:
  - `https://www.googleapis.com/auth/calendar` (read/write)
  - `https://www.googleapis.com/auth/calendar.events` (events)
- **Endpoints**:
  - `GET /calendars` - List calendars
  - `GET /calendars/{id}/events` - List events
  - `POST /calendars/{id}/events` - Create event
  - `PUT /calendars/{id}/events/{id}` - Update event
  - `DELETE /calendars/{id}/events/{id}` - Delete event

#### Google Tasks API
- **Scopes nodig**:
  - `https://www.googleapis.com/auth/tasks` (read/write)
- **Endpoints**:
  - `GET /tasks` - List task lists
  - `GET /tasks/{listId}/tasks` - List tasks
  - `POST /tasks/{listId}/tasks` - Create task
  - `PUT /tasks/{listId}/tasks/{id}` - Update task
  - `DELETE /tasks/{listId}/tasks/{id}` - Delete task

#### Google People API
- **Scopes nodig**:
  - `https://www.googleapis.com/auth/contacts` (read/write)
  - `https://www.googleapis.com/auth/contacts.readonly` (read-only)
- **Endpoints**:
  - `GET /people/me/connections` - List contacts
  - `POST /people:createContact` - Create contact
  - `PATCH /people/{id}` - Update contact
  - `DELETE /people/{id}` - Delete contact

#### Asana API
- **OAuth 2.0 Setup**:
  - Register app in Asana Developer Portal
  - Get Client ID and Client Secret
- **Scopes nodig**:
  - `default` (read/write access)
- **Endpoints**:
  - `GET /workspaces` - List workspaces
  - `GET /projects` - List projects
  - `GET /tasks` - List tasks
  - `POST /tasks` - Create task
  - `PUT /tasks/{id}` - Update task
  - `DELETE /tasks/{id}` - Delete task

### Sync Service Architecture

```typescript
// Sync Service Interface
interface SyncService {
  // Authentication
  authenticate(): Promise<void>;
  isAuthenticated(): boolean;
  disconnect(): Promise<void>;

  // Sync Operations
  import(): Promise<SyncResult>;
  export(items: any[]): Promise<SyncResult>;
  sync(): Promise<SyncResult>; // Bi-directional

  // Conflict Resolution
  detectConflicts(): Promise<Conflict[]>;
  resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void>;

  // Configuration
  getConfig(): SyncConfig;
  updateConfig(config: Partial<SyncConfig>): Promise<void>;
}

// Sync Result
interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsDeleted: number;
  conflicts: Conflict[];
  errors: SyncError[];
  timestamp: string;
}

// Conflict
interface Conflict {
  id: string;
  entityType: 'task' | 'timeSlot' | 'friend' | 'goal';
  entityId: string;
  appValue: any;
  externalValue: any;
  differences: FieldDifference[];
  service: 'google_calendar' | 'google_tasks' | 'google_contacts' | 'asana';
}

// Field Difference
interface FieldDifference {
  field: string;
  appValue: any;
  externalValue: any;
}
```

## Implementatie Volgorde

### Prioriteit 1: Interne App Integratie
1. Cross-entity linking UI
2. Bidirectional links
3. Auto-linking rules
4. Unified search

### Prioriteit 2: Google Calendar Bi-directioneel
1. Export Time Slots → Calendar Events
2. Bi-directionele sync
3. Conflict resolution
4. Sync settings

### Prioriteit 3: Google Tasks Bi-directioneel
1. Export Tasks → Google Tasks
2. Bi-directionele sync
3. Task lists organisatie
4. Conflict resolution

### Prioriteit 4: Google Contacts Bi-directioneel
1. Volledige contact import
2. Export Friends → Contacts
3. Contact matching
4. Auto-update

### Prioriteit 5: Asana Integratie
1. OAuth setup
2. Import Tasks/Projects
3. Export Tasks/Goals
4. Bi-directionele sync

### Prioriteit 6: Sync Dashboard
1. Status overview
2. Sync configuration UI
3. Conflict resolution UI
4. Sync history

### Prioriteit 7: Smart Features
1. Auto-mapping rules
2. Smart suggestions
3. Automation rules

## Security & Privacy Considerations

- [ ] **Token Management**
  - Secure token storage (encrypted)
  - Token refresh handling
  - Token expiration handling
  - Revoke access functionality

- [ ] **Data Privacy**
  - User consent voor data sharing
  - Data encryption in transit
  - Data encryption at rest
  - GDPR compliance

- [ ] **Error Handling**
  - Graceful degradation bij API failures
  - Retry logic met exponential backoff
  - Error logging en reporting
  - User notifications bij sync errors

## Testing Strategy

- [ ] **Unit Tests**
  - Sync service logic
  - Conflict detection
  - Data mapping functions

- [ ] **Integration Tests**
  - API connectivity
  - Sync operations
  - Conflict resolution

- [ ] **E2E Tests**
  - Complete sync flows
  - Multi-service sync
  - Error scenarios

