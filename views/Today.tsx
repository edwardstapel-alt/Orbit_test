import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { EntityType, View, Task, Habit, TimeSlot } from '../types';
import { TopNav } from '../components/TopNav';
import { EntityFilter, FilterState } from '../components/EntityFilter';
import { recordHabitCompletion, recordHabitMiss } from '../utils/habitHistory';

interface TodayProps {
  onEdit: (type: EntityType, id?: string, parentId?: string, context?: { objectiveId?: string; lifeAreaId?: string }) => void;
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const Today: React.FC<TodayProps> = ({ onEdit, onNavigate, onMenuClick, onProfileClick }) => {
  const { 
    tasks, 
    habits, 
    timeSlots, 
    dayParts, 
    objectives,
    keyResults,
    lifeAreas,
    friends,
    updateTask, 
    updateHabit,
    updateKeyResult,
    getTimeSlotsForDate,
    userProfile
  } = useData();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeModal, setActiveModal] = useState<{ type: 'addTask', dayPartId?: string } | null>(null);
  const [filters, setFilters] = useState<FilterState>({});

  // Format date as YYYY-MM-DD
  const todayString = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Get tasks for today with filters
  const todayTasks = useMemo(() => {
    return tasks.filter(task => {
      // Task is for today if:
      // 1. It has scheduledDate matching today
      // 2. Or it has no scheduledDate (show all unscheduled tasks)
      let matchesDate = false;
      if (task.scheduledDate) {
        matchesDate = task.scheduledDate === todayString;
      } else {
        // Show unscheduled tasks in "All Day" section
        matchesDate = !task.completed;
      }

      if (!matchesDate) return false;

      // Apply entity filters
      if (filters.lifeAreaId && task.lifeAreaId !== filters.lifeAreaId) return false;
      if (filters.objectiveId && task.objectiveId !== filters.objectiveId) return false;
      if (filters.keyResultId && task.keyResultId !== filters.keyResultId) return false;
      
      // Link status filters
      if (filters.showLinkedOnly) {
        if (!task.lifeAreaId && !task.objectiveId && !task.keyResultId) return false;
      }
      if (filters.showUnlinkedOnly) {
        if (task.lifeAreaId || task.objectiveId || task.keyResultId) return false;
      }
      
      return true;
    });
  }, [tasks, todayString, filters]);

  // Get habits for today with filters
  const todayHabits = useMemo(() => {
    return habits.filter(habit => {
      // Apply entity filters
      if (filters.lifeAreaId && habit.lifeAreaId !== filters.lifeAreaId) return false;
      if (filters.objectiveId && habit.objectiveId !== filters.objectiveId) return false;
      if (filters.keyResultId && habit.linkedKeyResultId !== filters.keyResultId) return false;
      
      // Link status filters
      if (filters.showLinkedOnly) {
        if (!habit.lifeAreaId && !habit.objectiveId && !habit.linkedKeyResultId) return false;
      }
      if (filters.showUnlinkedOnly) {
        if (habit.lifeAreaId || habit.objectiveId || habit.linkedKeyResultId) return false;
      }
      
      return true;
    });
  }, [habits, filters]);

  // Get time slots for today
  const todayTimeSlots = useMemo(() => {
    return getTimeSlotsForDate(todayString);
  }, [timeSlots, todayString, getTimeSlotsForDate]);

  // Sort day parts by order
  const sortedDayParts = useMemo(() => {
    return [...dayParts].sort((a, b) => a.order - b.order);
  }, [dayParts]);

  // Group tasks by day part
  const tasksByDayPart = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    
    sortedDayParts.forEach(part => {
      grouped[part.id] = [];
    });
    
    todayTasks.forEach(task => {
      if (task.dayPart) {
        const part = sortedDayParts.find(p => p.name === task.dayPart);
        if (part) {
          grouped[part.id].push(task);
        } else {
          // Fallback to "All Day"
          const allDayPart = sortedDayParts.find(p => p.id === 'all-day');
          if (allDayPart) {
            grouped[allDayPart.id].push(task);
          }
        }
      } else {
        // Tasks without day part go to "All Day"
        const allDayPart = sortedDayParts.find(p => p.id === 'all-day');
        if (allDayPart) {
          grouped[allDayPart.id].push(task);
        }
      }
    });
    
