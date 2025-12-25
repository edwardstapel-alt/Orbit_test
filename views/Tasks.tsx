import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { EntityType, View } from '../types';
import { TopNav } from '../components/TopNav';
import { EntityFilter, FilterState } from '../components/EntityFilter';
import { useSelection } from '../context/SelectionContext';
import { useLongPress } from '../hooks/useLongPress';
import { SwipeableTask } from '../components/SwipeableTask';
import { MultiSelectToolbar } from '../components/MultiSelectToolbar';

interface TasksProps {
  onEdit: (type: EntityType, id?: string) => void;
  onNavigate?: (view: View) => void; 
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const Tasks: React.FC<TasksProps> = ({ onEdit, onNavigate, onMenuClick, onProfileClick }) => {
  const { 
    tasks, 
    habits, 
    friends, 
    updateTask, 
    updateHabit, 
    addTask, 
    keyResults, 
    updateKeyResult,
    deleteTask,
    archiveTask,
    deleteHabit
  } = useData();
  
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

  const [activeModal, setActiveModal] = useState<'addTask' | 'addHabit' | null>(null);
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [filters, setFilters] = useState<FilterState>({});
  
  const isTaskSelectMode = isSelectMode.get('task') || false;
  const isHabitSelectMode = isSelectMode.get('habit') || false;

  // Handle bulk actions
  const handleTasksDelete = (taskIds: string[]) => {
    taskIds.forEach(id => deleteTask(id));
    clearSelection('task');
    exitSelectMode('task');
  };

  const handleHabitsDelete = (habitIds: string[]) => {
    habitIds.forEach(id => deleteHabit(id));
    clearSelection('habit');
    exitSelectMode('habit');
  };

  // Date Helpers
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const sundayDiff = d.getDate() - day;
    return new Date(d.setDate(sundayDiff));
  };

