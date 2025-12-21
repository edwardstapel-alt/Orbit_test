import React, { useState } from 'react';
import { TopNav } from '../components/TopNav';
import { View } from '../types';

interface GrowthProps {
    onNavigate?: (view: View) => void;
    onMenuClick: () => void;
    onProfileClick: () => void;
}

export const Growth: React.FC<GrowthProps> = ({ onNavigate, onMenuClick, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<'learn' | 'breathe'>('learn');

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title="Growth Hub" 
        subtitle="Learn & Breathe" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick} 
      />

      <div className="px-6 py-4 z-20">
        <div className="flex p-1.5 bg-slate-200 rounded-2xl relative">
          <div className={`w-1/2 absolute top-1.5 bottom-1.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] bg-white transition-all duration-300 ease-out z-0 ${activeTab === 'learn' ? 'left-1.5' : 'left-[50%]'}`}></div>
          <button 
            onClick={() => setActiveTab('learn')}
            className={`flex-1 relative z-10 py-2.5 text-sm font-semibold text-center transition-colors duration-200 ${activeTab === 'learn' ? 'text-primary' : 'text-text-secondary hover:text-text-main'}`}
          >
            Learn
          </button>
          <button 
            onClick={() => setActiveTab('breathe')}
            className={`flex-1 relative z-10 py-2.5 text-sm font-semibold text-center transition-colors duration-200 ${activeTab === 'breathe' ? 'text-primary' : 'text-text-secondary hover:text-text-main'}`}
          >
            Breathe
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-32 space-y-10">
        {activeTab === 'learn' && (
            <>
            <section className="space-y-8 pt-2">
            <div className="px-6 space-y-4">
                <div className="flex items-center justify-between px-1">
                <div>
                    <p className="text-primary font-bold text-[11px] uppercase tracking-widest mb-1">Daily Pick</p>
                    <h2 className="text-xl font-bold text-text-main">Today's Insight</h2>
                </div>
                <button className="text-text-tertiary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">more_horiz</span>
                </button>
                </div>
                
                <div className="group relative overflow-hidden rounded-3xl bg-white shadow-soft border border-slate-100 transition-all active:scale-[0.99] cursor-pointer" onClick={() => alert("Opening article...")}>
                <div className="h-52 w-full bg-cover bg-center relative" style={{backgroundImage: 'url("https://picsum.photos/id/195/600/400")'}}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                    <div className="absolute top-4 right-4">
                    <span className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">headphones</span>
                        5 min
                    </span>
                    </div>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-text-main mb-2">The Art of Saying No</h3>
                    <p className="text-text-secondary text-sm leading-relaxed mb-6">Setting boundaries is crucial for growth. Learn how to decline requests gracefully without burning bridges.</p>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-end gap-0.5 h-4 text-primary">
                        <div className="w-1 bg-primary/40 h-2 rounded-full"></div>
                        <div className="w-1 bg-primary/70 h-3 rounded-full"></div>
                        <div className="w-1 bg-primary h-4 rounded-full"></div>
                        <div className="w-1 bg-primary/80 h-2.5 rounded-full"></div>
                        <div className="w-1 bg-primary/30 h-1.5 rounded-full"></div>
                        </div>
                        <span className="text-xs text-text-tertiary font-medium tracking-wide">AUDIO LESSON</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); alert("Playing Audio Lesson"); }} className="bg-primary hover:bg-[#b54015] text-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg shadow-primary/30 transition-all hover:scale-105">
                        <span className="material-symbols-outlined text-[22px] ml-0.5">play_arrow</span>
                    </button>
                    </div>
                </div>
                </div>
            </div>

            <div className="w-full overflow-x-auto no-scrollbar pl-6 pr-6 py-2">
                <div className="flex gap-3">
                {['All Topics', 'Productivity', 'Wellbeing', 'Career'].map((topic, i) => (
                    <button key={topic} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium shadow-sm transition-colors ${i === 0 ? 'bg-text-main text-white shadow-md' : 'bg-white text-text-secondary border border-slate-200 hover:border-primary/30 hover:text-primary'}`}>
                    {topic}
                    </button>
                ))}
                </div>
            </div>

            <div className="px-6 space-y-5">
                <h3 className="text-lg font-bold text-text-main">Up Next</h3>
                <div className="group flex items-center gap-4 p-3 pr-4 rounded-2xl bg-white hover:bg-primary-light transition-colors border border-slate-100 shadow-sm cursor-pointer" onClick={() => alert("Opening next item...")}>
                <div className="h-16 w-16 shrink-0 rounded-xl bg-cover bg-center shadow-inner" style={{backgroundImage: 'url("https://picsum.photos/id/20/200/200")'}}></div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-text-main truncate group-hover:text-primary-dark transition-colors">Habit Stacking 101</h4>
                    <p className="text-xs text-text-tertiary mt-1 font-medium">James Clear • 4 min</p>
                </div>
                <button className="h-8 w-8 flex items-center justify-center rounded-full text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                </button>
                </div>
            </div>
            </section>

            <div className="sticky bottom-24 left-5 right-5 z-40 px-5 mt-4">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-floating border border-white/50 flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-cover bg-center shrink-0 shadow-sm" style={{backgroundImage: 'url("https://picsum.photos/id/195/200/200")'}}></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-text-main text-sm font-bold truncate">The Art of Saying No</p>
                        <p className="text-text-tertiary text-xs font-medium truncate mt-0.5">Playing • 1:24 left</p>
                    </div>
                    <div className="flex items-center gap-1 pr-1">
                        <button className="p-1 text-text-main hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[34px] filled">pause_circle</span>
                        </button>
                    </div>
                    <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-slate-100 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-primary rounded-full w-1/3"></div>
                    </div>
                </div>
            </div>
            </>
        )}

        {activeTab === 'breathe' && (
            <section className="flex flex-col items-center justify-center min-h-[60vh] px-6 animate-fade-in">
                <div className="text-center z-10 mb-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase mb-3">Focus Mode</span>
                    <h3 className="text-3xl font-medium text-text-main tracking-tight">Inhale... Exhale</h3>
                    <p className="text-text-tertiary text-sm mt-2">Box breathing technique for focus</p>
                </div>
                <div className="relative w-72 h-72 flex items-center justify-center mb-12">
                    <div className="absolute inset-0 rounded-full border border-primary/30 animate-breathe" style={{animationDelay: '0s'}}></div>
                    <div className="absolute inset-12 rounded-full border border-primary/30 animate-breathe" style={{animationDelay: '2s'}}></div>
                    <div className="absolute inset-24 rounded-full border border-primary/30 animate-breathe" style={{animationDelay: '4s'}}></div>
                    <div className="relative w-32 h-32 rounded-full bg-white shadow-[0_0_50px_rgba(217,88,41,0.2)] flex items-center justify-center z-10">
                        <span className="material-symbols-outlined text-primary text-[48px]">spa</span>
                    </div>
                </div>
                <button onClick={() => alert("Session Started")} className="px-8 py-3 rounded-full bg-primary text-white font-medium shadow-glow hover:scale-105 transition-transform">
                    Start Session
                </button>
            </section>
        )}
      </main>
    </div>
  );
};