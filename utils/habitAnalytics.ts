// Habit Analytics Utilities
// Analytics, trends, correlations, and insights

import { Habit, HabitAnalytics, CompletionRecord } from '../types';
import { getCompletionRate, getBestDayOfWeek, getStreakMilestones } from './habitHistory';

/**
 * Calculate completion rate for a habit (wrapper for getCompletionRate)
 */
export function calculateCompletionRate(habit: Habit, days: number = 30): number {
  return Math.round(getCompletionRate(habit, days) * 100);
}

/**
 * Calculate comprehensive analytics for a habit
 */
export function calculateHabitAnalytics(
  habit: Habit,
  allHabits: Habit[]
): HabitAnalytics {
  const monthlyHistory = habit.monthlyHistory || {};
  const completionHistory = habit.completionHistory || [];

  // Completion trends (compare last 30 days vs previous 30 days)
  const recent30Days = getCompletionRate(habit, 30);
  const previous30Days = getCompletionRateForRange(
    habit,
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  
  const trendPercentage = previous30Days > 0
    ? ((recent30Days - previous30Days) / previous30Days) * 100
    : 0;
  
  const completionTrend: 'increasing' | 'decreasing' | 'stable' = 
    trendPercentage > 5 ? 'increasing' :
    trendPercentage < -5 ? 'decreasing' :
    'stable';

  // Best day of week
  const bestDayOfWeek = getBestDayOfWeek(habit);

  // Best time of day
  const bestTimeOfDay = getBestTimeOfDay(completionHistory);

  // Weekday vs weekend patterns
  const weekdayCompletionRate = getWeekdayCompletionRate(habit);
  const weekendCompletionRate = getWeekendCompletionRate(habit);

  // Correlations with other habits
  const correlatedHabits = calculateHabitCorrelations(habit, allHabits);

  // Milestones
  const streakMilestones = getStreakMilestones(habit);

  // Average completions per week
  const averageCompletionsPerWeek = calculateAverageCompletionsPerWeek(habit);

  return {
    habitId: habit.id,
    completionTrend,
    trendPercentage,
    bestDayOfWeek,
    bestTimeOfDay,
    weekdayCompletionRate,
    weekendCompletionRate,
    correlatedHabits,
    currentStreak: habit.streak || 0,
    longestStreak: habit.longestStreak || habit.streak || 0,
    streakMilestones,
    completionRate30Days: recent30Days,
    completionRate90Days: getCompletionRate(habit, 90),
    totalCompletions: habit.totalCompletions || 0,
    averageCompletionsPerWeek,
  };
}

/**
 * Get completion rate for a specific date range
 */
function getCompletionRateForRange(
  habit: Habit,
  startDate: Date,
  endDate: Date
): number {
  const monthlyHistory = habit.monthlyHistory || {};
  let completed = 0;
  let total = 0;

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    total++;
    if (monthlyHistory[dateStr] === true) {
      completed++;
    }
    current.setDate(current.getDate() + 1);
  }

  return total > 0 ? completed / total : 0;
}

/**
 * Get best time of day for completions
 */
function getBestTimeOfDay(
  completionHistory: CompletionRecord[]
): string | undefined {
  if (completionHistory.length === 0) return undefined;

  const timeCounts: { [time: string]: number } = {};

  completionHistory.forEach(record => {
    if (record.timeOfDay) {
      // Round to nearest hour for grouping
      const [hours] = record.timeOfDay.split(':');
      const hourKey = `${hours}:00`;
      timeCounts[hourKey] = (timeCounts[hourKey] || 0) + 1;
    }
  });

  let bestTime: string | undefined;
  let maxCount = 0;

  Object.entries(timeCounts).forEach(([time, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bestTime = time;
    }
  });

  return bestTime;
}

/**
 * Get weekday completion rate (Monday-Friday)
 */
function getWeekdayCompletionRate(habit: Habit): number {
  const monthlyHistory = habit.monthlyHistory || {};
  let completed = 0;
  let total = 0;

  Object.entries(monthlyHistory).forEach(([dateStr, isCompleted]) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Weekday = Monday (1) to Friday (5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      total++;
      if (isCompleted) {
        completed++;
      }
    }
  });

  return total > 0 ? completed / total : 0;
}

