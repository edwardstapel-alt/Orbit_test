import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { LifeArea, Objective, KeyResult } from '../types';

export interface FilterState {
  lifeAreaId?: string;
  objectiveId?: string;
  keyResultId?: string;
  showLinkedOnly?: boolean;
  showUnlinkedOnly?: boolean;
}

interface EntityFilterProps {
  entityType: 'task' | 'habit' | 'timeSlot' | 'objective' | 'keyResult';
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showLinkedOnly?: boolean;
  showUnlinkedOnly?: boolean;
}

export const EntityFilter: React.FC<EntityFilterProps> = ({
  entityType,
  filters,
  onFiltersChange,
  showLinkedOnly = true,
  showUnlinkedOnly = true
}) => {
  const {
    lifeAreas,
    objectives,
    keyResults
  } = useData();

  const [showLifeAreaMenu, setShowLifeAreaMenu] = useState(false);
  const [showObjectiveMenu, setShowObjectiveMenu] = useState(false);
  const [showKeyResultMenu, setShowKeyResultMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLifeAreaMenu(false);
        setShowObjectiveMenu(false);
        setShowKeyResultMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (key: keyof FilterState, value: string | boolean | undefined) => {
    const newFilters = { ...filters };
    
    if (value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value as any;
    }

    // Clear dependent filters
    if (key === 'lifeAreaId') {
      delete newFilters.objectiveId;
      delete newFilters.keyResultId;
    } else if (key === 'objectiveId') {
      delete newFilters.keyResultId;
    }

    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setShowLifeAreaMenu(false);
    setShowObjectiveMenu(false);
    setShowKeyResultMenu(false);
  };

  const hasActiveFilters = filters.lifeAreaId || filters.objectiveId || filters.keyResultId || filters.showLinkedOnly || filters.showUnlinkedOnly;

  const getFilteredObjectives = () => {
    if (filters.lifeAreaId) {
      return objectives.filter(obj => obj.lifeAreaId === filters.lifeAreaId);
    }
    return objectives;
  };

  const getFilteredKeyResults = () => {
    if (filters.objectiveId) {
      return keyResults.filter(kr => kr.objectiveId === filters.objectiveId);
    }
    return [];
  };

  const selectedLifeArea = filters.lifeAreaId ? lifeAreas.find(la => la.id === filters.lifeAreaId) : null;
  const selectedObjective = filters.objectiveId ? objectives.find(obj => obj.id === filters.objectiveId) : null;
  const selectedKeyResult = filters.keyResultId ? keyResults.find(kr => kr.id === filters.keyResultId) : null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Compact Icon Toggles */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Link Status Toggles */}
        {showLinkedOnly && (
          <button
            onClick={() => handleFilterChange('showLinkedOnly', filters.showLinkedOnly ? undefined : true)}
            className={`p-1.5 rounded-lg transition-colors ${
              filters.showLinkedOnly
                ? 'bg-primary text-white'
                : 'bg-white border border-slate-200 text-text-tertiary hover:border-primary/30 hover:text-primary'
            }`}
            title="Alleen gelinkt"
          >
            <span className="material-symbols-outlined text-base">link</span>
          </button>
        )}
        {showUnlinkedOnly && (
          <button
            onClick={() => handleFilterChange('showUnlinkedOnly', filters.showUnlinkedOnly ? undefined : true)}
            className={`p-1.5 rounded-lg transition-colors ${
              filters.showUnlinkedOnly
                ? 'bg-primary text-white'
                : 'bg-white border border-slate-200 text-text-tertiary hover:border-primary/30 hover:text-primary'
            }`}
            title="Alleen ongelinkt"
          >
            <span className="material-symbols-outlined text-base">link_off</span>
          </button>
        )}

        {/* Life Area Toggle */}
        {lifeAreas.length > 0 && (
          <div className="relative">
            <button
              onClick={() => {
                if (filters.lifeAreaId) {
                  handleFilterChange('lifeAreaId', undefined);
                } else {
                  setShowLifeAreaMenu(!showLifeAreaMenu);
                  setShowObjectiveMenu(false);
                  setShowKeyResultMenu(false);
                }
              }}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                filters.lifeAreaId
                  ? 'bg-primary text-white'
                  : 'bg-white border border-slate-200 text-text-tertiary hover:border-primary/30 hover:text-primary'
              }`}
              title={selectedLifeArea ? selectedLifeArea.name : 'Life Area filter'}
            >
              <span className="material-symbols-outlined text-base">category</span>
              {filters.lifeAreaId && (
                <span className="size-1 rounded-full bg-white"></span>
              )}
            </button>

            {/* Life Area Menu */}
            {showLifeAreaMenu && !filters.lifeAreaId && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                <div className="p-2">
                  <button
                    onClick={() => {
                      handleFilterChange('lifeAreaId', undefined);
                      setShowLifeAreaMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      !filters.lifeAreaId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-gray-50 text-text-main'
                    }`}
                  >
                    Alle Life Areas
                  </button>
                  {lifeAreas.map(la => (
                    <button
                      key={la.id}
                      onClick={() => {
                        handleFilterChange('lifeAreaId', la.id);
                        setShowLifeAreaMenu(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center gap-2 ${
                        filters.lifeAreaId === la.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-gray-50 text-text-main'
                      }`}
                    >
                      <div 
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: la.color }}
                      />
                      <span className="truncate">{la.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Objective Toggle */}
        {objectives.length > 0 && (
          <div className="relative">
            <button
              onClick={() => {
                if (filters.objectiveId) {
                  handleFilterChange('objectiveId', undefined);
                } else if (getFilteredObjectives().length > 0) {
                  setShowObjectiveMenu(!showObjectiveMenu);
                  setShowLifeAreaMenu(false);
                  setShowKeyResultMenu(false);
                }
              }}
              disabled={!!filters.lifeAreaId && getFilteredObjectives().length === 0}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                filters.objectiveId
                  ? 'bg-primary text-white'
                  : 'bg-white border border-slate-200 text-text-tertiary hover:border-primary/30 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
              title={selectedObjective ? selectedObjective.title : 'Goal filter'}
            >
              <span className="material-symbols-outlined text-base">flag</span>
              {filters.objectiveId && (
                <span className="size-1 rounded-full bg-white"></span>
              )}
            </button>

            {/* Objective Menu */}
            {showObjectiveMenu && !filters.objectiveId && getFilteredObjectives().length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-50 min-w-[250px] max-h-[300px] overflow-y-auto">
                <div className="p-2">
                  <button
                    onClick={() => {
                      handleFilterChange('objectiveId', undefined);
                      setShowObjectiveMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      !filters.objectiveId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-gray-50 text-text-main'
                    }`}
                  >
                    Alle Goals
                  </button>
                  {getFilteredObjectives().map(obj => (
                    <button
                      key={obj.id}
                      onClick={() => {
                        handleFilterChange('objectiveId', obj.id);
                        setShowObjectiveMenu(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        filters.objectiveId === obj.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-gray-50 text-text-main'
                      }`}
                    >
                      <span className="truncate block">{obj.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Result Toggle */}
        {keyResults.length > 0 && filters.objectiveId && (
          <div className="relative">
            <button
              onClick={() => {
                if (filters.keyResultId) {
                  handleFilterChange('keyResultId', undefined);
                } else if (getFilteredKeyResults().length > 0) {
                  setShowKeyResultMenu(!showKeyResultMenu);
                  setShowLifeAreaMenu(false);
                  setShowObjectiveMenu(false);
                }
              }}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                filters.keyResultId
                  ? 'bg-primary text-white'
                  : 'bg-white border border-slate-200 text-text-tertiary hover:border-primary/30 hover:text-primary'
              }`}
              title={selectedKeyResult ? selectedKeyResult.title : 'Key Result filter'}
            >
              <span className="material-symbols-outlined text-base">track_changes</span>
              {filters.keyResultId && (
                <span className="size-1 rounded-full bg-white"></span>
              )}
            </button>

            {/* Key Result Menu */}
            {showKeyResultMenu && !filters.keyResultId && getFilteredKeyResults().length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-50 min-w-[250px] max-h-[300px] overflow-y-auto">
                <div className="p-2">
                  <button
                    onClick={() => {
                      handleFilterChange('keyResultId', undefined);
                      setShowKeyResultMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      !filters.keyResultId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-gray-50 text-text-main'
                    }`}
                  >
                    Alle Key Results
                  </button>
                  {getFilteredKeyResults().map(kr => (
                    <button
                      key={kr.id}
                      onClick={() => {
                        handleFilterChange('keyResultId', kr.id);
                        setShowKeyResultMenu(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        filters.keyResultId === kr.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-gray-50 text-text-main'
                      }`}
                    >
                      <span className="truncate block">{kr.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-text-tertiary hover:border-red-300 hover:text-red-500 transition-colors"
            title="Wis alle filters"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>
    </div>
  );
};
