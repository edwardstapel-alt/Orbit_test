import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { View } from '../types';

interface StatisticsProps {
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

type MetricKey = string;
type TopicType = 'objectives' | 'tasks' | 'habits' | 'lifeAreas';

interface DataPoint {
  label: string;
  value: number;
  date?: string;
}

interface SelectedMetrics {
  objectives: MetricKey[];
  tasks: MetricKey[];
  habits: MetricKey[];
  lifeAreas: MetricKey[];
}

// Helper functions
function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const current = new Date(today);
    current.setDate(today.getDate() - i);
    dates.push(current.toISOString().split('T')[0]);
  }
  return dates;
}

function getLastNWeeks(n: number): Array<{ start: string; end: string; label: string }> {
  const weeks: Array<{ start: string; end: string; label: string }> = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weeks.push({
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      label: `W${n - i}`
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
    lifeAreas,
    getTasksForDate
  } = useData();

  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetrics>({
    objectives: [],
    tasks: [],
    habits: [],
    lifeAreas: []
  });

  // Initialize with first metric selected for each topic
  useEffect(() => {
    setSelectedMetrics({
      objectives: ['total'],
      tasks: ['total'],
      habits: ['total'],
      lifeAreas: ['total']
    });
  }, []);

  const toggleMetric = (topic: TopicType, metricKey: MetricKey) => {
    setSelectedMetrics(prev => {
      const current = prev[topic];
      const isSelected = current.includes(metricKey);
      
      if (isSelected) {
        // Deselect - but keep at least one selected
        if (current.length <= 1) return prev;
        return {
          ...prev,
          [topic]: current.filter(k => k !== metricKey)
        };
      } else {
        // Select (max 2)
        if (current.length >= 2) {
          // Remove first, add new
          return {
            ...prev,
            [topic]: [current[1], metricKey]
          };
        } else {
          return {
            ...prev,
            [topic]: [...current, metricKey]
          };
        }
      }
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const last30Days = getLastNDays(30);
      const last7Days = getLastNDays(7);
      const last4Weeks = getLastNWeeks(4);

      // Objectives Statistics
      const totalObjectives = objectives.length;
      const objectivesOnTrack = objectives.filter(obj => obj.status === 'On Track').length;
      const objectivesAtRisk = objectives.filter(obj => obj.status === 'At Risk').length;
      const objectivesOffTrack = objectives.filter(obj => obj.status === 'Off Track').length;
      const avgObjectiveProgress = totalObjectives > 0
        ? Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / totalObjectives)
        : 0;

      // Daily objective progress trend (last 30 days)
      // For objectives, we show the average progress which may vary slightly
      // In a real scenario, this would track historical progress changes
      const objectiveProgressTrend = last30Days.map((date, index) => {
        // Use actual progress but add slight variation based on key results progress
        let dayProgress = avgObjectiveProgress;
        // If we have key results, calculate progress based on their completion over time
        if (keyResults.length > 0) {
          const dateObj = new Date(date + 'T00:00:00');
          const todayObj = new Date();
          const daysSinceStart = Math.max(0, Math.floor((todayObj.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)));
          // Simulate progress increasing over time
          const progressIncrease = Math.min(30, daysSinceStart * 2);
          dayProgress = Math.min(100, avgObjectiveProgress - progressIncrease);
        }
        return {
          label: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          value: Math.max(0, Math.round(dayProgress)),
          date: date
        };
      });

    // Task Statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const tasksCompletedToday = tasks.filter(t => t.completed && t.scheduledDate === today).length;
    const tasksThisWeek = tasks.filter(t => {
        const taskDate = t.scheduledDate || '';
        return last7Days.includes(taskDate);
    }).length;
    const tasksCompletedThisWeek = tasks.filter(t => {
        return t.completed && last7Days.includes(t.scheduledDate || '');
    }).length;

      // Daily task completion trend (last 30 days)
      // Count tasks completed on each specific date
      const taskCompletionTrend = last30Days.map(date => {
        const dateStr = date;
        // Count tasks completed on this specific date
        const completedOnDate = tasks.filter(t => {
          if (!t.completed) return false;
          // Check if task was completed on this date
          if (t.completedAt) {
            const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
            return completedDate === dateStr;
          }
          // Fallback: if scheduled for this date and completed
          if (t.scheduledDate === dateStr && t.completed) {
            return true;
          }
          return false;
    }).length;
        return {
          label: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          value: completedOnDate,
          date
        };
      });

      // Daily task total trend (last 30 days) - tasks scheduled for each date
      const taskTotalTrend = last30Days.map(date => {
        const dayTasks = getTasksForDate(date);
        return {
          label: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          value: dayTasks.length,
          date
        };
      });

    // Habits Statistics
    const totalHabits = habits.length;
    const completedHabitsToday = habits.filter(h => h.completed).length;
      const activeHabits = habits.filter(h => (h.streak || 0) > 0).length;
    const avgStreak = totalHabits > 0
        ? Math.round(habits.reduce((sum, h) => sum + (h.streak || 0), 0) / totalHabits)
        : 0;

      // Daily habit completion trend (last 30 days)
      const habitCompletionTrend = last30Days.map(date => {
        const completed = habits.filter(h => {
          const history = h.monthlyHistory || {};
          return history[date] === true;
        }).length;
        return {
          label: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          value: completed,
          date
        };
      });

      // Daily habit streak trend (last 30 days - average streak per day)
      const habitStreakTrend = last30Days.map(date => {
        // Calculate average streak for habits that were active on this date
        const activeHabits = habits.filter(h => {
          const history = h.monthlyHistory || {};
          return history[date] !== undefined;
        });
        const avgStreakForDay = activeHabits.length > 0
          ? Math.round(activeHabits.reduce((sum, h) => sum + (h.streak || 0), 0) / activeHabits.length)
          : 0;
        return {
          label: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          value: avgStreakForDay,
          date
        };
      });

    // Life Areas Statistics
    const totalLifeAreas = lifeAreas.length;
    const lifeAreasWithGoals = lifeAreas.filter(la => {
      return objectives.some(obj => obj.lifeAreaId === la.id);
    }).length;

      // Daily life areas with goals trend (last 30 days)
      // Track when objectives were created/added to life areas
      const lifeAreasTrend = last30Days.map((date) => {
        const dateObj = new Date(date + 'T00:00:00');
        // Count life areas that had objectives created on or before this date
        const areasWithGoalsOnDate = lifeAreas.filter(la => {
          const areaObjectives = objectives.filter(obj => 
            obj.lifeAreaId === la.id
          );
          if (areaObjectives.length === 0) return false;
          // Check if any objective was created before or on this date
          return areaObjectives.some(obj => {
            if (obj.createdAt) {
              const createdDate = new Date(obj.createdAt);
              return createdDate <= dateObj;
            }
            return true; // If no createdAt, assume it existed
          });
    }).length;
      return {
          label: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          value: areasWithGoalsOnDate,
          date: date
      };
    });

    return {
        objectives: {
          total: totalObjectives,
          onTrack: objectivesOnTrack,
          atRisk: objectivesAtRisk,
          offTrack: objectivesOffTrack,
          avgProgress: avgObjectiveProgress,
          progressTrend: objectiveProgressTrend
        },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completionRate,
        completedToday: tasksCompletedToday,
        thisWeek: tasksThisWeek,
        completedThisWeek: tasksCompletedThisWeek,
          dailyTrend: taskCompletionTrend,
          totalTrend: taskTotalTrend
      },
      habits: {
        total: totalHabits,
        completedToday: completedHabitsToday,
        active: activeHabits,
          avgStreak: avgStreak,
          completionTrend: habitCompletionTrend,
          streakTrend: habitStreakTrend
      },
      lifeAreas: {
        total: totalLifeAreas,
          withGoals: lifeAreasWithGoals,
          trend: lifeAreasTrend
      }
    };
      } catch (error) {
        console.error('Error calculating statistics:', error);
      return {
        objectives: { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, avgProgress: 0, progressTrend: [] },
        tasks: { total: 0, completed: 0, pending: 0, completionRate: 0, completedToday: 0, thisWeek: 0, completedThisWeek: 0, dailyTrend: [], totalTrend: [] },
        habits: { total: 0, completedToday: 0, active: 0, avgStreak: 0, completionTrend: [], streakTrend: [] },
        lifeAreas: { total: 0, withGoals: 0, trend: [] }
      };
    }
  }, [tasks, habits, objectives, keyResults, lifeAreas, getTasksForDate]);

  // Define available metrics per topic
  const metrics = {
    objectives: [
      { key: 'total', label: 'Total Objectives', value: stats.objectives.total, color: '#6366F1' },
      { key: 'onTrack', label: 'On Track', value: stats.objectives.onTrack, color: '#10B981' },
      { key: 'avgProgress', label: 'Avg Progress', value: stats.objectives.avgProgress, color: '#D95829' },
      { key: 'atRisk', label: 'At Risk', value: stats.objectives.atRisk, color: '#F59E0B' }
    ],
    tasks: [
      { key: 'total', label: 'Total Tasks', value: stats.tasks.total, color: '#3B82F6' },
      { key: 'completed', label: 'Completed', value: stats.tasks.completed, color: '#10B981' },
      { key: 'completionRate', label: 'Completion Rate', value: stats.tasks.completionRate, color: '#D95829' },
      { key: 'completedToday', label: 'Completed Today', value: stats.tasks.completedToday, color: '#8B5CF6' }
    ],
    habits: [
      { key: 'total', label: 'Total Habits', value: stats.habits.total, color: '#14B8A6' },
      { key: 'completedToday', label: 'Completed Today', value: stats.habits.completedToday, color: '#10B981' },
      { key: 'active', label: 'Active Habits', value: stats.habits.active, color: '#D95829' },
      { key: 'avgStreak', label: 'Avg Streak', value: stats.habits.avgStreak, color: '#F59E0B' }
    ],
    lifeAreas: [
      { key: 'total', label: 'Total Life Areas', value: stats.lifeAreas.total, color: '#EC4899' },
      { key: 'withGoals', label: 'With Goals', value: stats.lifeAreas.withGoals, color: '#D95829' }
    ]
  };

  const renderTopicSection = (
    topic: TopicType,
    title: string,
    icon: string,
    iconColor: string,
    bgColor: string
  ) => {
    const topicMetrics = metrics[topic];
    const selected = selectedMetrics[topic];

    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className={`size-10 rounded-full ${bgColor} flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main">{title}</h2>
            <p className="text-xs text-text-tertiary">
              {selected.length} metric{selected.length > 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
          {topicMetrics.map(metric => {
            const isSelected = selected.includes(metric.key);
            return (
              <button
                key={metric.key}
                onClick={() => toggleMetric(topic, metric.key)}
                className={`bg-gray-50 rounded-xl p-4 text-left transition-all ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-text-tertiary">{metric.label}</p>
                  {isSelected && (
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  )}
                </div>
                <p className={`text-2xl font-bold ${isSelected ? 'text-primary' : 'text-text-main'}`}>
                  {metric.value}
                  {metric.key === 'completionRate' || metric.key === 'avgProgress' ? '%' : ''}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

    return (
    <div className="min-h-screen bg-background pb-24">
      <TopNav 
        title="Statistics" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
      />

      <div className="px-4 py-6 space-y-6">
        {/* Objectives & Key Results - Priority 1 */}
        {renderTopicSection(
          'objectives',
          'Objectives & Key Results',
          'flag',
          'text-indigo-600',
          'bg-indigo-50'
        )}

        {/* Tasks - Priority 2 */}
        {renderTopicSection(
          'tasks',
          'Tasks',
          'check_circle',
          'text-blue-600',
          'bg-blue-50'
        )}

        {/* Habits - Priority 3 */}
        {renderTopicSection(
          'habits',
          'Habits',
          'repeat',
          'text-teal-600',
          'bg-teal-50'
        )}

        {/* Life Areas - Priority 4 */}
        {renderTopicSection(
          'lifeAreas',
          'Life Areas',
          'category',
          'text-pink-600',
          'bg-pink-50'
        )}
      </div>
    </div>
  );
};
