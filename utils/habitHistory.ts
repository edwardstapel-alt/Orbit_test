// Habit History & Tracking Utilities
// Extended history tracking and streak calculation

import { Habit, CompletionRecord } from '../types';

/**
 * Record a habit completion
 */
export function recordHabitCompletion(
  habit: Habit,
  date?: string
): Habit {
  const completionDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const timestamp = new Date().toISOString();
  const timeOfDay = new Date().toTimeString().slice(0, 5); // HH:mm

  // Initialize history if needed
  const monthlyHistory = habit.monthlyHistory || {};
  const completionHistory = habit.completionHistory || [];

  // Update monthly history
  monthlyHistory[completionDate] = true;

  // Add completion record
  const newRecord: CompletionRecord = {
    date: completionDate,
    timestamp,
    timeOfDay,
  };

  // Avoid duplicates
  const existingIndex = completionHistory.findIndex(
    r => r.date === completionDate
  );
  if (existingIndex >= 0) {
    completionHistory[existingIndex] = newRecord;
  } else {
    completionHistory.push(newRecord);
  }

  // Calculate streak
  const newStreak = calculateStreak(monthlyHistory, completionDate);
  const longestStreak = Math.max(habit.longestStreak || 0, newStreak);

  // Update totals
  const totalCompletions = (habit.totalCompletions || 0) + 1;

  return {
    ...habit,
    completed: true,
    streak: newStreak,
    longestStreak,
    totalCompletions,
    monthlyHistory,
    completionHistory: completionHistory.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
  };
}

/**
 * Mark habit as not completed for a date
 */
export function recordHabitMiss(habit: Habit, date?: string): Habit {
  const completionDate = date || new Date().toISOString().split('T')[0];

  const monthlyHistory = habit.monthlyHistory || {};
  monthlyHistory[completionDate] = false;

  // Remove from completion history
  const completionHistory = (habit.completionHistory || []).filter(
    r => r.date !== completionDate
  );

  // Recalculate streak
  const newStreak = calculateStreak(monthlyHistory, completionDate);

  return {
    ...habit,
    completed: false,
    streak: newStreak,
    monthlyHistory,
    completionHistory,
  };
}

/**
 * Calculate current streak from history
 */
export function calculateStreak(
  monthlyHistory: { [date: string]: boolean },
  currentDate?: string
): number {
  const today = currentDate || new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  
  let streak = 0;
  let checkDate = new Date(todayDate);

  // Check backwards from today
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const completed = monthlyHistory[dateStr];

    if (completed === true) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (completed === false) {
      // Explicitly marked as not done, streak broken
      break;
    } else {
      // No record for this date
      // If it's today or in the future, don't break streak
      // If it's in the past and no record, streak might be broken
      if (checkDate < todayDate) {
        // Past date with no record - assume not done
        break;
      } else {
        // Today or future - don't break streak yet
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Safety limit
    if (streak > 1000) break;
  }

  return streak;
}

/**
 * Get completion rate for a date range
 */
export function getCompletionRate(
  habit: Habit,
  days: number = 30
): number {
  const monthlyHistory = habit.monthlyHistory || {};
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);

  let completed = 0;
  let total = 0;

  for (let i = 0; i < days; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);
    const dateStr = checkDate.toISOString().split('T')[0];

    total++;
    if (monthlyHistory[dateStr] === true) {
      completed++;
    }
  }

  return total > 0 ? completed / total : 0;
}

/**
 * Get best day of week (most consistent)
 */
export function getBestDayOfWeek(habit: Habit): number {
  const monthlyHistory = habit.monthlyHistory || {};
  const dayCounts: { [day: number]: { completed: number; total: number } } = {};

  // Initialize
  for (let i = 0; i < 7; i++) {
    dayCounts[i] = { completed: 0, total: 0 };
  }

  // Count completions per day of week
  Object.entries(monthlyHistory).forEach(([dateStr, completed]) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    dayCounts[dayOfWeek].total++;
    if (completed) {
      dayCounts[dayOfWeek].completed++;
    }
  });

  // Find day with highest completion rate
  let bestDay = 0;
  let bestRate = 0;

  for (let i = 0; i < 7; i++) {
    const rate = dayCounts[i].total > 0 
      ? dayCounts[i].completed / dayCounts[i].total 
      : 0;
    
    if (rate > bestRate) {
      bestRate = rate;
      bestDay = i;
    }
  }

  return bestDay;
}

/**
 * Get streak milestones achieved
 */
export function getStreakMilestones(habit: Habit): number[] {
  const milestones = [7, 30, 100, 365];
  const longestStreak = habit.longestStreak || habit.streak || 0;
  
  return milestones.filter(m => longestStreak >= m);
}

/**
 * Export habit history to JSON
 */
export function exportHabitHistory(habit: Habit): string {
  return JSON.stringify({
    habitId: habit.id,
    habitName: habit.name,
    exportDate: new Date().toISOString(),
    completionHistory: habit.completionHistory || [],
    monthlyHistory: habit.monthlyHistory || {},
    stats: {
      currentStreak: habit.streak,
      longestStreak: habit.longestStreak,
      totalCompletions: habit.totalCompletions,
      completionRate30Days: getCompletionRate(habit, 30),
      completionRate90Days: getCompletionRate(habit, 90),
    },
  }, null, 2);
}

