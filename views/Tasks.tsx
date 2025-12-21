import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { EntityType, View } from '../types';
import { TopNav } from '../components/TopNav';

interface TasksProps {
  onEdit: (type: EntityType, id?: string) => void;
  onNavigate?: (view: View) => void; 
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const Tasks: React.FC<TasksProps> = ({ onEdit, onNavigate, onMenuClick, onProfileClick }) => {
  const { tasks, habits, updateTask, updateHabit, addTask } = useData();
  const [referenceDate, setReferenceDate] = useState(new Date());

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
        newHistory[dayIndex] = !newHistory[dayIndex];
        
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

      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-24 pt-2">
        
        {/* Functional Date Selector */}
        <div className="flex items-center justify-between bg-white rounded-xl p-2 mb-6 border border-slate-100 shadow-sm mt-2">
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

        <section className="mb-8">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3 pl-1">My Habits</h3>
            <div className="space-y-3">
                {habits.length === 0 && <div className="text-center text-text-tertiary py-4 text-sm bg-white rounded-2xl border border-dashed border-slate-200">No habits defined.</div>}
                
                {habits.map(habit => {
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

                        return (
                        <div 
                            key={habit.id} 
                            onClick={() => onEdit('habit', habit.id)}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-4 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.99]"
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
                })}
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
           {tasks.length === 0 && <div className="text-center text-text-tertiary py-4 text-sm">No tasks for today.</div>}
          {tasks.map((task, i) => (
            <div key={task.id} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white/60 transition-colors border border-transparent hover:border-slate-200">
              <label className="relative flex items-center justify-center pt-1 cursor-pointer">
                <input 
                    className="peer appearance-none size-6 border-2 border-slate-300 rounded-lg bg-transparent checked:bg-primary checked:border-primary focus:ring-0 focus:outline-none transition-all" 
                    type="checkbox" 
                    checked={task.completed}
                    onChange={() => toggleTodo(task.id)}
                />
                <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 text-[16px] pointer-events-none font-bold top-[6px]">check</span>
              </label>
              <div className="flex-1 pt-[2px]" onClick={() => onEdit('task', task.id)}>
                <p className={`text-[15px] font-medium leading-snug transition-colors ${task.completed ? 'text-text-tertiary line-through' : 'text-text-main group-hover:text-primary'}`}>{task.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-text-secondary">
                    {task.tag}
                  </span>
                </div>
              </div>
              <button className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1">
                <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
              </button>
            </div>
          ))}
          <div className="pt-8 pb-4 text-center opacity-60">
            <div className={`inline-flex items-center justify-center p-3 mb-2 rounded-full transition-colors ${completedCount === tasks.length && tasks.length > 0 ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-400'}`}>
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <p className="text-xs text-text-tertiary font-medium">{completedCount} / {tasks.length} tasks completed today</p>
          </div>
        </section>
      </main>

      <div className="absolute bottom-24 right-6 z-40">
        <button onClick={() => addTask({ id: Date.now().toString(), title: "New Task", tag: "Work", completed: false, priority: false, time: "Now" })} className="group flex items-center justify-center size-14 rounded-2xl bg-primary shadow-glow hover:shadow-[0_0_20px_rgba(217,88,41,0.5)] active:scale-95 transition-all duration-300">
          <span className="material-symbols-outlined text-white text-3xl group-hover:rotate-90 transition-transform duration-300">add</span>
        </button>
      </div>
    </div>
  );
};