    return grouped;
  }, [todayTasks, sortedDayParts]);

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Toggle task completion
  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask({ ...task, completed: !task.completed });
    }
  };

  // Check if selected date is in the future
  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  // Calculate streak from weeklyProgress array
  // Assumes weeklyProgress[0] is today, weeklyProgress[1] is yesterday, etc.
  const calculateStreak = (weeklyProgress: boolean[]): number => {
    if (!weeklyProgress || weeklyProgress.length === 0) return 0;
    
    let streak = 0;
    // Count consecutive completed days starting from today (index 0)
    for (let i = 0; i < weeklyProgress.length; i++) {
      if (weeklyProgress[i]) {
        streak++;
      } else {
        break; // Stop at first uncompleted day
      }
    }
    return streak;
  };

  // Toggle habit for selected date
  const toggleHabit = (habitId: string) => {
    // Prevent toggling habits for future dates
    if (isFutureDate(selectedDate)) {
      return;
    }

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const dateStr = todayString;
    const monthlyHistory = habit.monthlyHistory || {};
    const isCompleted = monthlyHistory[dateStr] === true;

    // Use extended history tracking
    const updated = isCompleted
      ? recordHabitMiss(habit, dateStr)
      : recordHabitCompletion(habit, dateStr);

    // Also update weeklyProgress for backward compatibility
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateNormalized = new Date(selectedDate);
    selectedDateNormalized.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - selectedDateNormalized.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 0 && daysDiff < 7) {
      const newHistory = [...(updated.weeklyProgress || [false, false, false, false, false, false, false])];
      newHistory[daysDiff] = !isCompleted;
      updated.weeklyProgress = newHistory;
    }

    // Update Key Result progress if habit is linked and has contribution value
    // Only update if this is today
    const isSelectedDateToday = daysDiff === 0;
    if (isSelectedDateToday && habit.linkedKeyResultId && habit.progressContribution && habit.progressContribution > 0) {
      const keyResult = keyResults.find(kr => kr.id === habit.linkedKeyResultId);
      if (keyResult) {
        const contribution = habit.progressContribution;
        let newCurrent = keyResult.current;
        
        if (!isCompleted) {
          // Habit was just completed - add contribution
          newCurrent = Math.min(keyResult.current + contribution, keyResult.target);
        } else {
          // Habit was uncompleted - subtract contribution
          newCurrent = Math.max(keyResult.current - contribution, 0);
        }
        
        if (newCurrent !== keyResult.current) {
          updateKeyResult({
            ...keyResult,
            current: newCurrent
          });
        }
      }
    }

    updateHabit(updated);
  };

  // Navigate to previous/next day
  const changeDay = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const displayDate = selectedDate.toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title={isToday(selectedDate) ? "Vandaag" : displayDate}
        subtitle={isToday(selectedDate) ? displayDate : ""}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick} 
      />

      {/* View Mode Toggle */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-end gap-2">
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-primary text-white"
          >
            <span className="material-symbols-outlined text-sm align-middle mr-1">list</span>
            List
          </button>
          <button
            onClick={() => onNavigate(View.CALENDAR)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-gray-100 text-text-tertiary hover:bg-gray-200"
          >
            <span className="material-symbols-outlined text-sm align-middle mr-1">calendar_month</span>
            Calendar
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 pt-6">
        {/* Entity Filter - Compact Icon Toggles */}
            <div className="mb-3">
              <EntityFilter
                entityType="task"
                filters={filters}
                onFiltersChange={setFilters}
                showLinkedOnly={true}
                showUnlinkedOnly={true}
              />
            </div>

            {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => changeDay(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-text-tertiary">chevron_left</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors text-sm"
            >
              Vandaag
            </button>
          </div>
          
          <button
            onClick={() => changeDay(1)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>
        </div>

        {/* Habits Section */}
        {todayHabits.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-text-main mb-4">Habits</h2>
            <div className="space-y-2">
              {todayHabits.map(habit => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDateNormalized = new Date(selectedDate);
                selectedDateNormalized.setHours(0, 0, 0, 0);
                
                // Calculate days difference between selected date and today
                const daysDiff = Math.floor((today.getTime() - selectedDateNormalized.getTime()) / (1000 * 60 * 60 * 24));
                
                // Check if habit is completed for selected date
                // weeklyProgress[0] = today, weeklyProgress[1] = yesterday, etc.
                const isCompleted = (daysDiff >= 0 && daysDiff < 7) 
                  ? (habit.weeklyProgress?.[daysDiff] || false)
                  : false;
                const isFuture = isFutureDate(selectedDate);
                
                return (
                  <div
                    key={habit.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
                    onClick={() => onEdit('habit', habit.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isFuture) {
                          toggleHabit(habit.id);
                        }
                      }}
                      disabled={isFuture}
                      className={`size-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                        isFuture 
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50' 
                          : isCompleted 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-text-tertiary hover:bg-gray-200'
                      }`}
                    >
                      {isCompleted && (
                        <span className="material-symbols-outlined text-lg">check</span>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-main">{habit.name}</p>
                      {habit.streak > 0 && (
                        <p className="text-xs text-text-tertiary">🔥 {habit.streak} day streak</p>
                      )}
                    </div>
                    {habit.linkedKeyResultId && (
                      <span className="material-symbols-outlined text-text-tertiary text-sm">link</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Time Slots Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-main">Time Blocks</h2>
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                onEdit('timeSlot', undefined, undefined, {});
                // Set default date in localStorage for the editor
                localStorage.setItem('orbit_newTimeSlot_date', todayString);
              }}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-text-tertiary text-lg">add</span>
            </button>
          </div>
          
          {todayTimeSlots.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center">
              <p className="text-sm text-text-tertiary mb-3">Geen time blocks voor deze dag</p>
              <button
                onClick={() => {
                  onEdit('timeSlot', undefined, undefined, {});
                  localStorage.setItem('orbit_newTimeSlot_date', todayString);
                }}
                className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors text-sm"
              >
                Time Block toevoegen
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTimeSlots
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(slot => {
                  const objective = slot.objectiveId ? objectives.find(o => o.id === slot.objectiveId) : null;
                  const lifeArea = slot.lifeAreaId ? lifeAreas.find(la => la.id === slot.lifeAreaId) : null;
                  
                  return (
                    <div
                      key={slot.id}
                      onClick={() => onEdit('timeSlot', slot.id)}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
                      style={{ borderLeft: `4px solid ${slot.color}` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-text-main mb-1">{slot.title}</h3>
                          <p className="text-xs text-text-secondary">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-gray-100 text-text-tertiary">
                          {slot.type.replace('-', ' ')}
                        </span>
                      </div>
                      {objective && (
                        <p className="text-xs text-text-tertiary">Goal: {objective.title}</p>
                      )}
                      {lifeArea && (
                        <p className="text-xs text-text-tertiary">Life Area: {lifeArea.name}</p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* Dagdelen met Tasks */}
        {sortedDayParts.map(dayPart => {
          const partTasks = tasksByDayPart[dayPart.id] || [];
          const hasContent = partTasks.length > 0;
          
          // Skip lege dagdelen (behalve All Day als die tasks heeft)
          if (!hasContent && dayPart.id !== 'all-day') {
            return null;
          }

          return (
            <section key={dayPart.id} className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-main">{dayPart.name}</h2>
                  {dayPart.startTime && dayPart.endTime && (
                    <p className="text-xs text-text-tertiary">
                      {formatTime(dayPart.startTime)} - {formatTime(dayPart.endTime)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setActiveModal({ type: 'addTask', dayPartId: dayPart.id })}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-text-tertiary text-lg">add</span>
                </button>
              </div>

              {partTasks.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center">
                  <p className="text-sm text-text-tertiary mb-3">Geen tasks voor {dayPart.name}</p>
                  <button
                    onClick={() => setActiveModal({ type: 'addTask', dayPartId: dayPart.id })}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors text-sm"
                  >
                    Add Task
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {partTasks.map(task => {
                    const linkedObjective = task.objectiveId ? objectives.find(o => o.id === task.objectiveId) : null;
                    const linkedLifeArea = task.lifeAreaId ? lifeAreas.find(la => la.id === task.lifeAreaId) : null;
                    
                    return (
                      <div
                        key={task.id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-start gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group"
                        onClick={() => onEdit('task', task.id)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id);
                          }}
                          className={`size-6 rounded-lg flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                            task.completed 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-100 text-text-tertiary hover:bg-gray-200'
                          }`}
                        >
                          {task.completed && (
                            <span className="material-symbols-outlined text-sm">check</span>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold text-text-main ${task.completed ? 'line-through text-text-tertiary' : ''}`}>
                            {task.title}
                          </p>
                          {task.scheduledTime && (
                            <p className="text-xs text-text-tertiary mt-1">
                              {formatTime(task.scheduledTime.split('-')[0])}
                              {task.scheduledTime.includes('-') && ` - ${formatTime(task.scheduledTime.split('-')[1])}`}
                            </p>
                          )}
                          {(linkedObjective || linkedLifeArea || task.friendId) && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {linkedLifeArea && (
                                <span 
                                  className="material-symbols-outlined text-xs"
                                  style={{ color: linkedLifeArea.color }}
                                  title={linkedLifeArea.name}
                                >
                                  {linkedLifeArea.icon}
                                </span>
                              )}
                              {linkedObjective && (
                                <span className="text-xs text-text-tertiary">
                                  {linkedObjective.title}
                                </span>
                              )}
                              {task.friendId && (() => {
                                const friend = friends.find(f => f.id === task.friendId);
                                return friend ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                    {friend.image ? (
                                      <img 
                                        src={friend.image} 
                                        alt={friend.name}
                                        className="size-4 rounded-full object-cover border border-primary/20"
                                      />
                                    ) : (
                                      <span className="material-symbols-outlined text-[12px]">person</span>
                                    )}
                                    {friend.name}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                        {task.priority && (
                          <span className="material-symbols-outlined text-primary text-sm shrink-0">flag</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

      </main>

      {/* Add Task Modal */}
      {activeModal?.type === 'addTask' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-md bg-background rounded-t-3xl shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
            <div className="sticky top-0 bg-background border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">Add Task</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-text-tertiary">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <button
                onClick={() => {
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  localStorage.setItem('orbit_newTask_date', dateStr);
                  if (activeModal.dayPartId) {
                    const dayPart = dayParts.find(dp => dp.id === activeModal.dayPartId);
                    onEdit('task', undefined, undefined, { 
                      lifeAreaId: undefined,
                      dayPart: dayPart?.name
                    });
                  } else {
                    onEdit('task', undefined, undefined, { lifeAreaId: undefined });
                  }
                  setActiveModal(null);
                }}
                className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-primary">add</span>
                <span className="font-semibold text-primary">Create New Task</span>
              </button>
              
              {tasks.length > 0 && (
                <>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing Task</h4>
                  </div>
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setActiveModal(null);
                          onEdit('task', task.id);
                        }}
                        className="w-full p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-primary/30 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-text-main mb-1">{task.title}</h5>
                            <div className="flex items-center gap-2">
                              {task.tag && (
                                <span className="text-xs text-text-tertiary">{task.tag}</span>
                              )}
                              {task.time && (
                                <>
                                  {task.tag && <span className="text-text-tertiary">•</span>}
                                  <span className="text-xs text-text-tertiary">{task.time}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-text-tertiary ml-2">chevron_right</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">task_alt</span>
                  <p className="text-sm text-text-tertiary">No tasks available</p>
                  <p className="text-xs text-text-tertiary mt-1">Create a new task to get started</p>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-background border-t border-gray-200 px-6 py-4">
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

