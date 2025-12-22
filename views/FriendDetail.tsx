import React from 'react';
import { Friend, View } from '../types';
import { useData } from '../context/DataContext';

interface FriendDetailProps {
  friend: Friend | null;
  onBack: () => void;
}

export const FriendDetail: React.FC<FriendDetailProps> = ({ friend, onBack }) => {
  const { tasks } = useData();
  if (!friend) return null;

  const friendTasks = tasks.filter(t => t.friendId === friend.id);

  const handleCall = () => {
    window.location.href = 'tel:+1234567890';
  };

  const handleMessage = () => {
    alert(`Opening chat with ${friend.name}...`);
  };

  const handleEmail = () => {
    window.location.href = 'mailto:friend@example.com';
  };

  const handleEditNote = () => {
    const note = prompt("Edit note:", "Loves sci-fi books (recommended \"Dune\"), allergic to peanuts.");
  };

  return (
    <div className="w-full max-w-md bg-background h-full min-h-screen relative overflow-x-hidden flex flex-col pb-8">
      <div className="sticky top-0 z-50 flex items-center bg-background/90 backdrop-blur-md p-4 justify-between transition-all duration-300">
        <button onClick={onBack} className="text-text-main flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>arrow_back_ios_new</span>
        </button>
        <h2 className="text-text-main text-sm font-medium uppercase tracking-widest opacity-60 flex-1 text-center">Friend Detail</h2>
        <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors group">
          <span className="material-symbols-outlined text-text-main" style={{fontSize: '20px'}}>more_horiz</span>
        </button>
      </div>

      <div className="flex flex-col items-center pt-4 pb-8 px-4">
        <div className="relative mb-6 group cursor-pointer">
          <div className="absolute -inset-4 bg-gradient-to-b from-orange-100/50 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
          <div className="relative h-28 w-28 rounded-full p-1 bg-white shadow-soft">
            <div className="h-full w-full rounded-full overflow-hidden relative">
              <img src={friend.image} alt={friend.name} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-text-main text-2xl font-semibold tracking-tight text-center">{friend.name}</h1>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white border border-slate-200/50 text-text-secondary text-[11px] font-medium tracking-wide uppercase">{friend.role}</span>
            <span className="size-1.5 rounded-full bg-primary/40"></span>
            <span className="text-text-secondary text-xs">{friend.location || 'Unknown'}</span>
          </div>
        </div>
      </div>

      <div className="px-8 mb-8">
        <div className="flex items-center justify-center gap-6">
          <button onClick={handleCall} className="flex flex-col items-center gap-2 group">
            <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-text-secondary group-hover:text-primary group-hover:scale-105 group-hover:shadow-soft transition-all duration-300">
              <span className="material-symbols-outlined" style={{fontSize: '24px'}}>call</span>
            </div>
            <span className="text-text-secondary text-[11px] font-medium tracking-wide">Call</span>
          </button>
          <button onClick={handleMessage} className="flex flex-col items-center gap-2 group">
            <div className="size-14 rounded-2xl bg-primary text-white shadow-floating flex items-center justify-center group-hover:bg-primary-soft group-hover:scale-105 transition-all duration-300">
              <span className="material-symbols-outlined filled" style={{fontSize: '24px'}}>chat_bubble</span>
            </div>
            <span className="text-text-main font-medium text-[11px] tracking-wide">Message</span>
          </button>
          <button onClick={handleEmail} className="flex flex-col items-center gap-2 group">
            <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-text-secondary group-hover:text-primary group-hover:scale-105 group-hover:shadow-soft transition-all duration-300">
              <span className="material-symbols-outlined" style={{fontSize: '24px'}}>mail</span>
            </div>
            <span className="text-text-secondary text-[11px] font-medium tracking-wide">Email</span>
          </button>
        </div>
      </div>

      <div className="w-full px-6 mb-8">
        <div className="w-full h-px bg-slate-200/50"></div>
      </div>

      <div className="flex flex-col px-5 gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-text-main text-lg font-semibold tracking-tight">Linked Tasks</h3>
          <span className="text-xs text-text-tertiary font-medium">{friendTasks.length} {friendTasks.length === 1 ? 'task' : 'tasks'}</span>
        </div>
        {friendTasks.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 text-center">
            <span className="material-symbols-outlined text-text-tertiary text-4xl mb-3 block">task_alt</span>
            <p className="text-text-secondary text-sm font-medium">No tasks linked to {friend.name}</p>
            <p className="text-text-tertiary text-xs mt-2">Link tasks to this person in the Tasks view</p>
            </div>
        ) : (
          <div className="space-y-2">
            {friendTasks.map(task => (
              <div key={task.id} className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition-shadow hover:shadow-soft">
                <div className="flex items-start gap-3">
                  <div className={`size-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${task.completed ? 'bg-primary text-white' : 'bg-slate-100 border border-slate-200'}`}>
                    {task.completed && <span className="material-symbols-outlined text-[14px]">check</span>}
                </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-text-main text-sm font-semibold leading-tight ${task.completed ? 'line-through text-text-tertiary' : ''}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-text-secondary">
                        {task.tag}
                      </span>
                      {task.time && (
                        <span className="text-text-tertiary text-[10px] font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {task.time}
                        </span>
                      )}
                </div>
              </div>
            </div>
          </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col px-5 gap-4 mb-8">
        <h3 className="text-text-main text-lg font-semibold tracking-tight">Notes</h3>
        <div onClick={handleEditNote} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md cursor-pointer">
          <span className="absolute top-5 right-5 text-text-tertiary material-symbols-outlined group-hover:text-primary transition-colors" style={{fontSize: '20px'}}>edit</span>
          <div className="flex gap-3 mb-2 items-center">
            <span className="material-symbols-outlined text-primary" style={{fontSize: '18px'}}>lightbulb</span>
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide">Key Facts</p>
          </div>
          <p className="text-text-main text-[15px] leading-relaxed font-normal">
            Loves sci-fi books (recommended "Dune"), allergic to peanuts. Recently moved to Chicago for a new job in graphic design.
          </p>
        </div>
      </div>
    </div>
  );
};