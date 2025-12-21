import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Task, Habit, Objective, KeyResult, LifeArea, TimeSlot, View } from '../types';

interface UnifiedSearchProps {
  onClose: () => void;
  onNavigate?: (view: View, lifeAreaId?: string) => void;
  onEdit?: (type: 'task' | 'habit' | 'objective' | 'keyResult' | 'lifeArea' | 'timeSlot', id?: string, parentId?: string, context?: { objectiveId?: string; lifeAreaId?: string }) => void;
  onViewObjective?: (id: string) => void;
}

interface SearchResult {
  type: 'task' | 'habit' | 'objective' | 'keyResult' | 'lifeArea' | 'timeSlot';
  id: string;
  title: string;
  subtitle?: string;
  entity: Task | Habit | Objective | KeyResult | LifeArea | TimeSlot;
}

export const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  onClose,
  onNavigate,
  onEdit,
  onViewObjective
}) => {
  const {
    tasks,
    habits,
    objectives,
    keyResults,
    lifeAreas,
    timeSlots,
    getLifeAreaById
  } = useData();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search Tasks
    tasks.forEach(task => {
      if (task.title.toLowerCase().includes(searchTerm)) {
        const linkedObjective = task.objectiveId ? objectives.find(o => o.id === task.objectiveId) : null;
        const linkedLifeArea = task.lifeAreaId ? lifeAreas.find(la => la.id === task.lifeAreaId) : null;
        searchResults.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: linkedObjective ? `Goal: ${linkedObjective.title}` : linkedLifeArea ? `Life Area: ${linkedLifeArea.name}` : task.tag || 'Task',
          entity: task
        });
      }
    });

    // Search Habits
    habits.forEach(habit => {
      if (habit.name.toLowerCase().includes(searchTerm)) {
        const linkedObjective = habit.objectiveId ? objectives.find(o => o.id === habit.objectiveId) : null;
        const linkedKR = habit.linkedKeyResultId ? keyResults.find(kr => kr.id === habit.linkedKeyResultId) : null;
        const linkedLifeArea = habit.lifeAreaId ? lifeAreas.find(la => la.id === habit.lifeAreaId) : null;
        searchResults.push({
          type: 'habit',
          id: habit.id,
          title: habit.name,
          subtitle: linkedKR ? `Key Result: ${linkedKR.title}` : linkedObjective ? `Goal: ${linkedObjective.title}` : linkedLifeArea ? `Life Area: ${linkedLifeArea.name}` : 'Habit',
          entity: habit
        });
      }
    });

    // Search Objectives
    objectives.forEach(obj => {
      if (obj.title.toLowerCase().includes(searchTerm) || 
          (obj.description && obj.description.toLowerCase().includes(searchTerm))) {
        const lifeArea = getLifeAreaById(obj.lifeAreaId);
        searchResults.push({
          type: 'objective',
          id: obj.id,
          title: obj.title,
          subtitle: lifeArea ? `Life Area: ${lifeArea.name}` : `Progress: ${obj.progress}%`,
          entity: obj
        });
      }
    });

    // Search Key Results
    keyResults.forEach(kr => {
      if (kr.title.toLowerCase().includes(searchTerm)) {
        const objective = objectives.find(o => o.id === kr.objectiveId);
        searchResults.push({
          type: 'keyResult',
          id: kr.id,
          title: kr.title,
          subtitle: objective ? `Goal: ${objective.title}` : `Progress: ${kr.current}/${kr.target}`,
          entity: kr
        });
      }
    });

    // Search Life Areas
    lifeAreas.forEach(la => {
      if (la.name.toLowerCase().includes(searchTerm) ||
          (la.description && la.description.toLowerCase().includes(searchTerm))) {
        searchResults.push({
          type: 'lifeArea',
          id: la.id,
          title: la.name,
          subtitle: la.description || 'Life Area',
          entity: la
        });
      }
    });

    // Search Time Slots
    timeSlots.forEach(ts => {
      if (ts.title.toLowerCase().includes(searchTerm)) {
        const linkedObjective = ts.objectiveId ? objectives.find(o => o.id === ts.objectiveId) : null;
        const linkedLifeArea = ts.lifeAreaId ? lifeAreas.find(la => la.id === ts.lifeAreaId) : null;
        searchResults.push({
          type: 'timeSlot',
          id: ts.id,
          title: ts.title,
          subtitle: linkedObjective ? `Goal: ${linkedObjective.title}` : linkedLifeArea ? `Life Area: ${linkedLifeArea.name}` : `${ts.startTime} - ${ts.endTime}`,
          entity: ts
        });
      }
    });

    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, tasks, habits, objectives, keyResults, lifeAreas, timeSlots, getLifeAreaById]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'objective' && onViewObjective) {
      onViewObjective(result.id);
    } else if (result.type === 'lifeArea' && onNavigate) {
      // Navigate with lifeAreaId as second parameter
      onNavigate(View.LIFE_AREA_DETAIL, result.id);
    } else if (onEdit) {
      onEdit(result.type, result.id);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return 'task_alt';
      case 'habit': return 'repeat';
      case 'objective': return 'flag';
      case 'keyResult': return 'track_changes';
      case 'lifeArea': return 'category';
      case 'timeSlot': return 'schedule';
      default: return 'search';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Task';
      case 'habit': return 'Habit';
      case 'objective': return 'Goal';
      case 'keyResult': return 'Key Result';
      case 'lifeArea': return 'Life Area';
      case 'timeSlot': return 'Time Slot';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 animate-fade-in">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
        {/* Search Input */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-text-tertiary text-2xl">search</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tasks, habits, goals, key results, life areas..."
              className="flex-1 text-lg font-medium text-text-main outline-none placeholder:text-text-tertiary bg-transparent"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-text-tertiary">close</span>
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!query.trim() ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-text-tertiary mb-4">search</span>
              <p className="text-text-secondary font-medium mb-2">Search across all items</p>
              <p className="text-sm text-text-tertiary">Type to search for tasks, habits, goals, key results, life areas, and time slots</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-text-tertiary mb-4">search_off</span>
              <p className="text-text-secondary font-medium mb-2">No results found</p>
              <p className="text-sm text-text-tertiary">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    index === selectedIndex
                      ? 'bg-primary/5 border-primary/30 shadow-md'
                      : 'bg-white border-slate-100 hover:border-primary/20 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                      index === selectedIndex ? 'bg-primary/10' : 'bg-gray-50'
                    }`}>
                      <span className={`material-symbols-outlined text-lg ${
                        index === selectedIndex ? 'text-primary' : 'text-text-secondary'
                      }`}>
                        {getIcon(result.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold ${index === selectedIndex ? 'text-primary' : 'text-text-main'}`}>
                          {result.title}
                        </p>
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-text-tertiary line-clamp-1">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-text-tertiary text-lg">chevron_right</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 rounded-b-3xl">
            <div className="flex items-center justify-between text-xs text-text-tertiary">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[10px]">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[10px]">Enter</kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[10px]">Esc</kbd>
                  <span>Close</span>
                </span>
              </div>
              <span className="font-medium">{results.length} result{results.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

