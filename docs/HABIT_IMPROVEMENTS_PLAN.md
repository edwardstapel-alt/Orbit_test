# Habit Tracking Verbeteringen - Implementatie Plan

## Huidige Situatie
- Habits hebben: name, icon, streak, completed, time, weeklyProgress (7 dagen)
- Koppeling met Key Results (progress contribution)
- Koppeling met Objectives en Life Areas
- Weergave in Today view, Tasks view, Dashboard, Objective Detail
- Basis streak tracking

## Verbeteringen Plan

### Fase 1: Habit Detail View & Analytics
**Doel**: Meer inzicht in habit performance

1. **Habit Detail View**
   - Navigatie naar detail view vanuit habit cards
   - Statistieken sectie:
     - Current streak
     - Longest streak (all-time)
     - Completion rate (laatste 30 dagen)
     - Best day of week (meest consistent)
     - Total completions (all-time)
   - Visualisatie:
     - 30-dagen kalender view (zoals GitHub contributions)
     - Week overzicht met completion percentage
     - Streak timeline (wanneer streaks zijn gebroken)
   - Recent history (laatste 7-14 dagen)

2. **Habit Editor Verbeteringen**
   - Target frequency (bijv. "5x per week", "elke dag")
   - Reminder tijd (optioneel)
   - Notes/reflections veld
   - Color coding per habit
   - Habit categorieën/tags

### Fase 2: Extended History & Tracking
**Doel**: Langere geschiedenis bijhouden

1. **Extended History**
   - Uitbreiden van weeklyProgress (7 dagen) naar monthlyHistory
   - Bijhouden van alle completions met timestamps
   - Maand/jaar overzicht
   - Export mogelijkheid

2. **Better Streak Calculation**
   - Accurate streak tracking (niet alleen laatste 7 dagen)
   - Streak milestones (7, 30, 100 dagen badges)
   - Streak recovery (na missen, wanneer opnieuw starten)

### Fase 3: Habit Insights & Recommendations
**Doel**: Slimme inzichten en suggesties

1. **Analytics Dashboard**
   - Completion trends (stijgend/dalend)
   - Correlation analysis (welke habits worden samen gedaan)
   - Time of day patterns
   - Weekday vs weekend patterns

2. **Smart Features**
   - Auto-suggesties voor beste tijd voor habit
   - Warnings bij dalende trends
   - Celebration bij milestones
   - Habit chains (als je X doet, doe dan Y)

### Fase 4: Habit Templates & Social
**Doel**: Makkelijker starten en delen

1. **Habit Templates**
   - Pre-made habit templates (bijv. "Morning Routine", "Fitness", "Learning")
   - Quick add vanuit templates
   - Custom templates maken

2. **Habit Sharing** (optioneel)
   - Export habit configuratie
   - Import van anderen
   - Community templates

## Prioriteit Implementatie

### Hoge Prioriteit (Fase 1)
1. ✅ Habit Detail View met basis statistieken
2. ✅ 30-dagen kalender visualisatie
3. ✅ Streak milestones en longest streak tracking
4. ✅ Completion rate berekening

### Medium Prioriteit (Fase 2)
1. Extended history (maand/jaar)
2. Better streak calculation
3. Habit editor verbeteringen (target frequency, reminders)

### Lage Prioriteit (Fase 3 & 4)
1. Analytics dashboard
2. Smart recommendations
3. Templates

## Technische Overwegingen

### Data Model Uitbreidingen
```typescript
interface Habit {
  // ... existing fields
  targetFrequency?: number; // e.g., 5 (times per week)
  reminderTime?: string; // e.g., "08:00"
  color?: string; // Custom color
  category?: string; // e.g., "Health", "Productivity"
  notes?: string; // User notes/reflections
  longestStreak?: number; // All-time best
  totalCompletions?: number; // All-time count
  monthlyHistory?: { [date: string]: boolean }; // Extended history
  createdAt?: string; // When habit was created
}
```

### Nieuwe Views
- `HabitDetail.tsx` - Detail view met analytics
- `HabitsOverview.tsx` - Overzicht van alle habits met filters

### Helper Functions
- `calculateCompletionRate(habit, days)` - Percentage completion
- `getBestDayOfWeek(habit)` - Meest consistente dag
- `getLongestStreak(habit)` - Bereken longest streak
- `getStreakMilestones(habit)` - Check voor milestones

