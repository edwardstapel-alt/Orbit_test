import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { View } from '../types';

interface StatisticsProps {
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

// Helper functions
function getWeekDates(date: string): string[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday
  const start = new Date(d.setDate(diff));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    dates.push(current.toISOString().split('T')[0]);
  }
  return dates;
}

function getMonthDates(date: string): string[] {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates: string[] = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i).toISOString().split('T')[0]);
  }
  return dates;
}

function getLastNDays(date: string, n: number): string[] {
  const dates: string[] = [];
  const d = new Date(date);
  for (let i = n - 1; i >= 0; i--) {
    const current = new Date(d);
    current.setDate(d.getDate() - i);
    dates.push(current.toISOString().split('T')[0]);
  }
  return dates;
}

function getLastNWeeks(date: string, n: number): Array<{ start: string; end: string; label: string }> {
  const weeks: Array<{ start: string; end: string; label: string }> = [];
  const d = new Date(date);
  for (let i = n - 1; i >= 0; i--) {
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - (d.getDay() + 7 * i));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weeks.push({
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      label: `Week ${n - i}`
    });
  }
  return weeks;
}

export const Statistics: React.FC<StatisticsProps> = ({ onNavigate, onMenuClick, onProfileClick }) => {
  const { 
    tasks, 
    habits, 
    objectives, 
    keyResults, 
    timeSlots,
    lifeAreas,
    statusUpdates,
    getTasksForDate,
    getTimeSlotsForDate
  } = useData();

  // Calculate statistics
  const stats = useMemo(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisWeek = getWeekDates(today);
      const thisMonth = getMonthDates(today);
      const last7Days = getLastNDays(today, 7);
      const last30Days = getLastNDays(today, 30);

    // Task Statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Tasks created today - use scheduledDate as proxy (tasks scheduled for today)
    const tasksCreatedToday = tasks.filter(t => t.scheduledDate === today).length;

    // Tasks completed today - check if completed and scheduled for today
    const tasksCompletedToday = tasks.filter(t => {
      if (!t.completed) return false;
      // If task has scheduledDate, check if it's today
      if (t.scheduledDate) {
        return t.scheduledDate === today;
      }
      // Otherwise, count all completed tasks (heuristic)
      return true;
    }).length;
    
    const tasksThisWeek = tasks.filter(t => {
      return thisWeek.includes(t.scheduledDate || '');
    }).length;

    const tasksCompletedThisWeek = tasks.filter(t => {
      return t.completed && thisWeek.includes(t.scheduledDate || '');
    }).length;

    const tasksThisMonth = tasks.filter(t => {
      return thisMonth.includes(t.scheduledDate || '');
    }).length;

    // Key Results Statistics
    const totalKeyResults = keyResults.length;
    const keyResultsOnTrack = keyResults.filter(kr => kr.status === 'On Track').length;
    const keyResultsAtRisk = keyResults.filter(kr => kr.status === 'At Risk').length;
    const keyResultsOffTrack = keyResults.filter(kr => kr.status === 'Off Track').length;
    
    const avgKeyResultProgress = totalKeyResults > 0
      ? Math.round(keyResults.reduce((sum, kr) => {
          const progress = Math.min(Math.round((kr.current / kr.target) * 100), 100);
          return sum + progress;
        }, 0) / totalKeyResults)
      : 0;

    // Objectives Statistics
    const totalObjectives = objectives.length;
    const objectivesOnTrack = objectives.filter(obj => obj.status === 'On Track').length;
    const objectivesAtRisk = objectives.filter(obj => obj.status === 'At Risk').length;
    const objectivesOffTrack = objectives.filter(obj => obj.status === 'Off Track').length;
    
    const avgObjectiveProgress = totalObjectives > 0
      ? Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / totalObjectives)
      : 0;

    // Habits Statistics
    const totalHabits = habits.length;
    const completedHabitsToday = habits.filter(h => h.completed).length;
    const activeHabits = habits.filter(h => h.streak > 0).length;
    const avgStreak = totalHabits > 0
      ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / totalHabits)
      : 0;

    // Time Slots Statistics
    const totalTimeSlots = timeSlots.length;
    const timeSlotsToday = getTimeSlotsForDate(today).length;
    const timeSlotsThisWeek = timeSlots.filter(ts => thisWeek.includes(ts.date || '')).length;

    // Life Areas Statistics
    const totalLifeAreas = lifeAreas.length;
    const lifeAreasWithGoals = lifeAreas.filter(la => {
      return objectives.some(obj => obj.lifeAreaId === la.id);
    }).length;

    // Status Updates Statistics
    const totalStatusUpdates = statusUpdates.length;
    const statusUpdatesThisWeek = statusUpdates.filter(su => {
      return thisWeek.includes(su.date);
    }).length;

    // Daily completion trend (last 7 days)
    const dailyCompletions = last7Days.map(date => {
      const dayTasks = getTasksForDate(date);
      return {
        date,
        completed: dayTasks.filter(t => t.completed).length,
        total: dayTasks.length
      };
    });

    // Weekly task completion trend
    const weeklyCompletions = getLastNWeeks(today, 4).map(week => {
      const weekTasks = tasks.filter(t => {
        const taskDate = t.scheduledDate || '';
        return taskDate >= week.start && taskDate <= week.end;
      });
      return {
        week: week.label,
        completed: weekTasks.filter(t => t.completed).length,
        total: weekTasks.length
      };
    });

    return {
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completionRate,
        createdToday: tasksCreatedToday,
        completedToday: tasksCompletedToday,
        thisWeek: tasksThisWeek,
        completedThisWeek: tasksCompletedThisWeek,
        thisMonth: tasksThisMonth,
        dailyTrend: dailyCompletions,
        weeklyTrend: weeklyCompletions
      },
      keyResults: {
        total: totalKeyResults,
        onTrack: keyResultsOnTrack,
        atRisk: keyResultsAtRisk,
        offTrack: keyResultsOffTrack,
        avgProgress: avgKeyResultProgress
      },
      objectives: {
        total: totalObjectives,
        onTrack: objectivesOnTrack,
        atRisk: objectivesAtRisk,
        offTrack: objectivesOffTrack,
        avgProgress: avgObjectiveProgress
      },
      habits: {
        total: totalHabits,
        completedToday: completedHabitsToday,
        active: activeHabits,
        avgStreak: avgStreak
      },
      timeSlots: {
        total: totalTimeSlots,
        today: timeSlotsToday,
        thisWeek: timeSlotsThisWeek
      },
      lifeAreas: {
        total: totalLifeAreas,
        withGoals: lifeAreasWithGoals
      },
      statusUpdates: {
        total: totalStatusUpdates,
        thisWeek: statusUpdatesThisWeek
      }
    };
      } catch (error) {
        console.error('Error calculating statistics:', error);
        // Return default/empty stats on error
        return {
          tasks: { total: 0, completed: 0, pending: 0, completionRate: 0, createdToday: 0, completedToday: 0, thisWeek: 0, completedThisWeek: 0, thisMonth: 0, dailyTrend: [], weeklyTrend: [] },
          keyResults: { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, avgProgress: 0 },
          objectives: { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, avgProgress: 0 },
          habits: { total: 0, completedToday: 0, active: 0, avgStreak: 0 },
          timeSlots: { total: 0, today: 0, thisWeek: 0 },
          lifeAreas: { total: 0, withGoals: 0 },
          statusUpdates: { total: 0, thisWeek: 0 }
        };
      }
    }, [tasks, habits, objectives, keyResults, timeSlots, lifeAreas, statusUpdates, getTasksForDate, getTimeSlotsForDate]);

    return (
    <div className="min-h-screen bg-background pb-24">
      <TopNav 
        title="Statistics" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
      />

      <div className="px-4 py-6 space-y-6">
        {/* Tasks Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">check_circle</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Tasks</h2>
              <p className="text-xs text-text-tertiary">Completion & Activity</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-text-main">{stats.tasks.total}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.tasks.completed}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-primary">{stats.tasks.completionRate}%</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.tasks.pending}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">Today</p>
              <p className="text-lg font-bold text-text-main">{stats.tasks.completedToday}</p>
              <p className="text-[10px] text-text-tertiary">of {stats.tasks.createdToday}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">This Week</p>
              <p className="text-lg font-bold text-text-main">{stats.tasks.completedThisWeek}</p>
              <p className="text-[10px] text-text-tertiary">of {stats.tasks.thisWeek}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">This Month</p>
              <p className="text-lg font-bold text-text-main">{stats.tasks.thisMonth}</p>
            </div>
          </div>
        </div>

        {/* Key Results Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600">track_changes</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Key Results</h2>
              <p className="text-xs text-text-tertiary">Progress & Status</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Total Key Results</p>
              <p className="text-2xl font-bold text-text-main">{stats.keyResults.total}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Avg Progress</p>
              <p className="text-2xl font-bold text-primary">{stats.keyResults.avgProgress}%</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="size-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-green-600 text-xl">trending_up</span>
              </div>
              <p className="text-lg font-bold text-text-main">{stats.keyResults.onTrack}</p>
              <p className="text-xs text-text-tertiary">On Track</p>
            </div>
            <div className="text-center">
              <div className="size-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-orange-600 text-xl">warning</span>
              </div>
              <p className="text-lg font-bold text-text-main">{stats.keyResults.atRisk}</p>
              <p className="text-xs text-text-tertiary">At Risk</p>
            </div>
            <div className="text-center">
              <div className="size-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-red-600 text-xl">trending_down</span>
              </div>
              <p className="text-lg font-bold text-text-main">{stats.keyResults.offTrack}</p>
              <p className="text-xs text-text-tertiary">Off Track</p>
            </div>
          </div>
        </div>

        {/* Objectives Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-600">flag</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Objectives</h2>
              <p className="text-xs text-text-tertiary">Goals & Progress</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Total Objectives</p>
              <p className="text-2xl font-bold text-text-main">{stats.objectives.total}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Avg Progress</p>
              <p className="text-2xl font-bold text-primary">{stats.objectives.avgProgress}%</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{stats.objectives.onTrack}</p>
              <p className="text-xs text-text-tertiary">On Track</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">{stats.objectives.atRisk}</p>
              <p className="text-xs text-text-tertiary">At Risk</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{stats.objectives.offTrack}</p>
              <p className="text-xs text-text-tertiary">Off Track</p>
            </div>
          </div>
        </div>

        {/* Habits Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-teal-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-teal-600">repeat</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Habits</h2>
              <p className="text-xs text-text-tertiary">Streaks & Consistency</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Total Habits</p>
              <p className="text-2xl font-bold text-text-main">{stats.habits.total}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Completed Today</p>
              <p className="text-2xl font-bold text-green-600">{stats.habits.completedToday}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Active Habits</p>
              <p className="text-2xl font-bold text-primary">{stats.habits.active}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Avg Streak</p>
              <p className="text-2xl font-bold text-text-main">{stats.habits.avgStreak}</p>
            </div>
          </div>
        </div>

        {/* Time Slots Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600">schedule</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Time Slots</h2>
              <p className="text-xs text-text-tertiary">Scheduled Time</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-text-tertiary mb-1">Total</p>
              <p className="text-2xl font-bold text-text-main">{stats.timeSlots.total}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-text-tertiary mb-1">Today</p>
              <p className="text-2xl font-bold text-primary">{stats.timeSlots.today}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-text-tertiary mb-1">This Week</p>
              <p className="text-2xl font-bold text-text-main">{stats.timeSlots.thisWeek}</p>
            </div>
          </div>
        </div>

        {/* Life Areas Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-pink-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-pink-600">category</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Life Areas</h2>
              <p className="text-xs text-text-tertiary">Coverage & Goals</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">Total Life Areas</p>
              <p className="text-2xl font-bold text-text-main">{stats.lifeAreas.total}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-text-tertiary mb-1">With Goals</p>
              <p className="text-2xl font-bold text-primary">{stats.lifeAreas.withGoals}</p>
            </div>
          </div>
        </div>

        {/* Status Updates Overview */}
        {stats.statusUpdates.total > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-cyan-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-cyan-600">update</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main">Status Updates</h2>
                <p className="text-xs text-text-tertiary">Progress Tracking</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-text-tertiary mb-1">Total Updates</p>
                <p className="text-2xl font-bold text-text-main">{stats.statusUpdates.total}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-text-tertiary mb-1">This Week</p>
                <p className="text-2xl font-bold text-primary">{stats.statusUpdates.thisWeek}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

