import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { View } from '../types';
import { TopNav } from '../components/TopNav';
import { calculateHabitAnalytics, getHabitInsights } from '../utils/habitAnalytics';
import { getCompletionRate } from '../utils/habitHistory';

interface HabitAnalyticsProps {
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onBack?: () => void;
}

export const HabitAnalytics: React.FC<HabitAnalyticsProps> = ({
  onNavigate,
  onMenuClick,
  onProfileClick,
  onBack,
}) => {
  const { habits } = useData();

  // Calculate analytics for all habits
  const allAnalytics = useMemo(() => {
    return habits.map(habit => ({
      habit,
      analytics: calculateHabitAnalytics(habit, habits),
      insights: getHabitInsights(calculateHabitAnalytics(habit, habits)),
    }));
  }, [habits]);

  // Sort by completion rate (30 days)
  const sortedAnalytics = [...allAnalytics].sort(
    (a, b) => b.analytics.completionRate30Days - a.analytics.completionRate30Days
  );

  // Overall stats
  const overallStats = useMemo(() => {
    const totalHabits = habits.length;
    const activeHabits = habits.filter(h => h.streak > 0).length;
    const avgCompletionRate = allAnalytics.reduce(
      (sum, a) => sum + a.analytics.completionRate30Days,
      0
    ) / (totalHabits || 1);
    const totalCompletions = habits.reduce(
      (sum, h) => sum + (h.totalCompletions || 0),
      0
    );
    const avgStreak = habits.reduce((sum, h) => sum + h.streak, 0) / (totalHabits || 1);

    return {
      totalHabits,
      activeHabits,
      avgCompletionRate,
      totalCompletions,
      avgStreak,
    };
  }, [habits, allAnalytics]);

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-32 lg:pb-8">
      <TopNav
        title="Habit Analytics"
        subtitle={`${overallStats.activeHabits} actieve habits`}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onBack={onBack}
        showBack={!!onBack}
      />

      {/* Overall Stats */}
      <div className="px-6 md:px-12 lg:px-16 py-6 bg-white border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 rounded-xl p-4">
            <div className="text-xs text-text-tertiary mb-1">Totaal Habits</div>
            <div className="text-2xl font-bold text-primary">{overallStats.totalHabits}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-xs text-text-tertiary mb-1">Actief</div>
            <div className="text-2xl font-bold text-green-600">{overallStats.activeHabits}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-xs text-text-tertiary mb-1">Gem. Completion</div>
            <div className="text-2xl font-bold text-blue-600">{(overallStats.avgCompletionRate * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="text-xs text-text-tertiary mb-1">Totaal Completions</div>
            <div className="text-2xl font-bold text-purple-600">{overallStats.totalCompletions}</div>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="px-6 md:px-12 lg:px-16 py-6">
        <h2 className="text-xl font-bold text-text-main mb-4">Alle Habits</h2>
        <div className="space-y-4">
          {sortedAnalytics.map(({ habit, analytics, insights }) => (
            <div
              key={habit.id}
              onClick={() => onNavigate(View.HABIT_DETAIL)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="size-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: habit.color ? `${habit.color}20` : '#f3f4f6' }}
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ color: habit.color || '#6b7280' }}
                    >
                      {habit.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-main">{habit.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-primary font-bold">🔥 {habit.streak} days</span>
                      {habit.category && (
                        <span className="text-xs text-text-tertiary bg-gray-100 px-2 py-0.5 rounded">
                          {habit.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-text-tertiary mb-1">30-Day Rate</div>
                  <div className="text-sm font-bold text-text-main">
                    {(analytics.completionRate30Days * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">Trend</div>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm ${
                      analytics.completionTrend === 'increasing' ? 'text-green-500' :
                      analytics.completionTrend === 'decreasing' ? 'text-red-500' :
                      'text-gray-500'
                    }`}>
                      {analytics.completionTrend === 'increasing' ? '📈' :
                       analytics.completionTrend === 'decreasing' ? '📉' : '➡️'}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {analytics.trendPercentage > 0 ? '+' : ''}{analytics.trendPercentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">Longest Streak</div>
                  <div className="text-sm font-bold text-text-main">{analytics.longestStreak}</div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">Per Week</div>
                  <div className="text-sm font-bold text-text-main">
                    {analytics.averageCompletionsPerWeek.toFixed(1)}x
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-text-tertiary mb-1">
                  <span>Completion Rate (30 dagen)</span>
                  <span>{(analytics.completionRate30Days * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${analytics.completionRate30Days * 100}%` }}
                  />
                </div>
              </div>

              {/* Top Insight */}
              {insights.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-text-tertiary mb-1">Top Inzicht</div>
                  <div className="text-sm text-text-main">{insights[0]}</div>
                </div>
              )}
            </div>
          ))}

          {sortedAnalytics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-tertiary">Nog geen habits om te analyseren.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

