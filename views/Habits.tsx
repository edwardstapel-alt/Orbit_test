import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { View } from '../types';
import { TopNav } from '../components/TopNav';
import { calculateCompletionRate } from '../utils/habitAnalytics';
import { useSelection } from '../context/SelectionContext';
import { useLongPress } from '../hooks/useLongPress';
import { MultiSelectToolbar } from '../components/MultiSelectToolbar';

interface HabitsProps {
  onNavigate: (view: View, habitId?: string) => void;
  onEdit: (type: 'habit', id?: string) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onBack?: () => void;
}

export const Habits: React.FC<HabitsProps> = ({ onNavigate, onEdit, onMenuClick, onProfileClick, onBack }) => {
  const { habits, objectives, lifeAreas, deleteHabit } = useData();
  
  const {
    isSelectMode,
    enterSelectMode,
    exitSelectMode,
    toggleSelection,
    isSelected,
    getSelectedCount,
    getSelectedIds,
    clearSelection
  } = useSelection();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const isHabitSelectMode = isSelectMode.get('habit') || false;

  const handleHabitsDelete = (habitIds: string[]) => {
    habitIds.forEach(id => deleteHabit(id));
    clearSelection('habit');
    exitSelectMode('habit');
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    habits.forEach(habit => {
      if (habit.category) {
        cats.add(habit.category);
      }
    });
    return Array.from(cats).sort();
  }, [habits]);

  // Filter habits
  const filteredHabits = useMemo(() => {
    return habits.filter(habit => {
      // Status filter
      if (filter === 'active' && habit.completed) return false;
      if (filter === 'completed' && !habit.completed) return false;

      // Category filter
      if (categoryFilter !== 'all' && habit.category !== categoryFilter) return false;

      // Search filter
      if (searchTerm && !habit.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [habits, filter, categoryFilter, searchTerm]);

  const handleHabitClick = (habitId: string) => {
    if (isHabitSelectMode) {
      toggleSelection('habit', habitId);
    } else {
      onNavigate(View.HABIT_DETAIL, habitId);
    }
  };

  const handleHabitLongPress = (habitId: string) => {
    if (!isHabitSelectMode) {
      enterSelectMode('habit');
      toggleSelection('habit', habitId);
    }
  };

  const handleHabitEdit = (habitId: string) => {
    exitSelectMode('habit');
    onEdit('habit', habitId);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-green-600';
    if (streak >= 7) return 'text-blue-600';
    return 'text-amber-600';
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title="Habits" 
        subtitle="Track Your Daily Routines" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onBack={onBack}
        showBack={!!onBack}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-8 px-6 md:px-12 lg:px-16 pt-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate(View.HABIT_TEMPLATES)}
                className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm font-semibold text-text-main hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                Templates
              </button>
              <button
                onClick={() => onNavigate(View.HABIT_ANALYTICS)}
                className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm font-semibold text-text-main hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">analytics</span>
                Analytics
              </button>
            </div>
            <button
              onClick={() => onEdit('habit')}
              className="px-4 py-2 bg-primary text-white rounded-xl shadow-md hover:bg-primary-soft transition-colors text-sm font-bold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Habit
            </button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xl">search</span>
              <input
                type="text"
                placeholder="Search habits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-100 focus:border-primary focus:outline-none text-text-main placeholder:text-text-tertiary"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === 'active'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === 'completed'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      categoryFilter === category
                        ? 'bg-primary text-white'
                        : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Habits List */}
          {filteredHabits.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">repeat</span>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">No Habits Found</h3>
              <p className="text-sm text-text-secondary mb-4">
                {habits.length === 0
                  ? "Create your first habit to start building positive routines."
                  : "No habits match your current filters."}
              </p>
              <button 
                onClick={() => onEdit('habit')}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors"
              >
                Create Habit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHabits.map((habit) => {
                const completionRate = calculateCompletionRate(habit, 30);
                const linkedObjectives = objectives.filter(obj => 
                  obj.habits?.includes(habit.id)
                );
                const habitIsSelected = isSelected('habit', habit.id);

                const longPressHandlers = useLongPress({
                  onLongPress: () => handleHabitLongPress(habit.id),
                  onClick: () => handleHabitClick(habit.id),
                });

                return (
                  <div
                    key={habit.id}
                    className={`bg-white rounded-3xl shadow-sm border-2 overflow-hidden group cursor-pointer hover:shadow-md transition-all ${
                      habitIsSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-slate-100'
                    }`}
                    {...longPressHandlers}
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Selection Checkbox */}
                          {isHabitSelectMode && (
                            <div className="shrink-0">
                              <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                habitIsSelected 
                                  ? 'bg-primary border-primary' 
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {habitIsSelected && (
                                  <span className="material-symbols-outlined text-white text-sm">check</span>
                                )}
                              </div>
                            </div>
                          )}
                          <div 
                            className="size-12 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: habit.color ? `${habit.color}20` : '#F3F4F6' }}
                          >
                            <span 
                              className="material-symbols-outlined text-2xl"
                              style={{ color: habit.color || '#6B7280' }}
                            >
                              {habit.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-text-main truncate group-hover:text-primary transition-colors">
                              {habit.name}
                            </h3>
                            {habit.category && (
                              <span className="text-xs font-semibold text-text-tertiary mt-0.5 block">
                                {habit.category}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isHabitSelectMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit('habit', habit.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-text-tertiary text-xl">more_vert</span>
                          </button>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="space-y-3">
                        {/* Streak */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-lg">local_fire_department</span>
                            <span className={`text-sm font-bold ${getStreakColor(habit.streak || 0)}`}>
                              {habit.streak || 0} day streak
                            </span>
                          </div>
                          {habit.longestStreak && habit.longestStreak > (habit.streak || 0) && (
                            <span className="text-xs text-text-tertiary">
                              Best: {habit.longestStreak}
                            </span>
                          )}
                        </div>

                        {/* Completion Rate */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-text-tertiary">30-day completion</span>
                            <span className="text-xs font-bold text-text-main">{completionRate}%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${completionRate}%`,
                                backgroundColor: habit.color || '#D95829'
                              }}
                            />
                          </div>
                        </div>

                        {/* Linked Objectives */}
                        {linkedObjectives.length > 0 && (
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <span className="material-symbols-outlined text-text-tertiary text-sm">link</span>
                            <span className="text-xs text-text-tertiary">
                              Linked to {linkedObjectives.length} objective{linkedObjectives.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        {/* Time */}
                        {habit.time && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-tertiary text-sm">schedule</span>
                            <span className="text-xs text-text-tertiary">{habit.time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Multi-Select Toolbar */}
      {isHabitSelectMode && (
        <MultiSelectToolbar
          entityType="habit"
          onDelete={handleHabitsDelete}
          onEdit={getSelectedCount('habit') === 1 ? () => handleHabitEdit(getSelectedIds('habit')[0]) : undefined}
          onCancel={() => {
            exitSelectMode('habit');
            clearSelection('habit');
          }}
          entityName="Habit"
          entityNamePlural="Habits"
        />
      )}
    </div>
  );
};

