import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { View } from '../types';

interface ObjectivesOverviewProps {
  onViewObjective: (id: string) => void;
  onEdit: (type: any, id?: string, parentId?: string) => void;
  onNavigate?: (view: View) => void; 
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const ObjectivesOverview: React.FC<ObjectivesOverviewProps> = ({ onViewObjective, onEdit, onNavigate, onMenuClick, onProfileClick }) => {
  const { objectives, keyResults, lifeAreas, showCategory } = useData();
  const [lifeAreaFilter, setLifeAreaFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [activeModal, setActiveModal] = useState<'addObjective' | null>(null);

  const filteredObjectives = objectives.filter(obj => {
    // Life Area filter
    if (lifeAreaFilter !== 'all' && obj.lifeAreaId !== lifeAreaFilter) return false;
    return true;
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

      <div className="px-6 py-4 space-y-4">
        {/* View Mode Toggle */}
        {onNavigate && (
          <div className="flex items-center justify-center p-1.5 bg-slate-200 rounded-2xl">
            <button
              onClick={() => {
                setViewMode('list');
              }}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-text-main shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] align-middle mr-1.5">list</span>
              List
            </button>
          <button
              onClick={() => {
                setViewMode('timeline');
                onNavigate(View.GOAL_TIMELINE);
              }}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-text-main shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
          >
              <span className="material-symbols-outlined text-[18px] align-middle mr-1.5">timeline</span>
              Timeline
          </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Life Area Filter */}
          {lifeAreas.length > 0 ? (
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setLifeAreaFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  lifeAreaFilter === 'all' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-white text-text-tertiary hover:bg-gray-50'
                }`}
              >
                All Areas
              </button>
              {lifeAreas.map(la => (
                <button
                  key={la.id}
                  onClick={() => setLifeAreaFilter(la.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    lifeAreaFilter === la.id 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-white text-text-tertiary hover:bg-gray-50'
                  }`}
                >
                  {la.icon && (
                    <span 
                      className="material-symbols-outlined text-sm"
                      style={{ color: lifeAreaFilter === la.id ? 'white' : la.color }}
                    >
                      {la.icon}
                    </span>
                  )}
                  {la.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1" />
          )}
        </div>
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
             const lifeArea = lifeAreas.find(la => la.id === obj.lifeAreaId);

             return (
                <div key={obj.id} onClick={() => onViewObjective(obj.id)} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-soft transition-all cursor-pointer group active:scale-[0.99]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                             <div className={`size-2 rounded-full ${obj.status === 'On Track' ? 'bg-green-500' : obj.status === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                             {lifeArea && (
                               <span 
                                 className="material-symbols-outlined text-sm"
                                 style={{ color: lifeArea.color }}
                                 title={lifeArea.name}
                               >
                                 {lifeArea.icon}
                               </span>
                             )}
                             {showCategory && (
                               <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">{obj.category}</span>
                             )}
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

        {/* Add Objective Button */}
        <button
          onClick={() => setActiveModal('addObjective')}
          className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-text-tertiary group-hover:text-primary transition-colors">
              add_circle
            </span>
            <span className="text-sm font-semibold text-text-secondary group-hover:text-primary transition-colors">
              Add Objective
            </span>
          </div>
        </button>
      </main>

      {/* Add Objective Modal */}
      {activeModal === 'addObjective' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-md bg-background rounded-t-3xl shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
            <div className="sticky top-0 bg-background border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">Add Objective</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-text-tertiary">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Create New Objective */}
              <button
                onClick={() => {
                  setActiveModal(null);
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
                  setActiveModal(null);
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
                          setActiveModal(null);
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