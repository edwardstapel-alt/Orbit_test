import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { View, Objective, KeyResult } from '../types';
import { TopNav } from '../components/TopNav';

interface GoalTimelineProps {
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onViewObjective?: (id: string) => void;
}

type TimelineItem = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: 'objective' | 'keyResult';
  objectiveId?: string;
  lifeAreaId?: string;
  status?: string;
  progress?: number;
  timelineColor?: string;
};

export const GoalTimeline: React.FC<GoalTimelineProps> = ({ 
  onNavigate, 
  onMenuClick, 
  onProfileClick,
  onViewObjective 
}) => {
  const { objectives, keyResults, lifeAreas, getLifeAreaById } = useData();
  const [selectedLifeArea, setSelectedLifeArea] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'year' | 'quarter' | 'month'>('year');
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  
  const toggleObjective = (objectiveId: string) => {
    setExpandedObjectives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectiveId)) {
        newSet.delete(objectiveId);
      } else {
        newSet.add(objectiveId);
      }
      return newSet;
    });
  };

  // Combine objectives and key results into timeline items
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];
    
    // Add objectives with timeline dates
    objectives.filter(obj => obj.startDate && obj.endDate).forEach(obj => {
      items.push({
        id: obj.id,
        title: obj.title,
        startDate: obj.startDate!,
        endDate: obj.endDate!,
        type: 'objective',
        lifeAreaId: obj.lifeAreaId,
        status: obj.status,
        progress: obj.progress,
        timelineColor: obj.timelineColor
      });
    });
    
    // Add key results with timeline dates
    keyResults.filter(kr => kr.startDate && kr.endDate).forEach(kr => {
      items.push({
        id: kr.id,
        title: kr.title,
        startDate: kr.startDate,
        endDate: kr.endDate,
        type: 'keyResult',
        objectiveId: kr.objectiveId,
        status: kr.status,
        progress: Math.min(Math.round((kr.current / kr.target) * 100), 100)
      });
    });
    
    return items;
  }, [objectives, keyResults]);

  // Filter by life area
  const filteredItems = useMemo(() => {
    if (selectedLifeArea === 'all') return timelineItems;
    
    return timelineItems.filter(item => {
      if (item.type === 'objective') {
        return item.lifeAreaId === selectedLifeArea;
      } else {
        // For key results, check parent objective's life area
        const parentObjective = objectives.find(obj => obj.id === item.objectiveId);
        return parentObjective?.lifeAreaId === selectedLifeArea;
      }
    });
  }, [timelineItems, selectedLifeArea, objectives]);

  // Calculate timeline bounds based on time range
  const timelineBounds = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (timeRange === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 11, 31);
    } else if (timeRange === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
    } else { // month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // If we have items, adjust bounds to include them
    if (filteredItems.length > 0) {
      const dates = filteredItems.flatMap(item => [
        new Date(item.startDate),
        new Date(item.endDate)
      ]);

      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

      // Extend bounds to include all items
      if (minDate < start) start = minDate;
      if (maxDate > end) end = maxDate;
    }

    // Add padding
    const padding = (end.getTime() - start.getTime()) * 0.05;
    return {
      start: new Date(start.getTime() - padding),
      end: new Date(end.getTime() + padding)
    };
  }, [filteredItems, timeRange]);

  // Calculate position and width for a timeline item
  const calculateBarPosition = (item: TimelineItem) => {
    if (!item.startDate || !item.endDate) return null;

    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    const totalDuration = timelineBounds.end.getTime() - timelineBounds.start.getTime();
    const left = ((start.getTime() - timelineBounds.start.getTime()) / totalDuration) * 100;
    const width = ((end.getTime() - start.getTime()) / totalDuration) * 100;

    return { left: Math.max(0, left), width: Math.min(100 - left, width) };
  };

  // Generate month markers
  const monthMarkers = useMemo(() => {
    const markers = [];
    const current = new Date(timelineBounds.start);
    const end = new Date(timelineBounds.end);

    while (current <= end) {
      markers.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  }, [timelineBounds]);

  const lifeArea = selectedLifeArea !== 'all' ? getLifeAreaById(selectedLifeArea) : null;

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen pb-24">
      <TopNav 
        title="Goal Timeline" 
        subtitle="Your long-term roadmap"
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onBack={() => onNavigate(View.OBJECTIVES_OVERVIEW)}
        showBack={true}
      />

      {/* Filters - Compact Layout */}
      <div className="px-6 py-3 space-y-3">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-center p-1.5 bg-slate-200 rounded-2xl">
          <button
            onClick={() => onNavigate(View.OBJECTIVES_OVERVIEW)}
            className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all text-text-tertiary hover:text-text-secondary"
          >
            <span className="material-symbols-outlined text-[18px] align-middle mr-1.5">list</span>
            List
          </button>
          <button
            className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all bg-white text-text-main shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] align-middle mr-1.5">timeline</span>
            Timeline
          </button>
        </div>

        {/* Combined Filters Row */}
        <div className="flex items-center gap-2">
          {/* Life Area Filter - Compact */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
          <button
            onClick={() => setSelectedLifeArea('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
              selectedLifeArea === 'all' 
                ? 'bg-primary text-white shadow-sm' 
                : 'bg-white text-text-tertiary hover:bg-gray-50'
            }`}
          >
              All
          </button>
          {lifeAreas.map(la => (
            <button
              key={la.id}
              onClick={() => setSelectedLifeArea(la.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedLifeArea === la.id 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-white text-text-tertiary hover:bg-gray-50'
              }`}
                title={la.name}
            >
              {la.icon && (
                <span 
                    className="material-symbols-outlined text-[14px]"
                  style={{ color: selectedLifeArea === la.id ? 'white' : la.color }}
                >
                  {la.icon}
                </span>
              )}
                <span className="hidden sm:inline">{la.name}</span>
            </button>
          ))}
        </div>

          {/* Time Range Filter - Compact */}
          <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => setTimeRange('year')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
              timeRange === 'year' 
                ? 'bg-primary text-white' 
                : 'text-text-tertiary hover:bg-gray-50'
            }`}
          >
              Y
          </button>
          <button
            onClick={() => setTimeRange('quarter')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
              timeRange === 'quarter' 
                ? 'bg-primary text-white' 
                : 'text-text-tertiary hover:bg-gray-50'
            }`}
          >
              Q
          </button>
          <button
            onClick={() => setTimeRange('month')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
              timeRange === 'month' 
                ? 'bg-primary text-white' 
                : 'text-text-tertiary hover:bg-gray-50'
            }`}
          >
              M
          </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 pb-6">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-text-tertiary mb-3">timeline</span>
            <p className="text-sm font-semibold text-text-main mb-2">No goals with timeline dates</p>
            <p className="text-xs text-text-tertiary mb-4">
              Add start and end dates to your goals to see them on the timeline
            </p>
            <button
              onClick={() => onNavigate(View.OBJECTIVES_OVERVIEW)}
              className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors text-sm"
            >
              Go to Goals
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            {/* Time Markers - Cleaner */}
            <div className="relative mb-6 pb-3 border-b border-slate-200">
              <div className="flex justify-between text-[9px] font-semibold text-text-tertiary">
                {timeRange === 'year' && monthMarkers.map((marker, index) => {
                  if (index % 3 !== 0) return null; // Show every 3 months
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <span>{marker.toLocaleDateString('nl-NL', { month: 'short' })}</span>
                      {index === 0 && <span className="text-[7px] mt-0.5 opacity-70">{marker.getFullYear()}</span>}
                    </div>
                  );
                })}
                {timeRange === 'quarter' && monthMarkers.map((marker, index) => {
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <span>{marker.toLocaleDateString('nl-NL', { month: 'short' })}</span>
                      {index === 0 && <span className="text-[7px] mt-0.5 opacity-70">{marker.getFullYear()}</span>}
                    </div>
                  );
                })}
                {timeRange === 'month' && (() => {
                  const days = [];
                  const current = new Date(timelineBounds.start);
                  const end = new Date(timelineBounds.end);
                  while (current <= end) {
                    days.push(new Date(current));
                    current.setDate(current.getDate() + 7); // Weekly markers
                  }
                  return days.map((day, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span className="text-[8px]">{day.getDate()}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Group items by objective */}
            {(() => {
              // Group items: objectives first, then their key results
              const objectiveItems = filteredItems.filter(item => item.type === 'objective');
              const groupedItems: Array<{ objective: TimelineItem; keyResults: TimelineItem[] }> = [];
              
              objectiveItems.forEach(obj => {
                const krs = filteredItems.filter(
                  item => item.type === 'keyResult' && item.objectiveId === obj.id
                );
                groupedItems.push({ objective: obj, keyResults: krs });
              });
              
              // Also show key results without parent objectives (shouldn't happen, but just in case)
              const orphanKRs = filteredItems.filter(
                item => item.type === 'keyResult' && !objectiveItems.find(obj => obj.id === item.objectiveId)
              );
              
              return (
            <div className="space-y-4">
                  {groupedItems.map(({ objective, keyResults }) => {
                    const objPosition = calculateBarPosition(objective);
                    if (!objPosition) return null;

                    const lifeArea = getLifeAreaById(objective.lifeAreaId);
                    const objColor = objective.timelineColor || lifeArea?.color || '#D95829';
                    const isAtRisk = objective.status === 'At Risk' || objective.status === 'Off Track';

                return (
                      <div key={objective.id} className="space-y-2">
                        {/* Objective */}
                        <div className="group">
                          <div className="flex items-center gap-2 mb-1.5">
                            {/* Fold Toggle */}
                            {keyResults.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleObjective(objective.id);
                                }}
                                className="flex-shrink-0 size-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                  >
                                <span className={`material-symbols-outlined text-base text-text-tertiary transition-transform ${
                                  expandedObjectives.has(objective.id) ? 'rotate-90' : ''
                                }`}>
                                  chevron_right
                                </span>
                              </button>
                            )}
                            {keyResults.length === 0 && <div className="w-6" />}
                            
                      {lifeArea?.icon && (
                        <span 
                                className="material-symbols-outlined text-base flex-shrink-0"
                          style={{ color: lifeArea.color }}
                        >
                          {lifeArea.icon}
                        </span>
                      )}
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => onViewObjective && onViewObjective(objective.id)}
                            >
                        <h3 className="text-sm font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                                {objective.title}
                        </h3>
                            </div>
                            {isAtRisk && (
                              <span className={`text-[10px] font-bold flex-shrink-0 ${
                                objective.status === 'Off Track' ? 'text-red-500' : 'text-orange-500'
                              }`}>
                                {objective.status === 'Off Track' ? '🔴' : '⚠️'}
                          </span>
                            )}
                          </div>
                          
                          {/* Objective Timeline Bar */}
                          <div 
                            className="relative h-6 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => onViewObjective && onViewObjective(objective.id)}
                          >
                            <div
                              className="absolute h-full rounded-lg transition-all group-hover:opacity-90 group-hover:shadow-md"
                              style={{
                                left: `${objPosition.left}%`,
                                width: `${objPosition.width}%`,
                                backgroundColor: objColor,
                              }}
                            />
                            {objective.progress !== undefined && objective.progress > 0 && (
                              <div
                                className="absolute h-full bg-white/30 rounded-lg"
                                style={{
                                  left: `${objPosition.left}%`,
                                  width: `${(objPosition.width * objective.progress) / 100}%`,
                                }}
                              />
                          )}
                        </div>
                          
                          {/* Date Range */}
                          <div 
                            className="flex items-center justify-between mt-0.5 px-1 cursor-pointer"
                            onClick={() => onViewObjective && onViewObjective(objective.id)}
                          >
                            <span className="text-[9px] text-text-tertiary">
                              {new Date(objective.startDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[9px] text-text-tertiary">
                              {new Date(objective.endDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                            </span>
                      </div>
                    </div>
                    
                        {/* Key Results under this objective - Only show if expanded */}
                        {keyResults.length > 0 && expandedObjectives.has(objective.id) && (
                          <div className="ml-6 space-y-2 pl-4 border-l-2 border-gray-200 animate-fade-in">
                            {keyResults.map(kr => {
                              const krPosition = calculateBarPosition(kr);
                              if (!krPosition) return null;
                              
                              const parentObj = objectives.find(obj => obj.id === kr.objectiveId);
                              const krLifeArea = parentObj ? getLifeAreaById(parentObj.lifeAreaId) : null;
                              const krColor = krLifeArea?.color || '#94A3B8'; // Lighter gray for key results
                              const krIsAtRisk = kr.status === 'At Risk' || kr.status === 'Off Track';
                              
                              return (
                                <div
                                  key={kr.id}
                                  className="group cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onViewObjective) onViewObjective(kr.objectiveId!);
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-medium text-text-secondary truncate group-hover:text-primary transition-colors">
                                        {kr.title}
                                      </h4>
                                    </div>
                                    {krIsAtRisk && (
                                      <span className={`text-[9px] font-bold flex-shrink-0 ${
                                        kr.status === 'Off Track' ? 'text-red-500' : 'text-orange-500'
                                      }`}>
                                        {kr.status === 'Off Track' ? '🔴' : '⚠️'}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Key Result Timeline Bar - Thinner */}
                                  <div className="relative h-4 bg-gray-50 rounded overflow-hidden">
                                    <div
                                      className="absolute h-full rounded transition-all group-hover:opacity-90"
                        style={{
                                        left: `${krPosition.left}%`,
                                        width: `${krPosition.width}%`,
                                        backgroundColor: krColor,
                                        opacity: 0.7
                        }}
                                    />
                                    {kr.progress !== undefined && kr.progress > 0 && (
                                      <div
                                        className="absolute h-full bg-white/40 rounded"
                                        style={{
                                          left: `${krPosition.left}%`,
                                          width: `${(krPosition.width * kr.progress) / 100}%`,
                                        }}
                                      />
                                    )}
                                  </div>
                                  
                                  {/* Date Range - Smaller */}
                                  <div className="flex items-center justify-between mt-0.5 px-1">
                                    <span className="text-[8px] text-text-tertiary">
                                      {new Date(kr.startDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-[8px] text-text-tertiary">
                                      {new Date(kr.endDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                          </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Orphan Key Results */}
                  {orphanKRs.length > 0 && (
                    <div className="space-y-2">
                      {orphanKRs.map(kr => {
                        const krPosition = calculateBarPosition(kr);
                        if (!krPosition) return null;
                        
                        return (
                          <div key={kr.id} className="group cursor-pointer">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-text-main truncate">
                                  {kr.title} (Key Result)
                                </h3>
                              </div>
                            </div>
                            <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                              <div
                                className="absolute h-full rounded-lg bg-gray-400"
                                style={{
                                  left: `${krPosition.left}%`,
                                  width: `${krPosition.width}%`,
                                }}
                              />
                    </div>
                  </div>
                );
              })}
            </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

