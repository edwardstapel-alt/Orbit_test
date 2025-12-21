import React from 'react';
import { Friend, View } from '../types';

interface FriendDetailProps {
  friend: Friend | null;
  onBack: () => void;
}

export const FriendDetail: React.FC<FriendDetailProps> = ({ friend, onBack }) => {
  if (!friend) return null;

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
          <h3 className="text-text-main text-lg font-semibold tracking-tight">Upcoming</h3>
          <button onClick={() => alert("Open New Plan Modal")} className="text-primary hover:bg-primary/5 px-3 py-1 rounded-full text-xs font-medium transition-colors">
            + New Plan
          </button>
        </div>
        <div className="group relative overflow-hidden rounded-3xl bg-white p-1 shadow-sm transition-shadow hover:shadow-soft">
          <div className="p-4 flex gap-4 items-start relative z-10">
            <div className="flex flex-col items-center justify-center w-14 h-14 shrink-0 rounded-2xl bg-slate-50 text-text-main border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Oct</span>
              <span className="text-xl font-bold leading-none mt-0.5 text-primary">24</span>
            </div>
            <div className="flex flex-col flex-1 gap-1.5 min-w-0">
              <p className="text-text-main text-base font-semibold leading-tight truncate">Birthday Dinner</p>
              <div className="flex flex-wrap gap-y-1 gap-x-3 text-text-secondary text-sm">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-text-tertiary" style={{fontSize: '16px'}}>schedule</span>
                  <span>7:00 PM</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-text-tertiary" style={{fontSize: '16px'}}>location_on</span>
                  <span className="truncate">Downtown Bistro</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 pt-1 flex items-center justify-end gap-2 relative z-10">
            <button onClick={() => alert("Edit plan")} className="size-8 rounded-full flex items-center justify-center text-text-tertiary hover:bg-slate-50 hover:text-text-main transition-colors">
              <span className="material-symbols-outlined" style={{fontSize: '18px'}}>edit</span>
            </button>
            <button onClick={() => alert("Cancel plan?")} className="size-8 rounded-full flex items-center justify-center text-text-tertiary hover:bg-slate-50 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined" style={{fontSize: '18px'}}>close</span>
            </button>
          </div>
          <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-white via-white/80 to-transparent z-0"></div>
          <div className="absolute right-0 top-0 w-1/3 h-full bg-cover bg-center opacity-20 saturate-0 group-hover:saturate-50 transition-all duration-700" style={{backgroundImage: 'url("https://picsum.photos/id/431/200/300")'}}></div>
        </div>
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