  const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
  };

  const isFutureDate = (d: Date) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      return d > today;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const changeWeek = (offset: number) => {
    const newDate = new Date(referenceDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setReferenceDate(newDate);
  };

  const startOfWeek = getStartOfWeek(referenceDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const toggleTodo = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if(task) updateTask({ ...task, completed: !task.completed });
  };

  const toggleHabitDay = (e: React.MouseEvent, habitId: string, dayIndex: number, isFuture: boolean) => {
    e.stopPropagation(); // Prevent opening editor
    
    if (isFuture) return; // Cannot toggle future dates

    const habit = habits.find(h => h.id === habitId);
    if(habit) {
        const newHistory = [...(habit.weeklyProgress || [false, false, false, false, false, false, false])];
        const wasCompleted = newHistory[dayIndex];
        newHistory[dayIndex] = !newHistory[dayIndex];
        const isNowCompleted = newHistory[dayIndex];
        
        // Simple streak logic approximation based on modification of today
        const today = new Date();
        const targetDate = new Date(startOfWeek);
        targetDate.setDate(startOfWeek.getDate() + dayIndex);
        
        const isToday = isSameDay(today, targetDate);
        
        let newStreak = habit.streak;
        let newCompleted = habit.completed;

        if (isToday) {
            newCompleted = newHistory[dayIndex];
            newStreak = newCompleted ? newStreak + 1 : Math.max(0, newStreak - 1);
        }

        updateHabit({ 
            ...habit, 
            completed: newCompleted,
            streak: newStreak, 
            weeklyProgress: newHistory
        });

        // Update Key Result progress if habit is linked and has contribution value
        if (habit.linkedKeyResultId && habit.progressContribution && habit.progressContribution > 0) {
            const keyResult = keyResults.find(kr => kr.id === habit.linkedKeyResultId);
            if (keyResult) {
                const contribution = habit.progressContribution;
                let newCurrent = keyResult.current;
                
                if (isNowCompleted && !wasCompleted) {
                    // Habit was just completed - add contribution
                    newCurrent = Math.min(keyResult.current + contribution, keyResult.target);
                } else if (!isNowCompleted && wasCompleted) {
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
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title="Today" 
        subtitle={referenceDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32 lg:pb-8 pt-2">
        
        {/* Functional Date Selector */}
        <div className="flex items-center justify-between bg-white rounded-xl p-2 mb-4 border border-slate-100 shadow-sm mt-2">
             <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-gray-400">chevron_left</span>
             </button>
             <span className="text-sm font-bold text-text-main">
                {formatDate(startOfWeek)} - {formatDate(endOfWeek)}
             </span>
             <button onClick={() => changeWeek(1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
             </button>
        </div>

        {/* Entity Filter */}
        <div className="mb-6">
          <EntityFilter
            entityType="task"
            filters={filters}
            onFiltersChange={setFilters}
            showLinkedOnly={true}
            showUnlinkedOnly={true}
          />
        </div>

        <section className="mb-8">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3 pl-1">
              My Habits {filteredHabits.length !== habits.length && `(${filteredHabits.length}/${habits.length})`}
            </h3>
            <div className="space-y-3">
                {filteredHabits.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
                    <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">filter_list</span>
                    <p className="text-sm text-text-tertiary">Geen habits gevonden met deze filters</p>
                  </div>
                ) : (
                  filteredHabits.map(habit => {
                        // Calculate percentage based on days PASSED
                        let daysPassed = 0;
                        let completionCount = 0;
                        
                        const weeklyData = habit.weeklyProgress || [false, false, false, false, false, false, false];

                        for(let i=0; i<7; i++) {
                            const d = new Date(startOfWeek);
                            d.setDate(startOfWeek.getDate() + i);
                            d.setHours(0,0,0,0);
                            
                            const today = new Date();
                            today.setHours(0,0,0,0);

                            if (d <= today) {
                                daysPassed++;
                                if (weeklyData[i]) completionCount++;
                            }
                        }

                        const percent = daysPassed === 0 ? 0 : Math.round((completionCount / daysPassed) * 100);

                        const habitSelected = isSelected('habit', habit.id);
                        const longPressHandlers = useLongPress({
                          onLongPress: () => {
                            if (!isHabitSelectMode) {
                              enterSelectMode('habit');
                            }
                            toggleSelection('habit', habit.id);
                          },
                          onClick: () => {
                            if (isHabitSelectMode) {
                              toggleSelection('habit', habit.id);
                            } else {
                              onEdit('habit', habit.id);
                            }
                          }
                        });

                        return (
                        <div 
                            key={habit.id} 
                            className={`bg-white rounded-2xl p-4 shadow-sm border-2 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] ${
                              habitSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-slate-100 hover:border-primary/20'
                            }`}
                            {...longPressHandlers}
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-text-secondary shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">{habit.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-bold text-text-main truncate block">{habit.name}</span>
                                    {habit.streak > 2 && <span className="text-[10px] text-primary font-bold">🔥 {habit.streak} day streak</span>}
                                </div>
                                <span className="material-symbols-outlined text-text-tertiary text-[18px]">chevron_right</span>
                            </div>
                            
                            <div className="flex items-center justify-between pl-1">
                                    {/* Weekly Dots */}
                                    <div className="flex items-center gap-2 sm:gap-3">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                                        const d = new Date(startOfWeek);
                                        d.setDate(startOfWeek.getDate() + idx);
                                        d.setHours(0,0,0,0); // normalize
                                        
                                        const isFuture = isFutureDate(d);
                                        const isDone = !isFuture && habit.weeklyProgress?.[idx];
                                        
                                        return (
                                            <button 
                                                key={idx}
                                                onClick={(e) => toggleHabitDay(e, habit.id, idx, isFuture)}
                                                disabled={isFuture}
                                                className={`flex flex-col items-center gap-1 group p-1 -m-1 rounded-lg transition-colors ${isFuture ? 'cursor-default opacity-40' : 'hover:bg-gray-50 cursor-pointer'}`}
                                            >
                                                <div className={`size-6 sm:size-8 rounded-lg flex items-center justify-center transition-all ${isDone ? 'bg-primary text-white shadow-sm' : isFuture ? 'bg-slate-100 border border-slate-200' : 'bg-gray-100 text-gray-300'}`}>
                                                    {isDone && <span className="material-symbols-outlined text-[14px] sm:text-[16px]">check</span>}
                                                </div>
                                                <span className={`text-[9px] font-bold ${isDone ? 'text-primary' : 'text-gray-300'}`}>{day}</span>
                                            </button>
                                        )
                                    })}
                                    </div>

                                    {/* Stat */}
                                    <div className="flex items-center gap-1.5 text-text-secondary pl-2">
                                        <div className="radial-progress text-[10px] font-bold text-text-tertiary" style={{ "--value": percent, "--size": "2rem" } as any}>
                                            {percent}%
                                        </div>
                                    </div>
                            </div>
                        </div>
                        )
                  })
                )}
                
                {/* Add Habit Button */}
                <button
                    onClick={() => setActiveModal('addHabit')}
                    className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                    <div className="flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-text-tertiary group-hover:text-primary transition-colors">
                            add_circle
                        </span>
                        <span className="text-sm font-semibold text-text-secondary group-hover:text-primary transition-colors">
                            Add Habit
                        </span>
                    </div>
                </button>
            </div>
        </section>

        <div className="relative py-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-slate-300"></div>
          </div>
          <div className="relative bg-background px-4">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-widest">Incoming Meteors</span>
          </div>
        </div>

        <section className="space-y-1">
           {filteredTasks.length === 0 && tasks.length > 0 && (
             <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
               <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">filter_list</span>
               <p className="text-sm text-text-tertiary">Geen tasks gevonden met deze filters</p>
             </div>
           )}
           {filteredTasks.length === 0 && tasks.length === 0 && (
             <div className="text-center text-text-tertiary py-4 text-sm">No tasks for today.</div>
           )}
          {filteredTasks.map((task, i) => {
            const taskSelected = isSelected('task', task.id);
            const longPressHandlers = useLongPress({
              onLongPress: () => {
                if (!isTaskSelectMode) {
                  enterSelectMode('task');
                }
                toggleSelection('task', task.id);
              },
              onClick: () => {
                if (isTaskSelectMode) {
                  toggleSelection('task', task.id);
                }
              }
            });

            const taskContent = (
              <div 
                key={task.id} 
                className={`group flex items-start gap-3 p-3 rounded-lg transition-colors border-2 ${
                  taskSelected 
                    ? 'border-primary bg-primary/5 hover:bg-primary/10' 
                    : 'border-transparent hover:border-slate-200 hover:bg-white/60'
                }`}
                onClick={() => {
                  if (isTaskSelectMode) {
                    toggleSelection('task', task.id);
                  } else {
                    onEdit('task', task.id);
                  }
                }}
              >
                <label 
                  className="relative flex items-center justify-center pt-1 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isTaskSelectMode) {
                      toggleSelection('task', task.id);
                    } else {
                      toggleTodo(task.id);
                    }
                  }}
                >
                  <input 
                      className={`peer appearance-none size-6 border-2 rounded-lg bg-transparent focus:ring-0 focus:outline-none transition-all ${
                        taskSelected
                          ? 'border-primary bg-primary checked:bg-primary'
                          : 'border-slate-300 checked:bg-primary checked:border-primary'
                      }`}
                      type="checkbox" 
                      checked={taskSelected || task.completed}
                      onChange={() => {
                        if (isTaskSelectMode) {
                          toggleSelection('task', task.id);
                        } else {
                          toggleTodo(task.id);
                        }
                      }}
                  />
                  <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 text-[16px] pointer-events-none font-bold top-[6px]">check</span>
                </label>
                <div className="flex-1 pt-[2px]">
                  <p className={`text-[15px] font-medium leading-snug transition-colors ${task.completed ? 'text-text-tertiary line-through' : 'text-text-main group-hover:text-primary'}`}>{task.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-text-secondary">
                      {task.tag}
                    </span>
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
                </div>
                {!isTaskSelectMode && (
                  <button className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1">
                    <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                  </button>
                )}
              </div>
            );

            // Wrap in SwipeableTask if not in select mode
            if (isTaskSelectMode) {
              return taskContent;
            }

            return (
              <SwipeableTask
                key={task.id}
                task={task}
                onDelete={() => deleteTask(task.id)}
                onArchive={() => archiveTask(task.id)}
                onToggle={() => toggleTodo(task.id)}
                onEdit={() => onEdit('task', task.id)}
                onLongPress={() => {
                  if (!isTaskSelectMode) {
                    enterSelectMode('task');
                  }
                  toggleSelection('task', task.id);
                }}
              >
                {taskContent}
              </SwipeableTask>
            );
          })}
          
          {/* Add Task Button */}
          <button
            onClick={() => setActiveModal('addTask')}
            className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors group mt-4"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-text-tertiary group-hover:text-primary transition-colors">
                add_circle
              </span>
              <span className="text-sm font-semibold text-text-secondary group-hover:text-primary transition-colors">
                Add Task
              </span>
            </div>
          </button>
          
          <div className="pt-8 pb-4 text-center opacity-60">
            <div className={`inline-flex items-center justify-center p-3 mb-2 rounded-full transition-colors ${completedCount === filteredTasks.length && filteredTasks.length > 0 ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-400'}`}>
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <p className="text-xs text-text-tertiary font-medium">{completedCount} / {filteredTasks.length} tasks completed today</p>
          </div>
        </section>
      </main>

      {/* Multi-Select Toolbars */}
      {isTaskSelectMode && (
        <MultiSelectToolbar
          entityType="task"
          onDelete={handleTasksDelete}
          onEdit={(id) => {
            exitSelectMode('task');
            onEdit('task', id);
          }}
          onCancel={() => {
            exitSelectMode('task');
            clearSelection('task');
          }}
          entityName="Task"
          entityNamePlural="Tasks"
        />
      )}

      {isHabitSelectMode && (
        <MultiSelectToolbar
          entityType="habit"
          onDelete={handleHabitsDelete}
          onEdit={(id) => {
            exitSelectMode('habit');
            onEdit('habit', id);
          }}
          onCancel={() => {
            exitSelectMode('habit');
            clearSelection('habit');
          }}
          entityName="Habit"
          entityNamePlural="Habits"
        />
      )}

      {/* Add Task Modal */}
      {activeModal === 'addTask' && (
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
                  setActiveModal(null);
                  onEdit('task');
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

      {/* Add Habit Modal */}
      {activeModal === 'addHabit' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-md bg-background rounded-t-3xl shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
            <div className="sticky top-0 bg-background border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">Add Habit</h3>
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
                  setActiveModal(null);
                  onEdit('habit');
                }}
                className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-primary">add</span>
                <span className="font-semibold text-primary">Create New Habit</span>
              </button>
              
              {habits.length > 0 && (
                <>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing Habit</h4>
                  </div>
                  <div className="space-y-2">
                    {habits.map(habit => (
                      <button
                        key={habit.id}
                        onClick={() => {
                          setActiveModal(null);
                          onEdit('habit', habit.id);
                        }}
                        className="w-full p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-primary/30 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-text-secondary">{habit.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-text-main mb-1">{habit.name}</h5>
                            {habit.streak > 0 && (
                              <span className="text-[10px] text-primary font-bold">🔥 {habit.streak} day streak</span>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              {habits.length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">repeat</span>
                  <p className="text-sm text-text-tertiary">No habits available</p>
                  <p className="text-xs text-text-tertiary mt-1">Create a new habit to get started</p>
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