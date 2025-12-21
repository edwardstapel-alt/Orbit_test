import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { View } from '../types';

interface ObjectivesOverviewProps {
  onViewObjective: (id: string) => void;
  onEdit: (type: any, id?: string, parentId?: string) => void;
  onUpdateKeyResult: (id: string) => void;
  onNavigate?: (view: View) => void; 
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const ObjectivesOverview: React.FC<ObjectivesOverviewProps> = ({ onViewObjective, onEdit, onUpdateKeyResult, onNavigate, onMenuClick, onProfileClick }) => {
  const { objectives, keyResults } = useData();
  const [filter, setFilter] = useState<'all' | 'personal' | 'professional'>('all');

  const filteredObjectives = objectives.filter(obj => {
    if (filter === 'all') return true;
    return obj.category === filter;
  });

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
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title="Strategy" 
        subtitle="Objectives & Key Results" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
      />

      <div className="px-6 py-4 flex items-center gap-4">
        <div className="flex-1 flex p-1.5 bg-slate-200 rounded-xl">
            {['all', 'professional', 'personal'].map(f => (
                <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-white text-text-main shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                >
                    {f}
                </button>
            ))}
        </div>
        <button onClick={() => onEdit('objective')} className="size-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-glow hover:scale-105 transition-transform shrink-0">
            <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32 space-y-6">
        {filteredObjectives.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">flag</span>
                <p className="text-sm text-text-secondary">No objectives found.</p>
            </div>
        )}

        {filteredObjectives.map(obj => {
             const linkedKRs = keyResults.filter(kr => kr.objectiveId === obj.id);
             const calculatedProgress = linkedKRs.length > 0 
                ? Math.round(linkedKRs.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / linkedKRs.length)
                : obj.progress;

             return (
                <div key={obj.id} onClick={() => onViewObjective(obj.id)} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-soft transition-all cursor-pointer group active:scale-[0.99]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                             <div className={`size-2 rounded-full ${obj.status === 'On Track' ? 'bg-green-500' : obj.status === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                             <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">{obj.category}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(obj.status)}`}>{obj.status}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-text-main mb-1 group-hover:text-primary transition-colors">{obj.title}</h3>
                    <p className="text-sm text-text-secondary mb-6 line-clamp-2">{obj.description || 'No description'}</p>

                    <div className="flex items-end justify-between mb-2">
                        <div className="flex -space-x-2">
                            <img src={obj.ownerImage} alt="Owner" className="size-8 rounded-full border-2 border-white" />
                            {linkedKRs.length > 0 && (
                                <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white text-[10px] font-bold text-text-tertiary">
                                    +{linkedKRs.length}
                                </div>
                            )}
                        </div>
                        <span className="text-2xl font-bold text-text-main">{calculatedProgress}%</span>
                    </div>
                    
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getProgressBarColor(obj.status)}`} style={{width: `${Math.min(calculatedProgress, 100)}%`}}></div>
                    </div>

                    {linkedKRs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
                            {linkedKRs.slice(0, 2).map(kr => {
                                const krProgress = Math.min(Math.round((kr.current / kr.target) * 100), 100);
                                return (
                                    <div key={kr.id} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-medium text-text-secondary truncate">{kr.title}</span>
                                                <span className="text-xs font-bold text-text-main">{krProgress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                                <div className="h-full bg-gray-300 rounded-full" style={{width: `${krProgress}%`}}></div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {linkedKRs.length > 2 && (
                                <p className="text-[10px] text-text-tertiary text-center font-medium">+ {linkedKRs.length - 2} more key results</p>
                            )}
                        </div>
                    )}
                </div>
             );
        })}
      </main>
    </div>
  );
};