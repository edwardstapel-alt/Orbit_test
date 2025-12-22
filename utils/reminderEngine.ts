/**
 * Reminder Engine
 * Berekent wanneer reminders moeten worden getoond op basis van scheduledTime en offsetMinutes
 */

import { Reminder, EntityType, Task, Habit, Objective, TimeSlot } from '../types';

export interface ReminderCalculation {
  reminder: Reminder;
  shouldShow: boolean;
  showAt: Date; // Wanneer de reminder moet worden getoond
  isOverdue: boolean; // Of de reminder al voorbij is
}

class ReminderEngine {
  /**
   * Berekent wanneer een reminder moet worden getoond
   * @param reminder De reminder om te berekenen
   * @param entity De gekoppelde entiteit (task, habit, objective, timeSlot)
   * @returns ReminderCalculation met showAt tijd en status
   */
  calculateReminderTime(
    reminder: Reminder,
    entity: Task | Habit | Objective | TimeSlot | null
  ): ReminderCalculation | null {
    if (!entity) {
      return null;
    }

    // Bepaal de scheduledTime van de entiteit
    let scheduledDateTime: Date | null = null;

    switch (reminder.entityType) {
      case 'task': {
        const task = entity as Task;
        if (task.scheduledDate && task.scheduledTime) {
          // Parse scheduledDate (YYYY-MM-DD) en scheduledTime (HH:mm)
          const [year, month, day] = task.scheduledDate.split('-').map(Number);
          const [hours, minutes] = task.scheduledTime.split(':').map(Number);
          scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
        } else if (task.scheduledDate) {
          // Alleen datum, gebruik 09:00 als default tijd
          const [year, month, day] = task.scheduledDate.split('-').map(Number);
          scheduledDateTime = new Date(year, month - 1, day, 9, 0);
        }
        break;
      }

      case 'habit': {
        const habit = entity as Habit;
        if (habit.time) {
          // Parse habit.time (kan "HH:mm" of "Morning", "Evening" zijn)
          const now = new Date();
          if (habit.time.includes(':')) {
            const [hours, minutes] = habit.time.split(':').map(Number);
            scheduledDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          } else {
            // Default tijden voor day parts
            const dayPartTimes: { [key: string]: { hours: number; minutes: number } } = {
              'Morning': { hours: 8, minutes: 0 },
              'Afternoon': { hours: 14, minutes: 0 },
              'Evening': { hours: 19, minutes: 0 },
              'All Day': { hours: 9, minutes: 0 }
            };
            const time = dayPartTimes[habit.time] || { hours: 9, minutes: 0 };
            scheduledDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), time.hours, time.minutes);
          }
        } else {
          // Geen tijd opgegeven, gebruik 09:00 als default
          const now = new Date();
          scheduledDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
        }
        break;
      }

      case 'objective': {
        const objective = entity as Objective;
        if (objective.endDate) {
          // Gebruik endDate als deadline, default tijd 17:00
          const [year, month, day] = objective.endDate.split('-').map(Number);
          scheduledDateTime = new Date(year, month - 1, day, 17, 0);
        }
        break;
      }

      case 'timeSlot': {
        const timeSlot = entity as TimeSlot;
        if (timeSlot.date && timeSlot.startTime) {
          const [year, month, day] = timeSlot.date.split('-').map(Number);
          const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
          scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
        }
        break;
      }
    }

    if (!scheduledDateTime) {
      return null;
    }

    // Bereken showAt tijd (scheduledDateTime - offsetMinutes)
    const showAt = new Date(scheduledDateTime.getTime() - reminder.offsetMinutes * 60 * 1000);
    const now = new Date();
    const shouldShow = now >= showAt && !reminder.completed;
    const isOverdue = now > scheduledDateTime && !reminder.completed;

    return {
      reminder,
      shouldShow,
      showAt,
      isOverdue
    };
  }

  /**
   * Filter reminders die nu getoond moeten worden
   */
  getRemindersToShow(
    reminders: Reminder[],
    entities: Map<string, Task | Habit | Objective | TimeSlot>
  ): ReminderCalculation[] {
    const now = new Date();
    const results: ReminderCalculation[] = [];

    for (const reminder of reminders) {
      if (reminder.completed) continue;

      const entity = entities.get(reminder.entityId);
      if (!entity) continue;

      const calculation = this.calculateReminderTime(reminder, entity);
      if (!calculation) continue;

      // Toon reminder als showAt tijd is gepasseerd
      if (calculation.shouldShow) {
        results.push(calculation);
      }
    }

    // Sorteer op showAt tijd (oudste eerst)
    return results.sort((a, b) => a.showAt.getTime() - b.showAt.getTime());
  }

  /**
   * Bepaal default offset voor een entity type
   */
  getDefaultOffset(entityType: EntityType, customDefaults?: { [key in EntityType]?: number }): number {
    if (customDefaults && customDefaults[entityType] !== undefined) {
      return customDefaults[entityType]!;
    }

    // Standaard offsets
    const defaults: { [key in EntityType]?: number } = {
      task: 15, // 15 minuten voor task
      habit: 5, // 5 minuten voor habit
      objective: 1440, // 1 dag voor objective deadline
      timeSlot: 15 // 15 minuten voor timeSlot
    };

    return defaults[entityType] || 15;
  }

  /**
   * Format reminder tijd voor display
   */
  formatReminderTime(showAt: Date): string {
    const now = new Date();
    const diffMs = showAt.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 0) {
      return 'Nu';
    } else if (diffMins < 60) {
      return `Over ${diffMins} min`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `Over ${hours} uur`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `Over ${days} dag${days > 1 ? 'en' : ''}`;
    }
  }
}

// Singleton instance
export const reminderEngine = new ReminderEngine();

