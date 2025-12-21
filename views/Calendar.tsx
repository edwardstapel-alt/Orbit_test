import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { EntityType, View, Task, TimeSlot, Objective } from '../types';
import { TopNav } from '../components/TopNav';

interface CalendarProps {
  onEdit: (type: EntityType, id?: string, parentId?: string, context?: { objectiveId?: string; lifeAreaId?: string }) => void;
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onViewObjective?: (id: string) => void;
}

type CalendarView = 'week' | 'month';

export const Calendar: React.FC<CalendarProps> = ({ onEdit, onNavigate, onMenuClick, onProfileClick, onViewObjective }) => {
  const { 
    tasks, 
    timeSlots, 
    objectives,
    keyResults,
    habits,
    dayParts,
    updateTask,
    getTimeSlotsForDate,
    userProfile
  } = useData();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarView>('week');
  const [activeModal, setActiveModal] = useState<{ type: 'addTask', date?: string } | null>(null);

  // Get start of week (Monday)
  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get end of week (Sunday)
  const getEndOfWeek = (date: Date): Date => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  // Get all days in current week
  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Get all days in current month
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    // Add days from previous month to fill first week
    const startDay = firstDay.getDay();
    const adjustedStart = startDay === 0 ? 6 : startDay - 1; // Monday = 0
    for (let i = adjustedStart - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push(day);
    }
    
    // Add all days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month to fill last week
    const remaining = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }, [currentDate]);

  // Format date as YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = formatDateString(date);
    return tasks.filter(task => {
      if (task.scheduledDate) {
        return task.scheduledDate === dateStr;
      }
      return false;
    });
  };

  // Get time slots for a specific date (using context helper)
  const getTimeSlotsForDateLocal = (date: Date): TimeSlot[] => {
    const dateStr = formatDateString(date);
    return getTimeSlotsForDate(dateStr);
  };

  // Get objectives with deadlines in date range
  const getObjectivesInRange = (startDate: Date, endDate: Date): Objective[] => {
    return objectives.filter(obj => {
      if (!obj.startDate || !obj.endDate) return false;
      const objStart = new Date(obj.startDate);
      const objEnd = new Date(obj.endDate);
      // Check if objective overlaps with date range
      return (objStart <= endDate && objEnd >= startDate);
    });
  };

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Navigate to previous/next week or month
  const navigatePeriod = (offset: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (offset * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + offset);
    }
    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Check if date is in current month (for month view)
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  // Get display text for current period
  const getPeriodText = () => {
    if (viewMode === 'week') {
      const start = getStartOfWeek(currentDate);
      const end = getEndOfWeek(currentDate);
      const startStr = start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
      const endStr = end.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    } else {
      return currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title="Kalender"
        subtitle={getPeriodText()}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick} 
      />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 pt-6">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                viewMode === 'week'
                  ? 'bg-primary text-white'
                  : 'text-text-tertiary hover:text-text-main'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                viewMode === 'month'
                  ? 'bg-primary text-white'
                  : 'text-text-tertiary hover:text-text-main'
              }`}
            >
              Maand
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors text-sm"
          >
            Vandaag
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigatePeriod(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-text-tertiary">chevron_left</span>
          </button>
          
          <h2 className="text-lg font-bold text-text-main">
            {viewMode === 'week' ? 'Week Overzicht' : 'Maand Overzicht'}
          </h2>
          
          <button
            onClick={() => navigatePeriod(1)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>
        </div>

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="space-y-4">
            {weekDays.map((day, index) => {
              const dayTasks = getTasksForDate(day);
              const dayTimeSlots = getTimeSlotsForDateLocal(day);
              const dayStr = formatDateString(day);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl p-4 shadow-sm border ${
                    isTodayDate ? 'border-primary' : 'border-slate-100'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={`text-base font-bold ${isTodayDate ? 'text-primary' : 'text-text-main'}`}>
                        {day.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </h3>
                      {isTodayDate && (
                        <span className="text-xs font-bold text-primary uppercase">Vandaag</span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        localStorage.setItem('orbit_selectedDate', dayStr);
                        onNavigate(View.TODAY);
                      }}
                      className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-text-tertiary text-lg">open_in_new</span>
                    </button>
                  </div>

                  {/* Time Slots */}
                  {dayTimeSlots.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {dayTimeSlots
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map(slot => (
                          <div
                            key={slot.id}
                            onClick={() => onEdit('timeSlot', slot.id)}
                            className="p-3 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-all"
                            style={{ 
                              borderLeftColor: slot.color,
                              backgroundColor: `${slot.color}10`
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-text-main">{slot.title}</p>
                                <p className="text-xs text-text-secondary">
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-white text-text-tertiary">
                                {slot.type.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Tasks */}
                  {dayTasks.length > 0 ? (
                    <div className="space-y-2">
                      {dayTasks.map(task => {
                        const linkedObjective = task.objectiveId ? objectives.find(o => o.id === task.objectiveId) : null;
                        
                        return (
                          <div
                            key={task.id}
                            onClick={() => onEdit('task', task.id)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTask({ ...task, completed: !task.completed });
                              }}
                              className={`size-5 rounded-lg flex items-center justify-center shrink-0 ${
                                task.completed 
                                  ? 'bg-primary text-white' 
                                  : 'bg-white border-2 border-gray-300'
                              }`}
                            >
                              {task.completed && (
                                <span className="material-symbols-outlined text-xs">check</span>
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${task.completed ? 'line-through text-text-tertiary' : 'text-text-main'}`}>
                                {task.title}
                              </p>
                              {task.scheduledTime && (
                                <p className="text-xs text-text-tertiary">
                                  {formatTime(task.scheduledTime.split('-')[0])}
                                </p>
                              )}
                              {linkedObjective && (
                                <p className="text-xs text-text-tertiary">
                                  Goal: {linkedObjective.title}
                                </p>
                              )}
                            </div>
                            {task.priority && (
                              <span className="material-symbols-outlined text-primary text-sm shrink-0">flag</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary italic text-center py-4">
                      Geen tasks voor deze dag
                    </p>
                  )}

                  {/* Add Task Button */}
                  <button
                    onClick={() => {
                      localStorage.setItem('orbit_newTask_date', dayStr);
                      setActiveModal({ type: 'addTask', date: dayStr });
                    }}
                    className="w-full mt-3 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm font-medium text-text-secondary"
                  >
                    + Task toevoegen
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, index) => (
                <div key={index} className="text-center">
                  <span className="text-xs font-bold text-text-tertiary uppercase">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day, index) => {
                const dayTasks = getTasksForDate(day);
                const dayTimeSlots = getTimeSlotsForDateLocal(day);
                const dayObjectives = objectives.filter(obj => {
                  if (!obj.endDate) return false;
                  const objEnd = new Date(obj.endDate);
                  return isToday(objEnd) || (
                    objEnd.getDate() === day.getDate() &&
                    objEnd.getMonth() === day.getMonth() &&
                    objEnd.getFullYear() === day.getFullYear()
                  );
                });
                const isTodayDate = isToday(day);
                const isCurrentMonthDate = isCurrentMonth(day);
                const dayStr = formatDateString(day);

                return (
                  <div
                    key={index}
                    onClick={() => {
                      localStorage.setItem('orbit_selectedDate', dayStr);
                      onNavigate(View.TODAY);
                    }}
                    className={`min-h-[80px] p-2 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                      isTodayDate 
                        ? 'border-primary bg-primary/5' 
                        : isCurrentMonthDate
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-100 bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-bold mb-1 ${
                      isTodayDate 
                        ? 'text-primary' 
                        : isCurrentMonthDate
                          ? 'text-text-main'
                          : 'text-text-tertiary'
                    }`}>
                      {day.getDate()}
                    </div>

                    {/* Indicators */}
                    <div className="space-y-1">
                      {dayTasks.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-text-secondary">task</span>
                          <span className="text-xs text-text-secondary">{dayTasks.length}</span>
                        </div>
                      )}
                      {dayTimeSlots.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-text-secondary">schedule</span>
                          <span className="text-xs text-text-secondary">{dayTimeSlots.length}</span>
                        </div>
                      )}
                      {dayObjectives.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-primary">flag</span>
                          <span className="text-xs text-primary font-semibold">{dayObjectives.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Objectives Timeline (for month view) */}
        {viewMode === 'month' && (
          <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-text-main mb-4">Goals Deadlines</h3>
            <div className="space-y-2">
              {objectives
                .filter(obj => obj.endDate)
                .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
                .slice(0, 5)
                .map(obj => (
                  <div
                    key={obj.id}
                    onClick={() => onViewObjective && onViewObjective(obj.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-main">{obj.title}</p>
                      <p className="text-xs text-text-tertiary">
                        Deadline: {new Date(obj.endDate!).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                      obj.status === 'On Track' ? 'bg-green-100 text-green-700' :
                      obj.status === 'At Risk' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {obj.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
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
                  if (activeModal.date) {
                    localStorage.setItem('orbit_newTask_date', activeModal.date);
                  }
                  onEdit('task', undefined, undefined, {});
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

