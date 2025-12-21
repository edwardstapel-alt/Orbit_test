import React, { useState } from 'react';
import { useData } from '../context/DataContext';

interface ObjectiveDetailProps {
  objectiveId: string;
  onBack: () => void;
  onEdit: () => void;
  onUpdateKR: (krId: string) => void;
  onAddKR: () => void;
}

export const ObjectiveDetail: React.FC<ObjectiveDetailProps> = ({ objectiveId, onBack, onEdit, onUpdateKR, onAddKR }) => {
  const { objectives, keyResults, teamMembers, updateObjective } = useData();
  const [activeModal, setActiveModal] = useState<'owner' | 'date' | null>(null);

  const objective = objectives.find(o => o.id === objectiveId);
  
  if (!objective) return null;

  const linkedKRs = keyResults.filter(kr => kr.objectiveId === objectiveId);
  
  // Calculate average progress
  const calculatedProgress = linkedKRs.length > 0 
    ? Math.round(linkedKRs.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / linkedKRs.length)
    : objective.progress;

  const getStatusColor = (status: string) => {
    if (status === 'On Track') return 'bg-green-500';
    if (status === 'At Risk') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'On Track') return 'bg-green-100 text-green-700';
    if (status === 'At Risk') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const handleUpdateOwner = (member: any) => {
      updateObjective({ ...objective, owner: member.name, ownerImage: member.image });
      setActiveModal(null);
  };

  const handleUpdateDate = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateObjective({ ...objective, dueDate: e.target.value });
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen relative">
       {/* Header */}
      <div className="sticky top-0 z-30 flex items-center bg-background/95 backdrop-blur-md p-4 justify-between border-b border-slate-200/50">
        <button onClick={onBack} className="text-text-main flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Objective Detail</span>
        <button onClick={onEdit} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors text-text-main">
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>edit</span>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">
        {/* Title Section */}
        <div className="mb-8 text-center">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4 ${getStatusBadge(objective.status)}`}>
                <span className={`size-1.5 rounded-full ${getStatusColor(objective.status)}`}></span>
                {objective.status}
            </div>
            <h1 className="text-2xl font-bold text-text-main leading-tight mb-2">{objective.title}</h1>
            <p className="text-text-secondary text-sm">{objective.description || "No description provided."}</p>
        </div>

        {/* Progress Circle */}
        <div className="flex justify-center mb-10">
            <div className="relative size-40">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                    <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke={objective.status === 'On Track' ? '#22C55E' : objective.status === 'At Risk' ? '#F59E0B' : '#EF4444'} 
                        strokeWidth="8" 
                        strokeDasharray="283" 
                        strokeDashoffset={283 - (283 * calculatedProgress) / 100} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-text-main">{calculatedProgress}%</span>
                    <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest mt-1">Complete</span>
                </div>
            </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div onClick={() => setActiveModal('owner')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-primary/30 transition-colors group">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">Owner</span>
                <div className="flex items-center gap-2">
                    <img src={objective.ownerImage || 'https://via.placeholder.com/100'} alt="Owner" className="size-6 rounded-full" />
                    <span className="text-sm font-semibold text-text-main truncate group-hover:text-primary">{objective.owner}</span>
                </div>
            </div>
             <div onClick={() => setActiveModal('date')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-primary/30 transition-colors group">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">Due Date</span>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-secondary text-[18px]">calendar_today</span>
                    <span className="text-sm font-semibold text-text-main truncate group-hover:text-primary">{objective.dueDate}</span>
                </div>
            </div>
        </div>

        {/* Key Results List */}
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-text-main">Key Results</h3>
                <button onClick={onAddKR} className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">
                    + Add Result
                </button>
            </div>

            {linkedKRs.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-text-tertiary text-sm">
                    No Key Results yet.
                </div>
            )}

            {linkedKRs.map(kr => {
                const percent = Math.min(Math.round((kr.current / kr.target) * 100), 100);
                return (
                    <div key={kr.id} onClick={() => onUpdateKR(kr.id)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer group hover:shadow-md hover:border-primary/20">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-base font-semibold text-text-main leading-snug flex-1 mr-2 group-hover:text-primary transition-colors">{kr.title}</h4>
                            <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getStatusBadge(kr.status)}`}>{kr.status}</span>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-xs text-text-secondary font-medium">
                                {kr.current} / <span className="text-text-tertiary">{kr.target} {kr.unit}</span>
                            </span>
                            <span className="text-xs font-bold text-text-main">{percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getStatusColor(kr.status)}`} style={{width: `${percent}%`}}></div>
                        </div>
                        <div className="mt-2 flex justify-end">
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Update Progress →</span>
                        </div>
                    </div>
                );
            })}
        </div>
      </main>

      {/* MODALS (Using absolute to stay within app container) */}
      {activeModal && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-fade-in-up">
                
                {activeModal === 'owner' && (
                    <>
                        <h3 className="text-lg font-bold text-text-main mb-4">Assign Owner</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {teamMembers.map(member => (
                                <button 
                                    key={member.id} 
                                    onClick={() => handleUpdateOwner(member)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors ${objective.owner === member.name ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'}`}
                                >
                                    <img src={member.image} alt={member.name} className="size-10 rounded-full" />
                                    <div className="text-left">
                                        <p className="font-semibold text-text-main text-sm">{member.name}</p>
                                        <p className="text-xs text-text-tertiary">{member.role}</p>
                                    </div>
                                    {objective.owner === member.name && <span className="material-symbols-outlined text-primary ml-auto">check</span>}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                             <p className="text-xs text-text-tertiary">Manage team in Settings</p>
                        </div>
                    </>
                )}

                {activeModal === 'date' && (
                    <>
                         <h3 className="text-lg font-bold text-text-main mb-4">Set Due Date</h3>
                         <div className="p-2">
                             <input 
                                type="date" 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-text-main font-medium"
                                value={objective.dueDate}
                                onChange={handleUpdateDate}
                             />
                         </div>
                         <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl">
                             Done
                         </button>
                    </>
                )}
            </div>
        </div>
      )}

    </div>
  );
};
