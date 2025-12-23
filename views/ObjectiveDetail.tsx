import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { KeyResultStatusView } from './KeyResultStatusView';

interface ObjectiveDetailProps {
  objectiveId: string;
  onBack: () => void;
  onEdit: (type?: 'keyResult' | 'habit' | 'lifeArea', id?: string, parentId?: string, context?: { objectiveId?: string; lifeAreaId?: string }) => void;
  onAddKR: () => void;
}

export const ObjectiveDetail: React.FC<ObjectiveDetailProps> = ({ objectiveId, onBack, onEdit, onAddKR }) => {
  const { objectives, keyResults, habits, teamMembers, updateObjective, updateHabit, updateKeyResult, lifeAreas, getLifeAreaById, showCategory, formatKeyResultValue, getStatusUpdatesByKeyResult } = useData();
  const [activeModal, setActiveModal] = useState<'owner' | 'date' | 'category' | 'lifeArea' | 'startDate' | 'endDate' | 'timelineColor' | 'linkHabit' | 'linkKeyResult' | null>(null);
  const [selectedKeyResultId, setSelectedKeyResultId] = useState<string | null>(null);
  
  const handleAddNewLifeArea = () => {
    setActiveModal(null);
    onEdit && onEdit('lifeArea');
  };

  const objective = objectives.find(o => o.id === objectiveId);
  
  // Auto-navigate back if objective was deleted
  useEffect(() => {
    if (!objective && objectiveId) {
      // Objective was deleted, navigate back
      onBack();
    }
  }, [objective, objectiveId, onBack]);
  
  if (!objective) return null;

  const linkedKRs = keyResults.filter(kr => kr.objectiveId === objectiveId);
  // Get habits linked to this objective or its key results
  const linkedHabits = habits.filter(h => 
    h.objectiveId === objectiveId || 
    (h.linkedKeyResultId && linkedKRs.some(kr => kr.id === h.linkedKeyResultId))
  );
  
  // Calculate average progress
  const calculatedProgress = linkedKRs.length > 0 
    ? Math.round(linkedKRs.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / linkedKRs.length)
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
    if (status === 'On Track') return 'bg-green-500';
    if (status === 'At Risk') return 'bg-amber-500';
    if (status === 'No status') return 'bg-gray-400';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'On Track') return 'bg-green-100 text-green-700';
    if (status === 'At Risk') return 'bg-amber-100 text-amber-700';
    if (status === 'No status') return 'bg-gray-100 text-gray-600';
    return 'bg-red-100 text-red-700';
  };

  const handleUpdateOwner = (member: any) => {
      updateObjective({ ...objective, owner: member.name, ownerImage: member.image });
      setActiveModal(null);
  };

  const handleUpdateStartDate = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateObjective({ ...objective, startDate: e.target.value });
      setActiveModal(null);
  };

  const handleUpdateEndDate = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateObjective({ ...objective, endDate: e.target.value });
      setActiveModal(null);
  };

  const handleUpdateCategory = (category: 'personal' | 'professional') => {
      updateObjective({ ...objective, category });
      setActiveModal(null);
  };

  const handleUpdateLifeArea = (lifeAreaId: string) => {
      updateObjective({ ...objective, lifeAreaId });
      setActiveModal(null);
  };

  const handleUpdateTimelineColor = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateObjective({ ...objective, timelineColor: e.target.value });
      setActiveModal(null);
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
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4 ${getStatusBadge(getEffectiveStatus(objective.status, objective.id, false))}`}>
                <span className={`size-1.5 rounded-full ${getStatusColor(getEffectiveStatus(objective.status, objective.id, false))}`}></span>
                {getEffectiveStatus(objective.status, objective.id, false)}
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
                        stroke={(() => {
                          const effectiveStatus = getEffectiveStatus(objective.status, objective.id, false);
                          return effectiveStatus === 'On Track' ? '#22C55E' : effectiveStatus === 'At Risk' ? '#F59E0B' : effectiveStatus === 'No status' ? '#9CA3AF' : '#EF4444';
                        })()} 
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
        </div>

        {/* Additional Details */}
        <div className="space-y-4 mb-8">
            {/* Category */}
            {showCategory && (
                <div 
                    onClick={() => setActiveModal('category')} 
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-primary/30 transition-colors group"
                >
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">Category</span>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">
                                {objective.category === 'professional' ? 'work' : 'person'}
                            </span>
                            <span className="text-sm font-semibold text-text-main capitalize group-hover:text-primary">{objective.category}</span>
                        </div>
                        <span className="material-symbols-outlined text-text-tertiary text-sm opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                    </div>
                </div>
            )}

            {/* Life Area */}
            <div 
                onClick={() => setActiveModal('lifeArea')} 
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-primary/30 transition-colors group"
            >
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">Life Area</span>
                <div className="flex items-center justify-between">
                    {objective.lifeAreaId ? (() => {
                        const lifeArea = getLifeAreaById(objective.lifeAreaId);
                        return lifeArea ? (
                            <div className="flex items-center gap-2">
                                {lifeArea.icon && (
                                    <span 
                                        className="material-symbols-outlined text-[18px]"
                                        style={{ color: lifeArea.color }}
                                    >
                                        {lifeArea.icon}
                                    </span>
                                )}
                                <span className="text-sm font-semibold text-text-main group-hover:text-primary">{lifeArea.name}</span>
                            </div>
                        ) : (
                            <span className="text-sm font-medium text-text-tertiary group-hover:text-primary">Not set</span>
                        );
                    })() : (
                        <span className="text-sm font-medium text-text-tertiary group-hover:text-primary">Not set</span>
                    )}
                    <span className="material-symbols-outlined text-text-tertiary text-sm opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                </div>
            </div>

            {/* Timeline Dates */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-3">Timeline Dates</span>
                <div className="grid grid-cols-2 gap-3">
                    <div 
                        onClick={() => setActiveModal('startDate')} 
                        className="p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-primary/30 transition-colors group"
                    >
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Start</span>
                        <div className="flex items-center justify-between">
                            {objective.startDate ? (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-secondary text-sm">play_arrow</span>
                                    <span className="text-sm font-medium text-text-main group-hover:text-primary">
                                        {new Date(objective.startDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-sm font-medium text-text-tertiary group-hover:text-primary">Not set</span>
                            )}
                            <span className="material-symbols-outlined text-text-tertiary text-xs opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                        </div>
                    </div>
                    <div 
                        onClick={() => setActiveModal('endDate')} 
                        className="p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-primary/30 transition-colors group"
                    >
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">End</span>
                        <div className="flex items-center justify-between">
                            {objective.endDate ? (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-secondary text-sm">stop</span>
                                    <span className="text-sm font-medium text-text-main group-hover:text-primary">
                                        {new Date(objective.endDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-sm font-medium text-text-tertiary group-hover:text-primary">Not set</span>
                            )}
                            <span className="material-symbols-outlined text-text-tertiary text-xs opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                        </div>
                    </div>
                </div>
                {(objective.startDate || objective.endDate) && (
                    <div 
                        onClick={() => setActiveModal('timelineColor')} 
                        className="mt-3 pt-3 border-t border-slate-100 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors group"
                    >
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">Timeline Color</span>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="size-8 rounded-lg border-2 border-slate-200"
                                    style={{ backgroundColor: objective.timelineColor || (getLifeAreaById(objective.lifeAreaId)?.color || '#D95829') }}
                                />
                                <span className="text-xs font-medium text-text-secondary group-hover:text-primary">
                                    {objective.timelineColor || 'Default (Life Area color)'}
                                </span>
                            </div>
                            <span className="material-symbols-outlined text-text-tertiary text-xs opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Key Results List */}
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-text-main">Key Results</h3>
                <button onClick={() => setActiveModal('linkKeyResult')} className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">
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
                const krHabits = habits.filter(h => h.linkedKeyResultId === kr.id);
                return (
                    <div key={kr.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md hover:border-primary/20">
                      <div onClick={() => setSelectedKeyResultId(kr.id)} className="cursor-pointer active:scale-[0.98] transition-transform">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-base font-semibold text-text-main leading-snug flex-1 mr-2 group-hover:text-primary transition-colors">{kr.title}</h4>
                            <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getStatusBadge(getEffectiveStatus(kr.status, kr.id, true))}`}>{getEffectiveStatus(kr.status, kr.id, true)}</span>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                            <div className="flex-1">
                            <span className="text-xs text-text-secondary font-medium">
                                {formatKeyResultValue(kr, kr.current)} / <span className="text-text-tertiary">{formatKeyResultValue(kr, kr.target)}</span>
                            </span>
                                {kr.owner && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {kr.ownerImage ? (
                                            <div 
                                                className="size-4 rounded-full bg-cover bg-center"
                                                style={{ backgroundImage: `url("${kr.ownerImage}")` }}
                                            />
                                        ) : null}
                                        <span className="text-[10px] text-text-tertiary">{kr.owner}</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-bold text-text-main">{percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getStatusColor(getEffectiveStatus(kr.status, kr.id, true))}`} style={{width: `${percent}%`}}></div>
                        </div>
                        <div className="mt-2 flex justify-end items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit('keyResult', kr.id, objectiveId);
                              }}
                              className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                            >
                              Edit →
                            </button>
                        </div>
                      </div>
                      
                      {/* Linked Habits */}
                      {krHabits.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-text-tertiary text-sm">repeat</span>
                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Linked Habits</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {krHabits.map(habit => (
                              <div
                                key={habit.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit('habit', habit.id);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
                              >
                                <span className="material-symbols-outlined text-sm text-text-secondary group-hover:text-primary">{habit.icon}</span>
                                <span className="text-xs font-medium text-text-secondary group-hover:text-primary">{habit.name}</span>
                                {habit.streak > 0 && (
                                  <span className="text-[10px] text-primary font-bold">🔥{habit.streak}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                );
            })}
        </div>

        {/* Objective-Level Habits */}
        {linkedHabits.filter(h => h.objectiveId === objectiveId && !h.linkedKeyResultId).length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-1 mb-4">
              <h3 className="text-lg font-bold text-text-main">Linked Habits</h3>
              <button 
                onClick={() => setActiveModal('linkHabit')}
                className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Add Habit
              </button>
            </div>
            <div className="space-y-2">
              {linkedHabits.filter(h => h.objectiveId === objectiveId && !h.linkedKeyResultId).map(habit => {
                const weeklyData = habit.weeklyProgress || [false, false, false, false, false, false, false];
                const completedCount = weeklyData.filter(Boolean).length;
                return (
                  <div
                    key={habit.id}
                    onClick={() => onEdit('habit', habit.id)}
                    className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.99]"
                  >
                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{habit.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-main truncate">{habit.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {habit.streak > 0 && (
                          <span className="text-[10px] text-primary font-bold">🔥 {habit.streak} day streak</span>
                        )}
                        <span className="text-[10px] text-text-tertiary">{completedCount}/7 this week</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-text-tertiary text-[18px]">chevron_right</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Status Update View */}
      {selectedKeyResultId && (() => {
        const kr = keyResults.find(k => k.id === selectedKeyResultId);
        return kr ? (
          <KeyResultStatusView 
            keyResult={kr} 
            onClose={() => setSelectedKeyResultId(null)} 
          />
        ) : null;
      })()}

      {/* MODALS (Using absolute to stay within app container) */}
      {activeModal && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
            <div className="bg-white w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-fade-in-up">
                
                {activeModal === 'owner' && (
                    <>
                        <h3 className="text-lg font-bold text-text-main mb-4">Assign Owner</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {/* Primary owner first */}
                            {teamMembers
                              .sort((a, b) => {
                                if (a.role === 'You') return -1;
                                if (b.role === 'You') return 1;
                                return 0;
                              })
                              .map(member => (
                                <button 
                                    key={member.id} 
                                    onClick={() => handleUpdateOwner(member)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors ${objective.owner === member.name ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'}`}
                                >
                                    <img src={member.image} alt={member.name} className="size-10 rounded-full" />
                                    <div className="text-left flex-1">
                                        <p className="font-semibold text-text-main text-sm">{member.name}</p>
                                        <p className="text-xs text-text-tertiary">{member.role}</p>
                                    </div>
                                    {objective.owner === member.name && <span className="material-symbols-outlined text-primary ml-auto">check</span>}
                                    {member.role === 'You' && (
                                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase ml-2">Primary</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                             <p className="text-xs text-text-tertiary">Manage team in Settings</p>
                        </div>
                    </>
                )}

                {activeModal === 'startDate' && (
                    <>
                         <h3 className="text-lg font-bold text-text-main mb-4">Set Start Date</h3>
                         <div className="p-2">
                             <input 
                                type="date" 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-text-main font-medium"
                                value={objective.startDate || ''}
                                onChange={handleUpdateStartDate}
                             />
                         </div>
                         <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl">
                             Done
                         </button>
                    </>
                )}

                {activeModal === 'endDate' && (
                    <>
                         <h3 className="text-lg font-bold text-text-main mb-4">Set End Date</h3>
                         <div className="p-2">
                             <input 
                                type="date" 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-text-main font-medium"
                                value={objective.endDate || ''}
                                onChange={handleUpdateEndDate}
                             />
                         </div>
                         <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl">
                             Done
                         </button>
                    </>
                )}

                {activeModal === 'category' && showCategory && (
                    <>
                         <h3 className="text-lg font-bold text-text-main mb-4">Select Category</h3>
                         <div className="space-y-2">
                             {['professional', 'personal'].map(cat => (
                                 <button
                                     key={cat}
                                     onClick={() => handleUpdateCategory(cat as 'personal' | 'professional')}
                                     className={`w-full p-4 rounded-xl text-left transition-colors ${
                                         objective.category === cat 
                                             ? 'bg-primary/10 border-2 border-primary' 
                                             : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                     }`}
                                 >
                                     <div className="flex items-center gap-3">
                                         <span className="material-symbols-outlined text-xl">
                                             {cat === 'professional' ? 'work' : 'person'}
                                         </span>
                                         <span className="font-semibold text-text-main capitalize">{cat}</span>
                                         {objective.category === cat && (
                                             <span className="material-symbols-outlined text-primary ml-auto">check</span>
                                         )}
                                     </div>
                                 </button>
                             ))}
                         </div>
                         <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200">
                             Cancel
                         </button>
                    </>
                )}

                {activeModal === 'lifeArea' && (
                    <>
                         <h3 className="text-lg font-bold text-text-main mb-4">Select Life Area</h3>
                         
                         {/* Add New Button */}
                         <button
                             onClick={handleAddNewLifeArea}
                             className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                         >
                             <span className="material-symbols-outlined text-primary">add</span>
                             <span className="font-semibold text-primary">Add New Life Area</span>
                         </button>
                         
                         <div className="space-y-2 max-h-[300px] overflow-y-auto">
                             <button
                                 onClick={() => handleUpdateLifeArea('')}
                                 className={`w-full p-4 rounded-xl text-left transition-colors flex items-center gap-3 ${
                                     !objective.lifeAreaId 
                                         ? 'bg-primary/10 border-2 border-primary' 
                                         : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                 }`}
                             >
                                 <span className="material-symbols-outlined text-xl text-text-tertiary">close</span>
                                 <span className="font-semibold text-text-main">No Life Area</span>
                                 {!objective.lifeAreaId && (
                                     <span className="material-symbols-outlined text-primary ml-auto">check</span>
                                 )}
                             </button>
                             {lifeAreas.map(la => (
                                 <button
                                     key={la.id}
                                     onClick={() => handleUpdateLifeArea(la.id)}
                                     className={`w-full p-4 rounded-xl text-left transition-colors flex items-center gap-3 ${
                                         objective.lifeAreaId === la.id 
                                             ? 'bg-primary/10 border-2 border-primary' 
                                             : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                     }`}
                                 >
                                     {la.icon && (
                                         <span 
                                             className="material-symbols-outlined text-xl"
                                             style={{ color: la.color }}
                                         >
                                             {la.icon}
                                         </span>
                                     )}
                                     <span className="font-semibold text-text-main">{la.name}</span>
                                     {objective.lifeAreaId === la.id && (
                                         <span className="material-symbols-outlined text-primary ml-auto">check</span>
                                     )}
                                 </button>
                             ))}
                         </div>
                         <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200">
                             Cancel
                         </button>
                    </>
                )}

                {activeModal === 'startDate' && (
                    <>
                         <h3 className="text-lg font-bold text-text-main mb-4">Set Start Date</h3>
                         <div className="p-2">
                             <input 
                                type="date" 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-text-main font-medium"
                                value={objective.startDate || ''}
                                onChange={handleUpdateStartDate}
                             />
                         </div>
                         <div className="flex gap-3 mt-4">
                             <button 
                                 onClick={() => {
                                     updateObjective({ ...objective, startDate: '' });
                                     setActiveModal(null);
                                 }} 
                                 className="flex-1 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200"
                             >
                                 Remove
                             </button>
                             <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl">
                                 Done
                             </button>
                         </div>
                    </>
                )}

                {activeModal === 'endDate' && (
                    <>
                         <h3 className="text-lg font-bold text-text-main mb-4">Set End Date</h3>
                         <div className="p-2">
                             <input 
                                type="date" 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-text-main font-medium"
                                value={objective.endDate || ''}
                                onChange={handleUpdateEndDate}
                             />
                         </div>
                         <div className="flex gap-3 mt-4">
                             <button 
                                 onClick={() => {
                                     updateObjective({ ...objective, endDate: '' });
                                     setActiveModal(null);
                                 }} 
                                 className="flex-1 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200"
                             >
                                 Remove
                             </button>
                             <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl">
                                 Done
                             </button>
                         </div>
                    </>
                )}

                {activeModal === 'timelineColor' && (
                    <>
                         <h3 className="text-lg font-bold text-text-main mb-4">Set Timeline Color</h3>
                         
                         {/* Predefined Colors */}
                         <div className="grid grid-cols-4 gap-3 mb-4">
                             {[
                                 '#D95829', '#3B82F6', '#10B981', '#8B5CF6', 
                                 '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'
                             ].map(color => {
                                 const currentColor = objective.timelineColor || (getLifeAreaById(objective.lifeAreaId)?.color || '#D95829');
                                 return (
                                     <button
                                         key={color}
                                         onClick={() => {
                                             updateObjective({ ...objective, timelineColor: color });
                                             setActiveModal(null);
                                         }}
                                         className={`size-12 rounded-xl border-2 transition-all flex items-center justify-center ${
                                             currentColor === color 
                                                 ? 'border-gray-900 scale-110 shadow-lg' 
                                                 : 'border-gray-200 hover:scale-105'
                                         }`}
                                         style={{ backgroundColor: color }}
                                     >
                                         {currentColor === color && (
                                             <span className="material-symbols-outlined text-white text-xl">check</span>
                                         )}
                                     </button>
                                 );
                             })}
                         </div>
                         
                         {/* Custom Color */}
                         <div className="space-y-2 mb-4">
                             <span className="text-xs font-medium text-text-secondary">Custom Color</span>
                             <div className="flex items-center gap-3">
                             <input 
                                type="color" 
                                     className="size-12 rounded-xl cursor-pointer border-2 border-gray-200" 
                                value={objective.timelineColor || (getLifeAreaById(objective.lifeAreaId)?.color || '#D95829')}
                                onChange={handleUpdateTimelineColor}
                             />
                                 <input
                                     type="text"
                                     className="flex-1 p-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm font-mono"
                                     value={(objective.timelineColor || (getLifeAreaById(objective.lifeAreaId)?.color || '#D95829')).toUpperCase()}
                                     onChange={(e) => {
                                         const value = e.target.value.replace(/[^0-9A-F]/gi, '').slice(0, 6);
                                         if (value.length === 6) {
                                             updateObjective({ ...objective, timelineColor: '#' + value });
                                         }
                                     }}
                                     placeholder="#D95829"
                                 />
                             </div>
                         </div>
                         
                         <div className="flex gap-3 mt-4">
                             <button 
                                 onClick={() => {
                                     updateObjective({ ...objective, timelineColor: '' });
                                     setActiveModal(null);
                                 }} 
                                 className="flex-1 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200"
                             >
                                 Reset
                             </button>
                             <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl">
                                 Done
                             </button>
                         </div>
                    </>
                )}

                {activeModal === 'linkHabit' && (
                    <>
                        <h3 className="text-lg font-bold text-text-main mb-4">Link Habit</h3>
                        
                        {/* Create New Button */}
                        <button
                            onClick={() => {
                                setActiveModal(null);
                                const objective = objectives.find(o => o.id === objectiveId);
                                onEdit('habit', undefined, undefined, { 
                                    objectiveId: objectiveId,
                                    lifeAreaId: objective?.lifeAreaId 
                                });
                            }}
                            className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-primary">add</span>
                            <span className="font-semibold text-primary">Create New Habit</span>
                        </button>
                        
                        {/* Existing Habits (not yet linked to this Objective) */}
                        {habits.filter(h => h.objectiveId !== objectiveId && !h.linkedKeyResultId).length > 0 && (
                            <>
                                <div className="mb-3">
                                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing Habit</h4>
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {habits.filter(h => h.objectiveId !== objectiveId && !h.linkedKeyResultId).map(habit => (
                                        <button
                                            key={habit.id}
                                            onClick={() => {
                                                // Update habit to link to this objective
                                                updateHabit({ ...habit, objectiveId: objectiveId, lifeAreaId: objective.lifeAreaId });
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
                                                        {habit.lifeAreaId && (
                                                            <span className="text-[10px] text-text-tertiary">
                                                                {lifeAreas.find(la => la.id === habit.lifeAreaId)?.name || 'Linked to life area'}
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
                        
                        {habits.filter(h => h.objectiveId !== objectiveId && !h.linkedKeyResultId).length === 0 && (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">repeat</span>
                                <p className="text-sm text-text-tertiary">No other habits available</p>
                                <p className="text-xs text-text-tertiary mt-1">Create a new habit to link it to this objective</p>
                            </div>
                        )}
                        
                        <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200">
                            Cancel
                        </button>
                    </>
                )}

                {activeModal === 'linkKeyResult' && (
                    <>
                        <h3 className="text-lg font-bold text-text-main mb-4">Add Key Result</h3>
                        
                        {/* Create New Button */}
                        <button
                            onClick={() => {
                                setActiveModal(null);
                                onAddKR();
                            }}
                            className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-primary">add</span>
                            <span className="font-semibold text-primary">Create New Key Result</span>
                        </button>
                        
                        {/* Existing Key Results (not yet linked to this Objective) */}
                        {keyResults.filter(kr => kr.objectiveId !== objectiveId).length > 0 && (
                            <>
                                <div className="mb-3">
                                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing Key Result</h4>
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {keyResults.filter(kr => kr.objectiveId !== objectiveId).map(kr => {
                                        const percent = Math.min(Math.round((kr.current / kr.target) * 100), 100);
                                        const parentObj = objectives.find(o => o.id === kr.objectiveId);
                                        return (
                                            <button
                                                key={kr.id}
                                                onClick={() => {
                                                    // Check: Een key result kan niet aan meerdere goals hangen
                                                    if (kr.objectiveId && kr.objectiveId !== objectiveId) {
                                                        alert('Deze Key Result is al gekoppeld aan een ander Goal. Een Key Result kan niet aan meerdere Goals gekoppeld worden.');
                                                        return;
                                                    }
                                                    // Update key result to link to this objective
                                                    updateKeyResult({ ...kr, objectiveId: objectiveId });
                                                    setActiveModal(null);
                                                }}
                                                className="w-full p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-primary/30 hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <h5 className="font-semibold text-text-main mb-1">{kr.title}</h5>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs text-text-secondary">
                                                                {formatKeyResultValue(kr, kr.current)} / {formatKeyResultValue(kr, kr.target)}
                                                            </span>
                                                            <span className="text-xs font-bold text-text-main">{percent}%</span>
                                                        </div>
                                                        {parentObj && (
                                                            <p className="text-[10px] text-text-tertiary">
                                                                Currently linked to: {parentObj.title}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getStatusBadge(getEffectiveStatus(kr.status, kr.id, true))}`}>
                                                        {getEffectiveStatus(kr.status, kr.id, true)}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                        
                        {keyResults.filter(kr => kr.objectiveId !== objectiveId).length === 0 && (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">target</span>
                                <p className="text-sm text-text-tertiary">No other key results available</p>
                                <p className="text-xs text-text-tertiary mt-1">Create a new key result to add it to this objective</p>
                            </div>
                        )}
                        
                        <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200">
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
      )}

    </div>
  );
};
