import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Habit, View } from '../types';
import { TopNav } from '../components/TopNav';
import { 
  recordHabitCompletion, 
  recordHabitMiss, 
  getCompletionRate, 
  getBestDayOfWeek,
  getStreakMilestones,
  exportHabitHistory
} from '../utils/habitHistory';
import { 
  calculateHabitAnalytics, 
  getHabitInsights 
} from '../utils/habitAnalytics';

interface HabitDetailProps {
  habitId: string;
  onBack: () => void;
  onEdit?: () => void;
  onNavigate?: (view: View) => void;
}

export const HabitDetail: React.FC<HabitDetailProps> = ({ 
  habitId, 
  onBack, 
  onEdit,
  onNavigate 
}) => {
  const { habits, updateHabit } = useData();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'overview' | 'history' | 'analytics'>('overview');

  const habit = habits.find(h => h.id === habitId);

  if (!habit) {
    return (
      <div className="flex flex-col w-full h-full">
        <TopNav title="Habit niet gevonden" onMenuClick={onBack} onProfileClick={() => {}} />
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-text-tertiary">Deze habit bestaat niet meer.</p>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const analytics = useMemo(() => {
    return calculateHabitAnalytics(habit, habits);
  }, [habit, habits]);

  const insights = useMemo(() => {
    return getHabitInsights(analytics);
  }, [analytics]);

  // Get completion rate for different periods
  const completionRate30 = getCompletionRate(habit, 30);
  const completionRate90 = getCompletionRate(habit, 90);
  const bestDay = getBestDayOfWeek(habit);
  const milestones = getStreakMilestones(habit);

  const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

  // Generate calendar view for selected month
  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: Array<{ date: number; completed: boolean; isToday: boolean; dateStr: string }> = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: 0, completed: false, isToday: false, dateStr: '' });
    }

    // Days of the month
    const today = new Date();
    const monthlyHistory = habit.monthlyHistory || {};
    
    for (let date = 1; date <= daysInMonth; date++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const isToday = today.getFullYear() === year && 
                     today.getMonth() === month && 
                     today.getDate() === date;
      const completed = monthlyHistory[dateStr] === true;
      
      days.push({ date, completed, isToday, dateStr });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Handle completion toggle
  const handleToggleCompletion = (dateStr: string) => {
    const monthlyHistory = habit.monthlyHistory || {};
    const isCompleted = monthlyHistory[dateStr] === true;
    
    const updated = isCompleted
      ? recordHabitMiss(habit, dateStr)
      : recordHabitCompletion(habit, dateStr);
    
    updateHabit(updated);
  };

  // Export history
  const handleExport = () => {
    const exportData = exportHabitHistory(habit);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-${habit.name}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-32">
      <TopNav 
        title={habit.name}
        subtitle={`🔥 ${habit.streak} day streak`}
        onMenuClick={() => {}}
        onProfileClick={() => {}}
        onBack={onBack}
        showBack={true}
      />

      {/* Header Stats */}
      <div className="px-6 md:px-12 lg:px-16 py-6 bg-white border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 rounded-xl p-4">
            <div className="text-xs text-text-tertiary mb-1">Current Streak</div>
            <div className="text-2xl font-bold text-primary">{habit.streak}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-xs text-text-tertiary mb-1">Longest Streak</div>
            <div className="text-2xl font-bold text-green-600">{habit.longestStreak || habit.streak}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-xs text-text-tertiary mb-1">30-Day Rate</div>
            <div className="text-2xl font-bold text-blue-600">{(completionRate30 * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="text-xs text-text-tertiary mb-1">Total</div>
            <div className="text-2xl font-bold text-purple-600">{habit.totalCompletions || 0}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Bewerken
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Export History
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="px-6 md:px-12 lg:px-16 py-4 bg-white border-b">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'overview'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-main hover:bg-gray-200'
            }`}
          >
            Overzicht
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'history'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-main hover:bg-gray-200'
            }`}
          >
            Geschiedenis
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'analytics'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-main hover:bg-gray-200'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-12 lg:px-16 py-6">
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {/* Insights */}
            {insights.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-text-main mb-4">Inzichten</h3>
                <div className="space-y-2">
                  {insights.map((insight, index) => (
                    <div key={index} className="text-sm text-text-main bg-gray-50 rounded-lg p-3">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-text-main mb-4">Statistieken</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-text-tertiary mb-1">Meest consistente dag</div>
                  <div className="text-sm font-bold text-text-main">{dayNames[bestDay]}</div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">90-dagen rate</div>
                  <div className="text-sm font-bold text-text-main">{(completionRate90 * 100).toFixed(0)}%</div>
                </div>
                {analytics.bestTimeOfDay && (
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Beste tijd</div>
                    <div className="text-sm font-bold text-text-main">{analytics.bestTimeOfDay}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-text-tertiary mb-1">Gemiddeld per week</div>
                  <div className="text-sm font-bold text-text-main">{analytics.averageCompletionsPerWeek.toFixed(1)}x</div>
                </div>
              </div>
            </div>

            {/* Streak Milestones */}
            {milestones.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-text-main mb-4">Behaalde Milestones</h3>
                <div className="flex gap-2 flex-wrap">
                  {milestones.map(milestone => (
                    <div
                      key={milestone}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold"
                    >
                      {milestone} dagen
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Calendar Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-text-main mb-4">
                {selectedMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(day => (
                  <div key={day} className="text-xs text-text-tertiary text-center font-bold py-2">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                      day.date === 0
                        ? 'bg-transparent'
                        : day.isToday
                        ? 'bg-primary text-white ring-2 ring-primary'
                        : day.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-text-tertiary hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      if (day.dateStr) {
                        handleToggleCompletion(day.dateStr);
                      }
                    }}
                    style={{ cursor: day.dateStr ? 'pointer' : 'default' }}
                  >
                    {day.date > 0 && day.date}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'history' && (
          <div className="space-y-6">
            {/* Month Selector */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-main">Geschiedenis</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedMonth(newDate);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Vorige
                  </button>
                  <button
                    onClick={() => setSelectedMonth(new Date())}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Huidige
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedMonth(newDate);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Volgende
                  </button>
                </div>
              </div>

              {/* Calendar */}
              <div className="grid grid-cols-7 gap-1">
                {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(day => (
                  <div key={day} className="text-xs text-text-tertiary text-center font-bold py-2">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                      day.date === 0
                        ? 'bg-transparent'
                        : day.isToday
                        ? 'bg-primary text-white ring-2 ring-primary'
                        : day.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-text-tertiary hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      if (day.dateStr) {
                        handleToggleCompletion(day.dateStr);
                      }
                    }}
                    style={{ cursor: day.dateStr ? 'pointer' : 'default' }}
                  >
                    {day.date > 0 && day.date}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Completions */}
            {habit.completionHistory && habit.completionHistory.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-text-main mb-4">Recente Completions</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {habit.completionHistory.slice(0, 20).map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="text-sm font-medium text-text-main">
                          {new Date(record.date).toLocaleDateString('nl-NL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        {record.timeOfDay && (
                          <div className="text-xs text-text-tertiary">Om {record.timeOfDay}</div>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-green-500">check_circle</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="space-y-6">
            {/* Trend */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-text-main mb-4">Trend</h3>
              <div className="flex items-center gap-4">
                <div className={`text-2xl ${analytics.completionTrend === 'increasing' ? 'text-green-500' : analytics.completionTrend === 'decreasing' ? 'text-red-500' : 'text-gray-500'}`}>
                  {analytics.completionTrend === 'increasing' ? '📈' : analytics.completionTrend === 'decreasing' ? '📉' : '➡️'}
                </div>
                <div>
                  <div className="text-sm font-bold text-text-main">
                    {analytics.completionTrend === 'increasing' ? 'Stijgend' : analytics.completionTrend === 'decreasing' ? 'Dalend' : 'Stabiel'}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {analytics.trendPercentage > 0 ? '+' : ''}{analytics.trendPercentage.toFixed(1)}% verandering
                  </div>
                </div>
              </div>
            </div>

            {/* Patterns */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-text-main mb-4">Patronen</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-text-tertiary mb-2">Weekday vs Weekend</div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-main mb-1">Weekdagen</div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${analytics.weekdayCompletionRate * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-text-tertiary mt-1">
                        {(analytics.weekdayCompletionRate * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-main mb-1">Weekend</div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${analytics.weekendCompletionRate * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-text-tertiary mt-1">
                        {(analytics.weekendCompletionRate * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Correlations */}
            {analytics.correlatedHabits && analytics.correlatedHabits.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-text-main mb-4">Gecorreleerde Habits</h3>
                <div className="space-y-3">
                  {analytics.correlatedHabits.map(correlation => (
                    <div key={correlation.habitId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-main">{correlation.habitName}</div>
                        <div className="text-xs text-text-tertiary">
                          {(correlation.correlationScore * 100).toFixed(0)}% van de tijd samen gedaan
                        </div>
                      </div>
                      <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${correlation.correlationScore * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

