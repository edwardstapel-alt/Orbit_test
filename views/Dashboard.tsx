import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { QuickActionsPanel } from '../components/QuickActionsPanel';
import { KeyResultStatusView } from './KeyResultStatusView';

interface DashboardProps {
  onNavigate: (view: View, habitId?: string, lifeAreaId?: string) => void;
  onEdit: (type: any, id?: string, parentId?: string) => void;
  onViewObjective: (id: string) => void;
  onViewLifeArea?: (id: string) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

const ObjectiveCard: React.FC<{ 
    objective: any, 
    keyResults: any[], 
    onView: () => void, 
    onEdit: (type: 'keyResult', id?: string, parentId?: string) => void,
    onAddKR: () => void,
    onKeyResultClick: (krId: string) => void
}> = ({ objective, keyResults, onView, onEdit, onAddKR, onKeyResultClick }) => {
  const { getStatusUpdatesByKeyResult } = useData();
  
  const calculatedProgress = keyResults.length > 0 
    ? Math.round(keyResults.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / keyResults.length)
    : objective.progress;

  // Helper to check if objective has any status updates (via its key results)
  const hasObjectiveStatusUpdates = (objId: string) => {
    const linkedKRs = keyResults.filter(kr => kr.objectiveId === objId);
    return linkedKRs.some(kr => {
      const updates = getStatusUpdatesByKeyResult(kr.id);
      return updates.length > 0;
    });
  };

  // Helper to check if key result has status updates
  const hasKeyResultStatusUpdates = (krId: string) => {
    const updates = getStatusUpdatesByKeyResult(krId);
    return updates.length > 0;
  };

  // Get effective status (No status if no updates exist)
  const getEffectiveStatus = (status: string, entityId: string, isKeyResult: boolean = false) => {
    const hasUpdates = isKeyResult 
      ? hasKeyResultStatusUpdates(entityId)
      : hasObjectiveStatusUpdates(entityId);
    return hasUpdates ? status : 'No status';
  };

  const getStatusColor = (status: string) => {
    if (status === 'On Track') return 'bg-green-100 text-green-700';
    if (status === 'At Risk') return 'bg-amber-100 text-amber-700';
    if (status === 'No status') return 'bg-gray-100 text-gray-600';
    return 'bg-red-100 text-red-700';
  };

  const getProgressBarColor = (status: string) => {
    if (status === 'On Track') return 'bg-green-500';
    if (status === 'At Risk') return 'bg-amber-500';
    if (status === 'No status') return 'bg-gray-400';
    return 'bg-red-500';
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100 mb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 cursor-pointer group" onClick={onView}>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusColor(getEffectiveStatus(objective.status, objective.id, false))}`}>
                    {getEffectiveStatus(objective.status, objective.id, false)}
                </span>
                <span className="text-xs text-text-tertiary">{objective.dueDate}</span>
            </div>
            <h3 className="text-lg font-bold text-text-main leading-tight group-hover:text-primary transition-colors">{objective.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
             <img src={objective.ownerImage || 'https://via.placeholder.com/100'} alt="Owner" className="size-8 rounded-full border border-white shadow-sm" />
             <span className="material-symbols-outlined text-text-tertiary text-[20px] group-hover:translate-x-1 transition-transform">chevron_right</span>
        </div>
      </div>

      {/* Main Progress */}
      <div className="mb-6 cursor-pointer" onClick={onView}>
        <div className="flex items-end justify-between mb-1.5">
            <span className="text-2xl font-bold text-text-main">{calculatedProgress}%</span>
            <span className="text-xs font-semibold text-text-tertiary">Progress</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${getProgressBarColor(objective.status)} transition-all duration-500`} style={{width: `${Math.min(calculatedProgress, 100)}%`}}></div>
        </div>
      </div>

      {/* Sub Goals (Key Results) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
             <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Key Results</h4>
             <button onClick={(e) => { e.stopPropagation(); onAddKR(); }} className="text-primary text-[10px] font-bold uppercase hover:bg-primary/5 px-2 py-1 rounded transition-colors">+ Add Result</button>
        </div>
        
        {keyResults.length === 0 && <p className="text-sm text-text-tertiary italic">No key results connected.</p>}
        
        {keyResults.map(kr => {
           const krProgress = Math.min(Math.round((kr.current / kr.target) * 100), 100);
           return (
            <div key={kr.id} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.stopPropagation(); onKeyResultClick(kr.id); }}>
                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${(() => {
                  const effectiveStatus = getEffectiveStatus(kr.status, kr.id, true);
                  return effectiveStatus === 'On Track' ? 'bg-green-500' : effectiveStatus === 'At Risk' ? 'bg-amber-500' : effectiveStatus === 'No status' ? 'bg-gray-400' : 'bg-red-500';
                })()}`}></div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-main truncate group-hover:text-primary transition-colors">{kr.title}</span>
                        <span className="text-xs font-bold text-text-tertiary">{krProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full ${(() => {
                           const effectiveStatus = getEffectiveStatus(kr.status, kr.id, true);
                           return effectiveStatus === 'On Track' ? 'bg-green-400' : effectiveStatus === 'No status' ? 'bg-gray-400' : 'bg-gray-400';
                         })()} opacity-70`} style={{width: `${krProgress}%`}}></div>
                    </div>
                </div>
            </div>
           )
        })}
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onEdit, onViewObjective, onViewLifeArea, onMenuClick, onProfileClick }) => {
  const [mode, setMode] = useState<'personal' | 'professional'>('professional');
  const { tasks, habits, objectives, keyResults, lifeAreas, updateTask, deleteTask, deleteCompletedTasks, userProfile, showCategory, quickActions, reviews, getLatestReview } = useData();
  const [removingTasks, setRemovingTasks] = useState<Set<string>>(new Set());
  const [showAddObjectiveModal, setShowAddObjectiveModal] = useState(false);
  const [selectedKeyResultId, setSelectedKeyResultId] = useState<string | null>(null);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const animationTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Filter Data based on mode (only if showCategory is enabled)
  const filteredTasks = showCategory ? tasks.filter(t => {
      if (mode === 'professional') return ['Work', 'Finance', 'Strategy', 'Meeting'].includes(t.tag);
      return !['Work', 'Finance', 'Strategy', 'Meeting'].includes(t.tag);
  }) : tasks;

  const filteredObjectives = showCategory ? objectives.filter(obj => obj.category === mode) : objectives;

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    updateTask({ ...task, completed: newCompleted });

    // Als task wordt afgevinkt, start auto-delete na 2 seconden
    if (newCompleted) {
      // Wacht 1.5 seconden voordat animatie start, dan 0.5s animatie, dan verwijderen
      const animationTimeout = setTimeout(() => {
        // Start animatie
        setRemovingTasks(prev => new Set(prev).add(id));
      }, 1500);

      // Start timeout voor verwijdering (na 2 seconden totaal)
      const deleteTimeout = setTimeout(() => {
        deleteTask(id);
        setRemovingTasks(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timeoutRefs.current.delete(id);
        animationTimeoutRefs.current.delete(id);
      }, 2000);

      // Sla beide timeouts op zodat we ze kunnen annuleren
      timeoutRefs.current.set(id, deleteTimeout);
      animationTimeoutRefs.current.set(id, animationTimeout);
    } else {
      // Als task wordt uitgevinkt, annuleer verwijdering
      const timeout = timeoutRefs.current.get(id);
      const animTimeout = animationTimeoutRefs.current.get(id);
      if (timeout) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(id);
      }
      if (animTimeout) {
        clearTimeout(animTimeout);
        animationTimeoutRefs.current.delete(id);
      }
      setRemovingTasks(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Cleanup timeouts bij unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
      animationTimeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      animationTimeoutRefs.current.clear();
    };
  }, []);

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto no-scrollbar pb-32 lg:pb-8">
      <TopNav 
        title={`Focus, ${userProfile.firstName || 'there'}`} 
        subtitle="Good Morning" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick} 
      />

      {/* Review Reminders */}
      {(() => {
        const latestWeekly = getLatestReview('weekly');
        const latestMonthly = getLatestReview('monthly');
        const today = new Date();
        const dayOfWeek = today.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isEndOfMonth = today.getDate() >= 28;
        
        // Check if weekly review is due (every Sunday/Saturday)
        const weeklyReviewDue = isWeekend && (!latestWeekly || (() => {
          const lastReviewDate = new Date(latestWeekly.date);
          const daysSince = Math.floor((today.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysSince >= 7;
        })());
        
        // Check if monthly review is due (end of month)
        const monthlyReviewDue = isEndOfMonth && (!latestMonthly || (() => {
          const lastReviewDate = new Date(latestMonthly.date);
          return lastReviewDate.getMonth() !== today.getMonth() || lastReviewDate.getFullYear() !== today.getFullYear();
        })());
        
        if (!weeklyReviewDue && !monthlyReviewDue) return null;
        
        return (
          <section className="px-6 md:px-12 lg:px-8 mt-4">
            <div className="w-full">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-primary mb-1">Review Time!</h3>
                    <p className="text-xs text-text-secondary">
                      {weeklyReviewDue && monthlyReviewDue 
                        ? 'Weekly and monthly reviews are due'
                        : weeklyReviewDue 
                        ? 'Weekly review is due'
                        : 'Monthly review is due'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {weeklyReviewDue && (
                      <button
                        onClick={() => onNavigate(View.WEEKLY_REVIEW)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-soft transition-colors"
                      >
                        Weekly
                      </button>
                    )}
                    {monthlyReviewDue && (
                      <button
                        onClick={() => onNavigate(View.MONTHLY_REVIEW)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-soft transition-colors"
                      >
                        Monthly
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Quick Actions Panel */}
      {quickActions.length > 0 && (
        <section className="px-6 md:px-12 lg:px-8 mt-4">
          <div className="w-full">
            <QuickActionsPanel
              customActions={quickActions}
              onActionClick={(action) => {
                if (action.type === 'navigation' && action.targetView) {
                  onNavigate(action.targetView);
                } else if (action.type === 'template' && action.templateType) {
                  onEdit(action.templateType);
                }
              }}
              onNavigate={onNavigate}
              onEdit={onEdit}
            />
          </div>
        </section>
      )}

      {/* Toggle - Only show if showCategory is enabled */}
      {showCategory && (
        <section className="px-6 md:px-12 lg:px-8 mt-4">
          <div className="flex h-12 w-full max-w-2xl mx-auto items-center justify-center rounded-2xl bg-[#E6E6E6] p-1.5 shadow-inner">
          <button 
            onClick={() => setMode('personal')}
            className={`flex-1 h-full text-sm font-semibold rounded-xl transition-all ${mode === 'personal' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-text-secondary hover:text-text-main'}`}
          >
            Personal
          </button>
          <button 
            onClick={() => setMode('professional')}
            className={`flex-1 h-full text-sm font-semibold rounded-xl transition-all ${mode === 'professional' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-text-secondary hover:text-text-main'}`}
          >
            Professional
          </button>
        </div>
      </section>
      )}

      {/* OKRs (Objectives) */}
      <section className="w-full mt-16 px-6 md:px-12 lg:px-8">
        <div className="w-full bg-gradient-to-br from-white via-gray-50/80 to-gray-50/50 rounded-3xl p-8 lg:p-10 border-2 border-gray-200/60 shadow-lg">
        <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">flag</span>
            </div>
            <div>
              <h3 className="text-text-main text-2xl font-bold tracking-tight mb-1">Objectives & Key Results</h3>
              <p className="text-sm text-text-tertiary">Your strategic goals and measurable outcomes</p>
            </div>
          </div>
          <button className="text-primary text-sm font-medium hover:opacity-80 transition-opacity" onClick={() => setShowAddObjectiveModal(true)}>
            + Add Goal
          </button>
        </div>
        
        {filteredObjectives.length === 0 && (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                <p className="text-text-tertiary text-sm mb-2">No objectives defined for {mode}.</p>
                <button onClick={() => setShowAddObjectiveModal(true)} className="text-primary font-bold text-sm">Create One</button>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredObjectives.map(obj => (
              <ObjectiveCard 
                  key={obj.id} 
                  objective={obj} 
                  keyResults={keyResults.filter(kr => kr.objectiveId === obj.id)}
                  onView={() => onViewObjective(obj.id)}
                  onEdit={onEdit}
                  onAddKR={() => onEdit('keyResult', undefined, obj.id)}
                  onKeyResultClick={(krId) => setSelectedKeyResultId(krId)}
              />
          ))}
        </div>
        </div>
      </section>

      {/* Daily Focus */}
      <section className="px-6 md:px-12 lg:px-8 mt-16">
        <div className="w-full bg-gradient-to-br from-white via-blue-50/40 to-blue-50/30 rounded-3xl p-8 lg:p-10 border-2 border-blue-200/60 shadow-lg">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-blue-200/50 px-1">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-100/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-xl">check_circle</span>
            </div>
            <div>
              <h3 className="text-text-main text-2xl font-bold tracking-tight mb-1">Daily Focus</h3>
              <p className="text-sm text-text-tertiary">Tasks and priorities for today</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(View.TASKS_OVERVIEW)}
              className="text-primary text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              See All Tasks
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          {tasks.filter(t => t.completed).length > 0 && (
            <button
              onClick={() => {
                const completedCount = tasks.filter(t => t.completed).length;
                if (window.confirm(`Delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
                  deleteCompletedTasks();
                }
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors text-xs font-semibold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Clear Completed
            </button>
          )}
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden min-h-[100px]">
          {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-text-tertiary text-sm">No tasks for this category.</div>
          ) : (
            <div className="flex flex-col lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0 divide-y divide-gray-100">
                {filteredTasks.map((item) => {
                  const isRemoving = removingTasks.has(item.id);
                  return (
                <div 
                  key={item.id} 
                  className={`group flex items-center gap-4 p-5 lg:border-0 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 cursor-pointer select-none ${
                    isRemoving 
                      ? 'animate-slide-out-left pointer-events-none overflow-hidden' 
                      : ''
                  }`}
                >
                    <div className="relative flex items-center shrink-0" onClick={() => toggleTask(item.id)}>
                    <input 
                        type="checkbox" 
                        checked={item.completed}
                        readOnly
                        className="peer h-6 w-6 cursor-pointer appearance-none rounded-full border-2 border-gray-300 bg-transparent checked:border-primary checked:bg-primary transition-all hover:border-primary/50 focus:ring-0 focus:ring-offset-0" 
                    />
                    <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 text-[14px] font-bold pointer-events-none transition-opacity">check</span>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0" onClick={() => onEdit('task', item.id)}>
                    <span className={`text-text-main text-[15px] font-medium leading-tight truncate transition-all ${item.completed ? 'line-through text-text-tertiary' : ''}`}>{item.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${item.priority ? 'bg-primary-light text-primary' : 'bg-gray-100 text-text-secondary'}`}>{item.tag}</span>
                        <span className={`text-xs ${item.priority ? 'text-text-secondary font-medium' : 'text-text-tertiary'}`}>{item.time}</span>
                    </div>
                    </div>
                </div>
                );
                })}
            </div>
          )}
          
          {/* Add Task Button */}
          <button
            onClick={() => onEdit('task')}
            className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-4 m-4 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
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
        </div>
        </div>
      </section>

      {/* Habit Streaks */}
      <section className="w-full mt-16">
        <div className="px-6 md:px-12 lg:px-8 mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-orange-100/60 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-600 text-xl">local_fire_department</span>
              </div>
              <div>
                <h3 className="text-text-main text-2xl font-bold tracking-tight mb-1">Habit Streaks</h3>
                <p className="text-sm text-text-tertiary">Build consistency with daily habits</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate(View.HABITS)}
              className="text-primary text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              See All Habits
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
        <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:overflow-x-visible no-scrollbar px-6 md:px-12 lg:px-8 pb-6 gap-4 snap-x lg:snap-none">
            <button 
              onClick={() => onEdit('habit')} 
              className="snap-start lg:snap-none flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white shadow-sm border-2 border-dashed border-slate-200 shrink-0 lg:shrink min-w-[140px] lg:min-w-0 aspect-square cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <span className="material-symbols-outlined text-3xl text-text-tertiary group-hover:text-primary transition-colors">add_circle</span>
              <span className="text-xs font-semibold text-text-secondary group-hover:text-primary transition-colors">Add Habit</span>
            </button>
          {habits.map((habit) => (
            <div 
                key={habit.id} 
                onClick={() => onNavigate(View.HABIT_DETAIL, habit.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onEdit('habit', habit.id);
                }}
                className="snap-start lg:snap-none flex flex-col items-start gap-3 p-4 rounded-3xl bg-white shadow-soft shrink-0 lg:shrink min-w-[140px] lg:min-w-0 aspect-square justify-between group hover:shadow-md transition-all border border-transparent hover:border-gray-100 cursor-pointer"
            >
                <div className="size-12 rounded-2xl bg-gray-100 flex items-center justify-center text-text-secondary group-hover:scale-110 group-hover:bg-primary-light group-hover:text-primary transition-all duration-300">
                <span className="material-symbols-outlined">{habit.icon}</span>
                </div>
                <div className="flex flex-col w-full">
                <span className="text-text-main text-sm font-bold truncate w-full">{habit.name}</span>
                <div className="flex items-center gap-1 text-primary text-xs font-semibold mt-1">
                    <span className="material-symbols-outlined text-[14px] filled">local_fire_department</span>
                    <span>{habit.streak} days</span>
                </div>
                </div>
            </div>
          ))}
        </div>
      </section>

