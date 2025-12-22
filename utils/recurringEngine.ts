/**
 * Recurring Engine
 * Berekent volgende occurrences voor recurring tasks en habits
 */

import { Task, Habit } from '../types';

export interface RecurringPattern {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  nthWeekday?: {
    weekday: number;
    n: number;
  };
  endDate?: string;
  endAfterOccurrences?: number;
  skipWeekends?: boolean;
  timezone?: string;
}

export interface RecurringHabitPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[];
  specificDays?: number[];
  skipWeekends?: boolean;
  reminderTime?: string;
}

class RecurringEngine {
  /**
   * Bereken volgende occurrence datum voor een recurring task
   */
  calculateNextOccurrence(
    task: Task,
    fromDate?: Date
  ): Date | null {
    if (!task.recurring) return null;

    const startDate = fromDate || new Date();
    const pattern = task.recurring;

    // Check end conditions
    if (pattern.endDate) {
      const endDate = new Date(pattern.endDate);
      if (startDate > endDate) return null;
    }

    let nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + 1); // Start from tomorrow

    switch (pattern.pattern) {
      case 'daily':
        return this.calculateDailyNext(nextDate, pattern);
      
      case 'weekly':
        return this.calculateWeeklyNext(nextDate, pattern);
      
      case 'monthly':
        return this.calculateMonthlyNext(nextDate, pattern);
      
      case 'yearly':
        return this.calculateYearlyNext(nextDate, pattern);
      
      default:
        return null;
    }
  }

  /**
   * Genereer task instances voor komende periode
   */
  generateRecurringInstances(
    task: Task,
    daysAhead: number = 30
  ): Task[] {
    if (!task.recurring || task.recurring.parentTaskId) {
      // Don't generate from instances
      return [];
    }

    const instances: Task[] = [];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    let currentDate = new Date();
    if (task.recurring.lastGenerated) {
      currentDate = new Date(task.recurring.lastGenerated);
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (task.scheduledDate) {
      currentDate = new Date(task.scheduledDate);
    }

    let instanceNumber = (task.recurring.instanceNumber || 0) + 1;

    while (currentDate <= endDate) {
      // Check end conditions
      if (task.recurring.endDate) {
        const end = new Date(task.recurring.endDate);
        if (currentDate > end) break;
      }
      if (task.recurring.endAfterOccurrences && instanceNumber > task.recurring.endAfterOccurrences) {
        break;
      }

      const nextDate = this.calculateNextOccurrence(task, currentDate);
      if (!nextDate) break;

      // Skip weekends if needed
      if (task.recurring.skipWeekends) {
        const dayOfWeek = nextDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          currentDate = nextDate;
          continue;
        }
      }

      // Create instance
      const instance: Task = {
        ...task,
        id: `${task.id}-${instanceNumber}`,
        completed: false,
        scheduledDate: this.formatDate(nextDate),
        recurring: {
          ...task.recurring,
          parentTaskId: task.id,
          instanceNumber
        }
      };

      instances.push(instance);
      instanceNumber++;
      currentDate = nextDate;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return instances;
  }

  /**
   * Check of datum overgeslagen moet worden (weekends, holidays)
   */
  shouldSkipDate(date: Date, pattern: RecurringPattern): boolean {
    if (pattern.skipWeekends) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return true;
      }
    }
    // TODO: Add holiday checking
    return false;
  }

  private calculateDailyNext(fromDate: Date, pattern: RecurringPattern): Date {
    const next = new Date(fromDate);
    const interval = pattern.interval || 1;
    next.setDate(next.getDate() + interval);
    return next;
  }

  private calculateWeeklyNext(fromDate: Date, pattern: RecurringPattern): Date {
    if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
      // Default: same day next week
      const next = new Date(fromDate);
      next.setDate(next.getDate() + 7);
      return next;
    }

    const currentDay = fromDate.getDay();
    const sortedDays = [...pattern.daysOfWeek].sort((a, b) => a - b);
    
    // Find next day in this week
    for (const day of sortedDays) {
      if (day > currentDay) {
        const next = new Date(fromDate);
        next.setDate(next.getDate() + (day - currentDay));
        return next;
      }
    }

    // Next occurrence is next week
    const next = new Date(fromDate);
    next.setDate(next.getDate() + (7 - currentDay + sortedDays[0]));
    return next;
  }

  private calculateMonthlyNext(fromDate: Date, pattern: RecurringPattern): Date {
    const next = new Date(fromDate);
    
    if (pattern.dayOfMonth) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(pattern.dayOfMonth);
      return next;
    }

    if (pattern.nthWeekday) {
      return this.calculateNthWeekdayNext(fromDate, pattern.nthWeekday);
    }

    // Default: same day next month
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  private calculateYearlyNext(fromDate: Date, pattern: RecurringPattern): Date {
    const next = new Date(fromDate);
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }

  private calculateNthWeekdayNext(fromDate: Date, nthWeekday: { weekday: number; n: number }): Date {
    const next = new Date(fromDate);
    next.setMonth(next.getMonth() + 1);
    next.setDate(1); // Start of month

    // Find nth weekday
    let count = 0;
    while (next.getMonth() === fromDate.getMonth() + 1 || count < nthWeekday.n) {
      if (next.getDay() === nthWeekday.weekday) {
        count++;
        if (count === nthWeekday.n) {
          return next;
        }
      }
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Valideer recurring pattern
   */
  validatePattern(pattern: RecurringPattern): { valid: boolean; error?: string } {
    if (pattern.interval && pattern.interval < 1) {
      return { valid: false, error: 'Interval moet minimaal 1 zijn' };
    }

    if (pattern.daysOfWeek) {
      for (const day of pattern.daysOfWeek) {
        if (day < 0 || day > 6) {
          return { valid: false, error: 'Days of week moeten tussen 0-6 zijn' };
        }
      }
    }

    if (pattern.dayOfMonth && (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
      return { valid: false, error: 'Day of month moet tussen 1-31 zijn' };
    }

    if (pattern.nthWeekday) {
      if (pattern.nthWeekday.weekday < 0 || pattern.nthWeekday.weekday > 6) {
        return { valid: false, error: 'Weekday moet tussen 0-6 zijn' };
      }
      if (pattern.nthWeekday.n < 1 || pattern.nthWeekday.n > 5) {
        return { valid: false, error: 'N moet tussen 1-5 zijn' };
      }
    }

    return { valid: true };
  }
}

// Singleton instance
export const recurringEngine = new RecurringEngine();

