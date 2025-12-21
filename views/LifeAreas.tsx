import React from 'react';
import { useData } from '../context/DataContext';
import { View } from '../types';
import { TopNav } from '../components/TopNav';

interface LifeAreasProps {
  onNavigate: (view: View, lifeAreaId?: string) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onSearchClick?: () => void;
  onEdit?: (type: 'lifeArea' | 'task' | 'habit' | 'friend' | 'objective' | 'keyResult' | 'place', id?: string) => void;
}

export const LifeAreas: React.FC<LifeAreasProps> = ({ onNavigate, onMenuClick, onProfileClick, onSearchClick, onEdit }) => {
  const { lifeAreas, objectives, tasks } = useData();

  const handleLifeAreaClick = (lifeAreaId: string) => {
    onNavigate(View.LIFE_AREA_DETAIL, lifeAreaId);
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title="My Goals" 
        subtitle="Life Areas" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onSearchClick={onSearchClick}
        showSearch={true}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 md:px-12 lg:px-16 pt-6">
        <div className="max-w-6xl mx-auto">
        {/* Life Areas List */}
        <div className="space-y-4">
          {lifeAreas.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">category</span>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">No Life Areas Yet</h3>
              <p className="text-sm text-text-secondary mb-4">
                Create your first Life Area to start organizing your goals and vision.
              </p>
              <button 
                onClick={() => onEdit && onEdit('lifeArea')}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors"
              >
                Create Life Area
              </button>
            </div>
          ) : (
            lifeAreas
              .sort((a, b) => a.order - b.order)
              .map((lifeArea) => {
                const areaObjectives = objectives.filter(obj => obj.lifeAreaId === lifeArea.id);
                const areaTasks = tasks.filter(task => task.lifeAreaId === lifeArea.id);
                const goalsCount = areaObjectives.length;

                return (
                  <div
                    key={lifeArea.id}
                    className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group cursor-pointer"
                    onClick={() => handleLifeAreaClick(lifeArea.id)}
                  >
                    <div className="flex gap-4 p-4">
                      {/* Image/Icon */}
                      <div 
                        className="relative shrink-0"
                      >
                        {lifeArea.image ? (
                          <div 
                            className="size-16 rounded-2xl bg-cover bg-center"
                            style={{ backgroundImage: `url("${lifeArea.image}")` }}
                          >
                            <div 
                              className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white"
                              style={{ backgroundColor: lifeArea.color }}
                            />
                          </div>
                        ) : (
                          <div 
                            className="size-16 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: `${lifeArea.color}20` }}
                          >
                            <span 
                              className="material-symbols-outlined text-2xl"
                              style={{ color: lifeArea.color }}
                            >
                              {lifeArea.icon}
                            </span>
                            <div 
                              className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white"
                              style={{ backgroundColor: lifeArea.color }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 
                            className="text-base font-bold text-text-main group-hover:text-primary transition-colors flex-1"
                          >
                            {lifeArea.name}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit && onEdit('lifeArea', lifeArea.id);
                            }}
                            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-text-tertiary text-lg">edit</span>
                          </button>
                        </div>
                        
                        <div>
                          {lifeArea.visionStatement ? (
                            <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                              {lifeArea.visionStatement}
                            </p>
                          ) : lifeArea.description ? (
                            <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                              {lifeArea.description}
                            </p>
                          ) : null}

                          {/* Metrics */}
                          <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-text-secondary">
                            {goalsCount} {goalsCount === 1 ? 'goal' : 'goals'}
                          </span>
                          {areaTasks.length > 0 && (
                            <>
                              <span className="text-xs text-text-tertiary">•</span>
                              <span className="text-xs font-medium text-text-secondary">
                                {areaTasks.length} {areaTasks.length === 1 ? 'task' : 'tasks'}
                              </span>
                            </>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          )}

          {/* Add Life Area Button */}
          {lifeAreas.length > 0 && (
            <button
              onClick={() => onEdit && onEdit('lifeArea')}
              className="w-full bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-200 p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-text-tertiary group-hover:text-primary transition-colors">
                  add_circle
                </span>
                <span className="text-sm font-semibold text-text-secondary group-hover:text-primary transition-colors">
                  Add Life Area
                </span>
              </div>
            </button>
          )}
        </div>
        </div>
      </main>
    </div>
  );
};