/**
 * Get weekend completion rate (Saturday-Sunday)
 */
function getWeekendCompletionRate(habit: Habit): number {
  const monthlyHistory = habit.monthlyHistory || {};
  let completed = 0;
  let total = 0;

  Object.entries(monthlyHistory).forEach(([dateStr, isCompleted]) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Weekend = Saturday (6) or Sunday (0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      total++;
      if (isCompleted) {
        completed++;
      }
    }
  });

  return total > 0 ? completed / total : 0;
}

/**
 * Calculate correlations with other habits
 */
function calculateHabitCorrelations(
  habit: Habit,
  allHabits: Habit[]
): Array<{ habitId: string; habitName: string; correlationScore: number }> {
  const habitHistory = habit.monthlyHistory || {};
  const correlations: Array<{ habitId: string; habitName: string; correlationScore: number }> = [];

  allHabits.forEach(otherHabit => {
    if (otherHabit.id === habit.id) return; // Skip self

    const otherHistory = otherHabit.monthlyHistory || {};
    const commonDates = Object.keys(habitHistory).filter(date => 
      otherHistory.hasOwnProperty(date)
    );

    if (commonDates.length < 7) return; // Need at least 7 common dates

    let bothCompleted = 0;
    let total = 0;

    commonDates.forEach(date => {
      total++;
      if (habitHistory[date] === true && otherHistory[date] === true) {
        bothCompleted++;
      }
    });

    const correlationScore = total > 0 ? bothCompleted / total : 0;

    if (correlationScore > 0.3) { // Only show if > 30% correlation
      correlations.push({
        habitId: otherHabit.id,
        habitName: otherHabit.name,
        correlationScore,
      });
    }
  });

  // Sort by correlation score (highest first)
  return correlations.sort((a, b) => b.correlationScore - a.correlationScore).slice(0, 5);
}

/**
 * Calculate average completions per week
 */
function calculateAverageCompletionsPerWeek(habit: Habit): number {
  const completionHistory = habit.completionHistory || [];
  if (completionHistory.length === 0) return 0;

  // Get date range
  const dates = completionHistory.map(r => new Date(r.date));
  const oldest = new Date(Math.min(...dates.map(d => d.getTime())));
  const newest = new Date(Math.max(...dates.map(d => d.getTime())));

  const daysDiff = Math.ceil((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.max(1, daysDiff / 7);

  return completionHistory.length / weeks;
}

/**
 * Get insights and recommendations
 */
export function getHabitInsights(analytics: HabitAnalytics): string[] {
  const insights: string[] = [];

  // Trend insights
  if (analytics.completionTrend === 'decreasing' && analytics.trendPercentage < -20) {
    insights.push(`⚠️ Je completion rate is ${Math.abs(analytics.trendPercentage).toFixed(0)}% gedaald. Probeer je habit weer op te pakken!`);
  } else if (analytics.completionTrend === 'increasing' && analytics.trendPercentage > 20) {
    insights.push(`🎉 Geweldig! Je completion rate is ${analytics.trendPercentage.toFixed(0)}% gestegen!`);
  }

  // Streak milestones
  if (analytics.currentStreak >= 7 && !analytics.streakMilestones.includes(7)) {
    insights.push(`🔥 Je hebt een 7-dagen streak! Blijf doorgaan!`);
  }
  if (analytics.currentStreak >= 30 && !analytics.streakMilestones.includes(30)) {
    insights.push(`🏆 30 dagen streak! Je bent een echte gewoonte-meester!`);
  }

  // Best day insights
  const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  insights.push(`📅 Je meest consistente dag is ${dayNames[analytics.bestDayOfWeek]}`);

  // Time pattern insights
  if (analytics.bestTimeOfDay) {
    insights.push(`⏰ Je doet deze habit het vaakst rond ${analytics.bestTimeOfDay}`);
  }

  // Correlation insights
  if (analytics.correlatedHabits && analytics.correlatedHabits.length > 0) {
    const topCorrelation = analytics.correlatedHabits[0];
    insights.push(`🔗 Deze habit wordt vaak samen gedaan met "${topCorrelation.habitName}" (${(topCorrelation.correlationScore * 100).toFixed(0)}% van de tijd)`);
  }

  return insights;
}

