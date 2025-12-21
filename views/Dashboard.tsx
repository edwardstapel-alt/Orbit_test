import React, { useState } from 'react';
import { View } from '../types';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';

interface DashboardProps {
  onNavigate: (view: View) => void;
  onEdit: (type: any, id?: string, parentId?: string) => void;
  onViewObjective: (id: string) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

const ObjectiveCard: React.FC<{ 
    objective: any, 
    keyResults: any[], 
    onView: () => void, 
    onEdit: (type: 'keyResult', id?: string, parentId?: string) => void,
    onAddKR: () => void 
}> = ({ objective, keyResults, onView, onEdit, onAddKR }) => {
  
  const calculatedProgress = keyResults.length > 0 
    ? Math.round(keyResults.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / keyResults.length)
    : objective.progress;

  const getStatusColor = (status: string) => {
    if (status === 'On Track') return 'bg-green-100 text-green-700';
    if (status === 'At Risk') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const getProgressBarColor = (status: string) => {
    if (status === 'On Track') return 'bg-green-500';
    if (status === 'At Risk') return 'bg-amber-500';
    return 'bg-red-500';
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100 mb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 cursor-pointer group" onClick={onView}>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusColor(objective.status)}`}>
                    {objective.status}
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
            <div key={kr.id} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.stopPropagation(); onEdit('keyResult', kr.id, objective.id); }}>
                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${kr.status === 'On Track' ? 'bg-green-500' : kr.status === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-main truncate group-hover:text-primary transition-colors">{kr.title}</span>
                        <span className="text-xs font-bold text-text-tertiary">{krProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full ${kr.status === 'On Track' ? 'bg-green-400' : 'bg-gray-400'} opacity-70`} style={{width: `${krProgress}%`}}></div>
                    </div>
                </div>
            </div>
           )
        })}
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onEdit, onViewObjective, onMenuClick, onProfileClick }) => {
  const [mode, setMode] = useState<'personal' | 'professional'>('professional');
  const { tasks, habits, objectives, keyResults, updateTask, userProfile, showCategory } = useData();

  // Filter Data based on mode (only if showCategory is enabled)
  const filteredTasks = showCategory ? tasks.filter(t => {
      if (mode === 'professional') return ['Work', 'Finance', 'Strategy', 'Meeting'].includes(t.tag);
      return !['Work', 'Finance', 'Strategy', 'Meeting'].includes(t.tag);
  }) : tasks;

  const filteredObjectives = showCategory ? objectives.filter(obj => obj.category === mode) : objectives;

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if(task) updateTask({ ...task, completed: !task.completed });
  };

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto no-scrollbar pb-32">
      <TopNav 
        title={`Focus, ${userProfile.firstName || 'there'}`} 
        subtitle="Good Morning" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick} 
      />

      {/* Toggle - Only show if showCategory is enabled */}
      {showCategory && (
        <section className="px-6 mt-4">
          <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#E6E6E6] p-1.5 shadow-inner">
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
      <section className="w-full mt-8 px-6">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-text-main text-lg font-bold tracking-tight">Objectives & Key Results</h3>
          <button className="text-primary text-sm font-medium hover:opacity-80 transition-opacity" onClick={() => onEdit('objective')}>
            + Add Goal
          </button>
        </div>
        
        {filteredObjectives.length === 0 && (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                <p className="text-text-tertiary text-sm mb-2">No objectives defined for {mode}.</p>
                <button onClick={() => onEdit('objective')} className="text-primary font-bold text-sm">Create One</button>
            </div>
        )}

        {filteredObjectives.map(obj => (
            <ObjectiveCard 
                key={obj.id} 
                objective={obj} 
                keyResults={keyResults.filter(kr => kr.objectiveId === obj.id)}
                onView={() => onViewObjective(obj.id)}
                onEdit={onEdit}
                onAddKR={() => onEdit('keyResult', undefined, obj.id)}
            />
        ))}
      </section>

      {/* Daily Focus */}
      <section className="px-6 mt-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-text-main text-lg font-bold tracking-tight">Daily Focus</h3>
        </div>
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden min-h-[100px]">
          {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-text-tertiary text-sm">No tasks for this category.</div>
          ) : (
            <div className="flex flex-col">
                {filteredTasks.map((item) => (
                <div key={item.id} className="group flex items-center gap-4 p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer select-none">
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
                ))}
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
      </section>

      {/* Habit Streaks */}
      <section className="w-full mt-8">
        <h3 className="text-text-main text-lg font-bold tracking-tight px-6 mb-4">Habit Streaks</h3>
        <div className="flex overflow-x-auto no-scrollbar px-6 pb-6 gap-4 snap-x">
            <button 
              onClick={() => onEdit('habit')} 
              className="snap-start flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white shadow-sm border-2 border-dashed border-slate-200 shrink-0 min-w-[140px] aspect-square cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <span className="material-symbols-outlined text-3xl text-text-tertiary group-hover:text-primary transition-colors">add_circle</span>
              <span className="text-xs font-semibold text-text-secondary group-hover:text-primary transition-colors">Add Habit</span>
            </button>
          {habits.map((habit) => (
            <div 
                key={habit.id} 
                onClick={() => onEdit('habit', habit.id)}
                className="snap-start flex flex-col items-start gap-3 p-4 rounded-3xl bg-white shadow-soft shrink-0 min-w-[140px] aspect-square justify-between group hover:shadow-md transition-all border border-transparent hover:border-gray-100 cursor-pointer"
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
    </div>
  );
};