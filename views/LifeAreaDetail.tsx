import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { View } from '../types';
import { TopNav } from '../components/TopNav';

interface LifeAreaDetailProps {
  lifeAreaId: string;
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onEdit?: (type: 'lifeArea' | 'task' | 'habit' | 'friend' | 'objective' | 'keyResult' | 'place', id?: string, parentId?: string, context?: { objectiveId?: string; lifeAreaId?: string }) => void;
  onViewObjective?: (id: string) => void;
}

export const LifeAreaDetail: React.FC<LifeAreaDetailProps> = ({ 
  lifeAreaId, 
  onNavigate, 
  onMenuClick, 
  onProfileClick, 
  onEdit,
  onViewObjective 
}) => {
  const { 
    getLifeAreaById, 
    getObjectivesByLifeArea, 
    getTasksByLifeArea,
    objectives,
    tasks,
    keyResults,
    habits,
    showCategory,
    updateObjective,
    updateHabit,
    updateTask,
    updateKeyResult
  } = useData();
  
  const [activeModal, setActiveModal] = useState<'addGoal' | 'linkHabit' | 'addTask' | null>(null);
  
  const handleAddNewGoal = () => {
    setActiveModal(null);
    localStorage.setItem('orbit_newObjective_lifeAreaId', lifeAreaId);
    onEdit && onEdit('objective');
  };
  
  const handleSelectExistingGoal = (objectiveId: string) => {
    updateObjective({ ...objectives.find(o => o.id === objectiveId)!, lifeAreaId });
    setActiveModal(null);
  };

  const handleAddNewTask = () => {
    setActiveModal(null);
    onEdit && onEdit('task', undefined, undefined, { lifeAreaId: lifeAreaId });
  };

  const handleSelectExistingTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Link task to this life area via objectiveId or directly
      // Since tasks can be linked via keyResultId -> objectiveId -> lifeAreaId,
      // we'll set lifeAreaId directly if not already linked
      if (!task.lifeAreaId) {
        updateTask({ ...task, lifeAreaId: lifeAreaId });
      } else {
        // If already linked to another life area, we might want to update it
        // For now, we'll just link it
        updateTask({ ...task, lifeAreaId: lifeAreaId });
      }
    }
    setActiveModal(null);
  };

  const lifeArea = getLifeAreaById(lifeAreaId);
  const areaObjectives = getObjectivesByLifeArea(lifeAreaId);
  const areaTasks = getTasksByLifeArea(lifeAreaId);
  const areaHabits = habits.filter(h => h.lifeAreaId === lifeAreaId);

  if (!lifeArea) {
    return (
      <div className="flex flex-col w-full h-full bg-background min-h-screen">
        <TopNav 
          title="Life Area" 
          subtitle="Not Found" 
          onMenuClick={onMenuClick}
          onProfileClick={onProfileClick} 
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-text-secondary">Life Area not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === 'On Track') return 'bg-green-100 text-green-700';
    if (status === 'At Risk') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'On Track') return 'bg-green-500';
    if (status === 'At Risk') return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Helper to check if date is in the future
  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  // Calculate streak from weeklyProgress array
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

  // Toggle habit for a specific day (0 = today, 1 = yesterday, etc.)
  const toggleHabitDay = (habitId: string, dayIndex: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Only allow toggling if the day index is within the 7-day window (0-6)
    // dayIndex < 0 would be in the future, which we don't allow
    if (dayIndex < 0 || dayIndex >= 7) {
      return;
    }

    // Calculate the date for this day index
    // weeklyProgress[0] = today, weeklyProgress[1] = yesterday, etc.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - dayIndex);
    targetDate.setHours(0, 0, 0, 0);

    // Prevent toggling habits for future dates (extra safety check)
    // For dayIndex >= 0, targetDate should never be in the future, but check anyway
    if (isFutureDate(targetDate) || targetDate > today) {
      return;
    }

    const weeklyData = habit.weeklyProgress || [false, false, false, false, false, false, false];
    const newHistory = [...weeklyData];

    const wasCompleted = newHistory[dayIndex];
    newHistory[dayIndex] = !newHistory[dayIndex];
    const isNowCompleted = newHistory[dayIndex];

    // Recalculate streak
    const newStreak = calculateStreak(newHistory);

    // Update completed status only if this is today (dayIndex === 0)
    const isToday = dayIndex === 0;
    const newCompleted = isToday ? isNowCompleted : habit.completed;

    updateHabit({
      ...habit,
      completed: newCompleted,
      streak: newStreak,
      weeklyProgress: newHistory
    });

    // Update Key Result progress if habit is linked and has contribution value
    // Only update if this is today
    if (isToday && habit.linkedKeyResultId && habit.progressContribution && habit.progressContribution > 0) {
      const keyResult = keyResults.find(kr => kr.id === habit.linkedKeyResultId);
      if (keyResult) {
        const contribution = habit.progressContribution;
        let newCurrent = keyResult.current;

        if (isNowCompleted && !wasCompleted) {
          newCurrent = Math.min(keyResult.current + contribution, keyResult.target);
        } else if (!isNowCompleted && wasCompleted) {
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
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title={lifeArea.name} 
        subtitle="Life Area" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick} 
        onBack={() => onNavigate(View.LIFE_AREAS)}
        showBack={true}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 pt-6">
        {/* Life Area Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4 group">
            {lifeArea.image ? (
              <div 
                className="size-20 rounded-3xl bg-cover bg-center shadow-soft shrink-0"
                style={{ backgroundImage: `url("${lifeArea.image}")` }}
              >
                <div 
                  className="absolute bottom-0 right-0 size-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: lifeArea.color }}
                />
              </div>
            ) : (
              <div 
                className="size-20 rounded-3xl flex items-center justify-center shadow-soft relative shrink-0"
                style={{ backgroundColor: `${lifeArea.color}20` }}
              >
                <span 
                  className="material-symbols-outlined text-3xl"
                  style={{ color: lifeArea.color }}
                >
                  {lifeArea.icon}
                </span>
                <div 
                  className="absolute bottom-0 right-0 size-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: lifeArea.color }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-text-main mb-1">{lifeArea.name}</h1>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-text-secondary">
                  {areaObjectives.length} {areaObjectives.length === 1 ? 'goal' : 'goals'}
                </span>
                {areaTasks.length > 0 && (
                  <>
                <span className="text-text-tertiary">•</span>
                    <span className="font-medium text-text-secondary">
                      {areaTasks.length} {areaTasks.length === 1 ? 'task' : 'tasks'}
                </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => onEdit && onEdit('lifeArea', lifeArea.id)}
              className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            >
              <span className="material-symbols-outlined text-text-tertiary text-lg">edit</span>
            </button>
          </div>

          {lifeArea.visionStatement ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl">lightbulb</span>
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">Vision</h3>
                  <p className="text-sm text-text-main leading-relaxed mb-3">{lifeArea.visionStatement}</p>
                  
                  {/* Vision Images */}
                  {lifeArea.visionImages && lifeArea.visionImages.length > 0 && lifeArea.visionImages.filter((img: string) => img.trim()).length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {lifeArea.visionImages.filter((img: string) => img.trim()).map((img: string, index: number) => (
                        <div 
                          key={index}
                          className="aspect-square rounded-xl bg-gray-100 bg-cover bg-center"
                          style={{ backgroundImage: `url("${img}")` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : lifeArea.description ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-sm text-text-secondary leading-relaxed">{lifeArea.description}</p>
            </div>
          ) : null}
        </div>

        {/* Goals Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-main">Goals</h2>
            <button 
              onClick={() => setActiveModal('addGoal')}
              className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Goal
            </button>
          </div>

          {areaObjectives.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-slate-200 text-center">
              <span className="material-symbols-outlined text-4xl text-text-tertiary mb-3">flag</span>
              <p className="text-sm text-text-secondary mb-4">No goals yet for this Life Area</p>
              <button 
                onClick={() => setActiveModal('addGoal')}
                className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors text-sm"
              >
                Add Goal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {areaObjectives.map(obj => {
                const linkedKRs = keyResults.filter(kr => kr.objectiveId === obj.id);
                const calculatedProgress = linkedKRs.length > 0 
                  ? Math.round(linkedKRs.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / linkedKRs.length)
                  : obj.progress;

                return (
                  <div
                    key={obj.id}
                    onClick={() => onViewObjective && onViewObjective(obj.id)}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-soft transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {showCategory && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`size-2 rounded-full ${getStatusBadge(obj.status)}`}></div>
                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">{obj.category}</span>
                          </div>
                        )}
                        {!showCategory && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`size-2 rounded-full ${getStatusBadge(obj.status)}`}></div>
                          </div>
                        )}
                        <h3 className="text-base font-bold text-text-main group-hover:text-primary transition-colors mb-1">
                          {obj.title}
                        </h3>
                        {obj.description && (
                          <p className="text-sm text-text-secondary line-clamp-2">{obj.description}</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(obj.status)}`}>
                        {obj.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {obj.ownerImage && (
                          <img 
                            src={obj.ownerImage} 
                            alt={obj.owner} 
                            className="size-6 rounded-full border border-white"
                          />
                        )}
                        <span className="text-xs text-text-tertiary">{obj.owner}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {linkedKRs.length > 0 && (
                          <span className="text-xs text-text-tertiary">
                            {linkedKRs.length} {linkedKRs.length === 1 ? 'result' : 'results'}
                          </span>
                        )}
                        <span className="text-sm font-bold text-text-main">{calculatedProgress}%</span>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getStatusBadge(obj.status)}`}
                        style={{ width: `${calculatedProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tasks Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-main">Tasks</h2>
            <button 
              onClick={() => setActiveModal('addTask')}
              className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Task
            </button>
          </div>

          {areaTasks.length === 0 ? (
            <button
              onClick={() => setActiveModal('addTask')}
              className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-text-tertiary group-hover:text-primary transition-colors">task_alt</span>
                <p className="text-sm text-text-secondary group-hover:text-primary transition-colors">No tasks yet for this Life Area</p>
            </div>
            </button>
          ) : (
            <div className="space-y-2">
              {areaTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3"
                >
                  <button
                    onClick={() => {/* TODO: Toggle task completion */}}
                    className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                      task.completed 
                        ? 'bg-primary border-primary' 
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {task.completed && (
                      <span className="material-symbols-outlined text-white text-sm">check</span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.completed ? 'line-through text-text-tertiary' : 'text-text-main'}`}>
                      {task.title}
                    </p>
                    {task.tag && (
                      <span className="text-xs text-text-tertiary">{task.tag}</span>
                    )}
                  </div>
                  {task.priority && (
                    <span className="material-symbols-outlined text-red-500 text-lg">priority_high</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Habits Section */}
          <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-main">Habits</h2>
            <button 
              onClick={() => setActiveModal('linkHabit')}
              className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Habit
            </button>
          </div>
          {areaHabits.length === 0 ? (
            <button
              onClick={() => setActiveModal('linkHabit')}
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
          ) : (
            <div className="space-y-3">
              {areaHabits.map(habit => {
                const weeklyData = habit.weeklyProgress || [false, false, false, false, false, false, false];
                const completedCount = weeklyData.filter(Boolean).length;
                return (
                <div
                  key={habit.id}
                    onClick={() => onEdit && onEdit('habit', habit.id)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.99]"
                >
                    <div className="flex items-center gap-3">
                  <div 
                        className="size-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${lifeArea.color}20` }}
                  >
                    <span 
                      className="material-symbols-outlined text-xl"
                      style={{ color: lifeArea.color }}
                    >
                      {habit.icon}
                    </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-main truncate">{habit.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {habit.streak > 0 && (
                            <span className="text-[10px] text-primary font-bold">🔥 {habit.streak} day streak</span>
                          )}
                          <span className="text-[10px] text-text-tertiary">{completedCount}/7 this week</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-text-tertiary text-[18px]">chevron_right</span>
                    </div>
                    
                    {/* Weekly Progress */}
                    <div className="flex items-center gap-2 pl-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                        const isDone = weeklyData[idx];
                        // Calculate the actual date for this index
                        // weeklyProgress[0] = today, weeklyProgress[1] = yesterday, etc.
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const targetDate = new Date(today);
                        targetDate.setDate(today.getDate() - idx);
                        
                        // Check if this date is in the future (should never happen for idx >= 0, but safety check)
                        const isFuture = isFutureDate(targetDate);
                        
                        // Get the day of week for this date to show correct label
                        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
                        const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                        const dayLabel = dayLabels[dayOfWeek];
                        
                        return (
                          <div 
                            key={idx}
                            className={`flex flex-col items-center gap-1 ${isDone ? 'opacity-100' : 'opacity-40'}`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening editor
                                if (!isFuture) {
                                  toggleHabitDay(habit.id, idx);
                                }
                              }}
                              disabled={isFuture}
                              className={`size-6 rounded-lg flex items-center justify-center transition-all ${
                                isFuture
                                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                  : isDone 
                                    ? 'bg-primary text-white shadow-sm hover:bg-primary-soft' 
                                    : 'bg-slate-100 text-gray-300 hover:bg-slate-200'
                              }`}
                            >
                              {isDone && <span className="material-symbols-outlined text-[12px]">check</span>}
                            </button>
                            <span className={`text-[9px] font-bold ${isDone ? 'text-primary' : isFuture ? 'text-gray-300' : 'text-gray-400'}`}>
                              {dayLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Link Habit Modal */}
      {activeModal === 'linkHabit' && (
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
              {/* Add New Button */}
              <button
                onClick={() => {
                  setActiveModal(null);
                  onEdit && onEdit('habit', undefined, undefined, { lifeAreaId: lifeAreaId });
                }}
                className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-primary">add</span>
                <span className="font-semibold text-primary">Create New Habit</span>
              </button>
              
              {/* Existing Habits (not yet linked to this Life Area) */}
              {habits.filter(h => h.lifeAreaId !== lifeAreaId).length > 0 && (
                <>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing Habit</h4>
                  </div>
                  <div className="space-y-2">
                    {habits.filter(h => h.lifeAreaId !== lifeAreaId).map(habit => (
                      <button
                        key={habit.id}
                        onClick={() => {
                          // Update habit to link to this life area
                          updateHabit({ ...habit, lifeAreaId: lifeAreaId });
                          setActiveModal(null);
                        }}
                        className="w-full p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-primary/30 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-text-secondary">{habit.icon}</span>
                  </div>
                  <div className="flex-1">
                            <h5 className="font-semibold text-text-main mb-1">{habit.name}</h5>
                            <div className="flex items-center gap-2">
                              {habit.streak > 0 && (
                                <span className="text-[10px] text-primary font-bold">🔥 {habit.streak} day streak</span>
                              )}
                              {habit.objectiveId && (
                                <span className="text-[10px] text-text-tertiary">
                                  Linked to objective
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              {habits.filter(h => h.lifeAreaId !== lifeAreaId).length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">repeat</span>
                  <p className="text-sm text-text-tertiary">No other habits available</p>
                  <p className="text-xs text-text-tertiary mt-1">Create a new habit to add it to this Life Area</p>
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

      {/* Add Goal Modal */}
      {activeModal === 'addGoal' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-md bg-background rounded-t-3xl shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
            <div className="sticky top-0 bg-background border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">Add Goal</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-text-tertiary">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Add New Button */}
              <button
                onClick={handleAddNewGoal}
                className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-primary">add</span>
                <span className="font-semibold text-primary">Create New Goal</span>
              </button>
              
              {/* Existing Goals (not yet linked to this Life Area) */}
              {objectives.filter(obj => obj.lifeAreaId !== lifeAreaId).length > 0 && (
                <>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing Goal</h4>
                  </div>
                  <div className="space-y-2">
                    {objectives.filter(obj => obj.lifeAreaId !== lifeAreaId).map(obj => (
                      <button
                        key={obj.id}
                        onClick={() => handleSelectExistingGoal(obj.id)}
                        className="w-full p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-primary/30 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-text-main mb-1">{obj.title}</h5>
                            {obj.description && (
                              <p className="text-sm text-text-tertiary line-clamp-1">{obj.description}</p>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-text-tertiary ml-2">chevron_right</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              {objectives.filter(obj => obj.lifeAreaId !== lifeAreaId).length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">flag</span>
                  <p className="text-sm text-text-tertiary">No other goals available</p>
                  <p className="text-xs text-text-tertiary mt-1">Create a new goal to add it to this Life Area</p>
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
              {/* Add New Button */}
              <button
                onClick={handleAddNewTask}
                className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-primary">add</span>
                <span className="font-semibold text-primary">Create New Task</span>
              </button>
              
              {/* Existing Tasks (not yet linked to this Life Area) */}
              {tasks.filter(t => t.lifeAreaId !== lifeAreaId).length > 0 && (
                <>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing Task</h4>
                  </div>
                  <div className="space-y-2">
                    {tasks.filter(t => t.lifeAreaId !== lifeAreaId).map(task => (
                      <button
                        key={task.id}
                        onClick={() => handleSelectExistingTask(task.id)}
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
              
              {tasks.filter(t => t.lifeAreaId !== lifeAreaId).length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">task_alt</span>
                  <p className="text-sm text-text-tertiary">No other tasks available</p>
                  <p className="text-xs text-text-tertiary mt-1">Create a new task to add it to this Life Area</p>
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