      {/* Life Areas */}
      <section className="w-full mt-16 px-6 md:px-12 lg:px-8">
        <div className="w-full bg-gradient-to-br from-white via-purple-50/40 to-purple-50/30 rounded-3xl p-8 lg:p-10 border-2 border-purple-200/60 shadow-lg">
          <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-purple-200/50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-100/60 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600 text-xl">category</span>
              </div>
              <div>
                <h3 className="text-text-main text-2xl font-bold tracking-tight mb-1">Life Areas</h3>
                <p className="text-sm text-text-tertiary">Organize your goals by life domain</p>
              </div>
            </div>
            <button 
              className="text-primary text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
              onClick={() => onNavigate(View.LIFE_AREAS)}
            >
              See All
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
          {lifeAreas.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
              <p className="text-text-tertiary text-sm mb-2">No life areas defined.</p>
              <button onClick={() => onEdit('lifeArea')} className="text-primary font-bold text-sm">Create One</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lifeAreas.slice(0, 4).map((lifeArea) => {
                const areaObjectives = objectives.filter(obj => obj.lifeAreaId === lifeArea.id);
                return (
                  <div
                    key={lifeArea.id}
                    onClick={() => {
                      if (onViewLifeArea) {
                        onViewLifeArea(lifeArea.id);
                      } else {
                        onNavigate(View.LIFE_AREAS, undefined, lifeArea.id);
                      }
                    }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all group"
                  >
                    {lifeArea.image ? (
                      <div 
                        className="w-full aspect-video rounded-xl mb-3 bg-cover bg-center"
                        style={{ backgroundImage: `url("${lifeArea.image}")` }}
                      />
                    ) : (
                      <div className="w-full aspect-video rounded-xl mb-3 bg-gray-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-text-tertiary">{lifeArea.icon || 'category'}</span>
                      </div>
                    )}
                    <h4 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors truncate">
                      {lifeArea.name}
                    </h4>
                    <p className="text-xs text-text-tertiary mt-1">
                      {areaObjectives.length} objective{areaObjectives.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Add Objective Modal */}
      {showAddObjectiveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-md bg-background rounded-t-3xl shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
            <div className="sticky top-0 bg-background border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">Add Objective</h3>
              <button 
                onClick={() => setShowAddObjectiveModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-text-tertiary">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Create New Objective */}
              <button
                onClick={() => {
                  setShowAddObjectiveModal(false);
                  onEdit('objective');
                }}
                className="w-full mb-3 p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-primary/30 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-text-main">add</span>
                <span className="font-semibold text-text-main">Create New Objective</span>
              </button>
              
              {/* Create from Template */}
              <button
                onClick={() => {
                  setShowAddObjectiveModal(false);
                  onNavigate && onNavigate(View.GOAL_PLANS);
                }}
                className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <span className="font-semibold text-primary">Create Objective from Template</span>
              </button>
              
              {objectives.length > 0 && (
                <>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing Objective</h4>
                  </div>
                  <div className="space-y-2">
                    {objectives.map(obj => (
                      <button
                        key={obj.id}
                        onClick={() => {
                          setShowAddObjectiveModal(false);
                          onEdit('objective', obj.id);
                        }}
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
              
              {objectives.length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">flag</span>
                  <p className="text-sm text-text-tertiary">No objectives available</p>
                  <p className="text-xs text-text-tertiary mt-1">Create a new objective to get started</p>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-background border-t border-gray-200 px-6 py-4">
              <button 
                onClick={() => setShowAddObjectiveModal(false)}
                className="w-full py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Result Status View */}
      {selectedKeyResultId && (() => {
        const kr = keyResults.find(k => k.id === selectedKeyResultId);
        return kr ? (
          <KeyResultStatusView 
            keyResult={kr} 
            onClose={() => setSelectedKeyResultId(null)} 
          />
        ) : null;
      })()}
    </div>
  );
};