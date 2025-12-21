import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Objective, KeyResult, LifeArea } from '../types';
import { generateLinkingSuggestions, getBestSuggestion, LinkingSuggestion, AutoLinkingContext } from '../utils/autoLinking';

interface QuickLinkSelectorProps {
  entityType: 'task' | 'habit' | 'timeSlot';
  currentLinks: {
    objectiveId?: string;
    keyResultId?: string;
    lifeAreaId?: string;
  };
  onLinkChange: (links: { objectiveId?: string; keyResultId?: string; lifeAreaId?: string }) => void;
  onCreateNew?: (type: 'objective' | 'keyResult' | 'lifeArea', context?: { objectiveId?: string; lifeAreaId?: string }) => void;
}

export const QuickLinkSelector: React.FC<QuickLinkSelectorProps> = ({
  entityType,
  currentLinks,
  onLinkChange,
  onCreateNew,
  entityTitle,
  entityDescription,
  entityDate,
  entityTime,
  contextLifeAreaId,
  contextObjectiveId,
  showSuggestions = true
}) => {
  const {
    objectives,
    keyResults,
    lifeAreas,
    tasks,
    habits,
    getLifeAreaById
  } = useData();

  const [expandedSection, setExpandedSection] = useState<'lifeArea' | 'objective' | 'keyResult' | null>(null);
  const [suggestions, setSuggestions] = useState<LinkingSuggestion[]>([]);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);

  const hasAnyLinks = currentLinks.lifeAreaId || currentLinks.objectiveId || currentLinks.keyResultId;
  const bestSuggestion = getBestSuggestion(suggestions);

  // Auto-show panel if there are high confidence suggestions
  useEffect(() => {
    if (suggestions.length > 0 && !hasAnyLinks) {
      const hasHighConfidence = suggestions.some(s => s.confidence === 'high');
      if (hasHighConfidence && !showSuggestionsPanel) {
        setShowSuggestionsPanel(true);
      }
    }
  }, [suggestions, hasAnyLinks, showSuggestionsPanel]);

  // Generate suggestions when component mounts or relevant data changes
  useEffect(() => {
    if (!showSuggestions) {
      setSuggestions([]);
      return;
    }

    const context: AutoLinkingContext = {
      entityType,
      entityTitle,
      entityDescription,
      entityDate,
      entityTime,
      existingLinks: currentLinks,
      contextLifeAreaId,
      contextObjectiveId
    };

    const newSuggestions = generateLinkingSuggestions(context, {
      lifeAreas,
      objectives,
      keyResults,
      tasks: tasks || [],
      habits: habits || []
    });

    setSuggestions(newSuggestions);
  }, [entityType, entityTitle, entityDescription, entityDate, entityTime, currentLinks, contextLifeAreaId, contextObjectiveId, lifeAreas, objectives, keyResults, tasks, habits, showSuggestions]);

  const handleLink = (type: 'lifeArea' | 'objective' | 'keyResult', id: string) => {
    const newLinks = { ...currentLinks };
    
    if (type === 'lifeArea') {
      newLinks.lifeAreaId = id;
      // Clear objective/keyResult if they don't belong to this life area
      if (newLinks.objectiveId) {
        const obj = objectives.find(o => o.id === newLinks.objectiveId);
        if (obj && obj.lifeAreaId !== id) {
          newLinks.objectiveId = undefined;
          newLinks.keyResultId = undefined;
        }
      }
    } else if (type === 'objective') {
      newLinks.objectiveId = id;
      const obj = objectives.find(o => o.id === id);
      if (obj?.lifeAreaId) {
        newLinks.lifeAreaId = obj.lifeAreaId;
      }
      // Clear keyResult if it doesn't belong to this objective
      if (newLinks.keyResultId) {
        const kr = keyResults.find(k => k.id === newLinks.keyResultId);
        if (kr && kr.objectiveId !== id) {
          newLinks.keyResultId = undefined;
        }
      }
    } else if (type === 'keyResult') {
      newLinks.keyResultId = id;
      const kr = keyResults.find(k => k.id === id);
      if (kr?.objectiveId) {
        newLinks.objectiveId = kr.objectiveId;
        const obj = objectives.find(o => o.id === kr.objectiveId);
        if (obj?.lifeAreaId) {
          newLinks.lifeAreaId = obj.lifeAreaId;
        }
      }
    }
    
    onLinkChange(newLinks);
    setExpandedSection(null);
  };

  const handleUnlink = (type: 'lifeArea' | 'objective' | 'keyResult') => {
    const newLinks = { ...currentLinks };
    
    if (type === 'lifeArea') {
      newLinks.lifeAreaId = undefined;
      // Clear objective/keyResult when unlinking life area
      newLinks.objectiveId = undefined;
      newLinks.keyResultId = undefined;
    } else if (type === 'objective') {
      newLinks.objectiveId = undefined;
      newLinks.keyResultId = undefined;
    } else if (type === 'keyResult') {
      newLinks.keyResultId = undefined;
    }
    
    onLinkChange(newLinks);
  };

  const getFilteredObjectives = () => {
    if (currentLinks.lifeAreaId) {
      return objectives.filter(obj => obj.lifeAreaId === currentLinks.lifeAreaId);
    }
    return objectives;
  };

  const getFilteredKeyResults = () => {
    if (currentLinks.objectiveId) {
      return keyResults.filter(kr => kr.objectiveId === currentLinks.objectiveId);
    }
    return [];
  };

  const linkedLifeArea = currentLinks.lifeAreaId ? lifeAreas.find(la => la.id === currentLinks.lifeAreaId) : null;
  const linkedObjective = currentLinks.objectiveId ? objectives.find(o => o.id === currentLinks.objectiveId) : null;
  const linkedKeyResult = currentLinks.keyResultId ? keyResults.find(kr => kr.id === currentLinks.keyResultId) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-text-main">Quick Links</h3>
        {showSuggestions && suggestions.length > 0 && !hasAnyLinks && (
          <button
            onClick={() => setShowSuggestionsPanel(!showSuggestionsPanel)}
            className="text-xs text-primary font-medium hover:underline"
          >
            {showSuggestionsPanel ? 'Verberg' : 'Toon'} suggesties ({suggestions.length})
          </button>
        )}
      </div>

      {/* Auto-suggestions panel - Always show if there are high confidence suggestions */}
      {showSuggestions && (showSuggestionsPanel || bestSuggestion?.confidence === 'high') && suggestions.length > 0 && !hasAnyLinks && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
            <h4 className="text-sm font-semibold text-text-main">Suggesties</h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {suggestions.slice(0, 5).map((suggestion, index) => {
              const isLinked = 
                (suggestion.type === 'lifeArea' && currentLinks.lifeAreaId === suggestion.id) ||
                (suggestion.type === 'objective' && currentLinks.objectiveId === suggestion.id) ||
                (suggestion.type === 'keyResult' && currentLinks.keyResultId === suggestion.id);

              if (isLinked) return null;

              return (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => {
                    if (suggestion.type === 'lifeArea') {
                      handleLink('lifeArea', suggestion.id);
                    } else if (suggestion.type === 'objective') {
                      handleLink('objective', suggestion.id);
                    } else if (suggestion.type === 'keyResult') {
                      handleLink('keyResult', suggestion.id);
                    }
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all border ${
                    suggestion.confidence === 'high'
                      ? 'bg-primary/10 border-primary/30 hover:border-primary/50'
                      : suggestion.confidence === 'medium'
                      ? 'bg-white border-primary/20 hover:border-primary/40'
                      : 'bg-white border-slate-200 hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      suggestion.confidence === 'high' ? 'bg-primary/20' : 'bg-gray-100'
                    }`}>
                      <span className={`material-symbols-outlined text-sm ${
                        suggestion.type === 'lifeArea' ? 'text-primary' :
                        suggestion.type === 'objective' ? 'text-primary' : 'text-primary'
                      }`}>
                        {suggestion.type === 'lifeArea' ? 'category' :
                         suggestion.type === 'objective' ? 'flag' : 'track_changes'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-main truncate">{suggestion.title}</p>
                      <p className="text-xs text-text-tertiary">{suggestion.reason}</p>
                    </div>
                    {suggestion.confidence === 'high' && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                        Aanbevolen
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {bestSuggestion && !hasAnyLinks && (
            <button
              onClick={() => {
                if (bestSuggestion.type === 'lifeArea') {
                  handleLink('lifeArea', bestSuggestion.id);
                } else if (bestSuggestion.type === 'objective') {
                  handleLink('objective', bestSuggestion.id);
                } else if (bestSuggestion.type === 'keyResult') {
                  handleLink('keyResult', bestSuggestion.id);
                }
                setShowSuggestionsPanel(false);
              }}
              className="w-full mt-2 py-2 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-soft transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <span>Gebruik beste suggestie: {bestSuggestion.title}</span>
            </button>
          )}
        </div>
      )}

      {/* Life Area Link */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">category</span>
            </div>
            <div className="flex-1 min-w-0">
              {linkedLifeArea ? (
                <>
                  <p className="text-sm font-semibold text-text-main truncate">{linkedLifeArea.name}</p>
                  <p className="text-xs text-text-tertiary">Life Area</p>
                </>
              ) : (
                <p className="text-sm text-text-tertiary">No Life Area linked</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {linkedLifeArea ? (
              <button
                onClick={() => handleUnlink('lifeArea')}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Unlink"
              >
                <span className="material-symbols-outlined text-red-500 text-lg">link_off</span>
              </button>
            ) : (
              <button
                onClick={() => setExpandedSection(expandedSection === 'lifeArea' ? null : 'lifeArea')}
                className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
                title="Link Life Area"
              >
                <span className="material-symbols-outlined text-primary text-lg">add_link</span>
              </button>
            )}
          </div>
        </div>

        {expandedSection === 'lifeArea' && (
          <div className="border-t border-slate-100 p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
            {lifeAreas.map(la => (
              <button
                key={la.id}
                onClick={() => handleLink('lifeArea', la.id)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  currentLinks.lifeAreaId === la.id
                    ? 'bg-primary/10 border-2 border-primary/30'
                    : 'bg-white border border-slate-100 hover:border-primary/30 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="size-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${la.color}20` }}
                  >
                    <span 
                      className="material-symbols-outlined text-sm"
                      style={{ color: la.color }}
                    >
                      {la.icon || 'category'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">{la.name}</p>
                  </div>
                  {currentLinks.lifeAreaId === la.id && (
                    <span className="material-symbols-outlined text-primary text-lg">check</span>
                  )}
                </div>
              </button>
            ))}
            {onCreateNew && (
              <button
                onClick={() => {
                  onCreateNew('lifeArea');
                  setExpandedSection(null);
                }}
                className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-text-tertiary text-sm">add</span>
                  </div>
                  <p className="text-sm font-semibold text-primary">Create New Life Area</p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Objective Link */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">flag</span>
            </div>
            <div className="flex-1 min-w-0">
              {linkedObjective ? (
                <>
                  <p className="text-sm font-semibold text-text-main truncate">{linkedObjective.title}</p>
                  <p className="text-xs text-text-tertiary">Goal • {linkedObjective.progress}%</p>
                </>
              ) : (
                <p className="text-sm text-text-tertiary">No Goal linked</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {linkedObjective ? (
              <button
                onClick={() => handleUnlink('objective')}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Unlink"
              >
                <span className="material-symbols-outlined text-red-500 text-lg">link_off</span>
              </button>
            ) : (
              <button
                onClick={() => setExpandedSection(expandedSection === 'objective' ? null : 'objective')}
                className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
                title="Link Goal"
                disabled={!currentLinks.lifeAreaId && lifeAreas.length > 0}
              >
                <span className={`material-symbols-outlined text-lg ${
                  !currentLinks.lifeAreaId && lifeAreas.length > 0 ? 'text-text-tertiary opacity-50' : 'text-primary'
                }`}>add_link</span>
              </button>
            )}
          </div>
        </div>

        {expandedSection === 'objective' && (
          <div className="border-t border-slate-100 p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
            {getFilteredObjectives().length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">
                {currentLinks.lifeAreaId ? 'No goals in this Life Area' : 'Select a Life Area first'}
              </p>
            ) : (
              getFilteredObjectives().map(obj => (
                <button
                  key={obj.id}
                  onClick={() => handleLink('objective', obj.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    currentLinks.objectiveId === obj.id
                      ? 'bg-primary/10 border-2 border-primary/30'
                      : 'bg-white border border-slate-100 hover:border-primary/30 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">flag</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-main truncate">{obj.title}</p>
                      <p className="text-xs text-text-tertiary">{obj.progress}% complete</p>
                    </div>
                    {currentLinks.objectiveId === obj.id && (
                      <span className="material-symbols-outlined text-primary text-lg">check</span>
                    )}
                  </div>
                </button>
              ))
            )}
            {onCreateNew && currentLinks.lifeAreaId && (
              <button
                onClick={() => {
                  onCreateNew('objective', { lifeAreaId: currentLinks.lifeAreaId });
                  setExpandedSection(null);
                }}
                className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-text-tertiary text-sm">add</span>
                  </div>
                  <p className="text-sm font-semibold text-primary">Create New Goal</p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Key Result Link */}
      {linkedObjective && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">track_changes</span>
              </div>
              <div className="flex-1 min-w-0">
                {linkedKeyResult ? (
                  <>
                    <p className="text-sm font-semibold text-text-main truncate">{linkedKeyResult.title}</p>
                    <p className="text-xs text-text-tertiary">Key Result</p>
                  </>
                ) : (
                  <p className="text-sm text-text-tertiary">No Key Result linked</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {linkedKeyResult ? (
                <button
                  onClick={() => handleUnlink('keyResult')}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Unlink"
                >
                  <span className="material-symbols-outlined text-red-500 text-lg">link_off</span>
                </button>
              ) : (
                <button
                  onClick={() => setExpandedSection(expandedSection === 'keyResult' ? null : 'keyResult')}
                  className="p-2 hover:bg-primary/5 rounded-lg transition-colors"
                  title="Link Key Result"
                >
                  <span className="material-symbols-outlined text-primary text-lg">add_link</span>
                </button>
              )}
            </div>
          </div>

          {expandedSection === 'keyResult' && (
            <div className="border-t border-slate-100 p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
              {getFilteredKeyResults().length === 0 ? (
                <p className="text-sm text-text-tertiary text-center py-4">
                  No key results for this goal
                </p>
              ) : (
                getFilteredKeyResults().map(kr => (
                  <button
                    key={kr.id}
                    onClick={() => handleLink('keyResult', kr.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      currentLinks.keyResultId === kr.id
                        ? 'bg-primary/10 border-2 border-primary/30'
                        : 'bg-white border border-slate-100 hover:border-primary/30 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-sm">track_changes</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-main truncate">{kr.title}</p>
                        <p className="text-xs text-text-tertiary">{kr.current} / {kr.target}</p>
                      </div>
                      {currentLinks.keyResultId === kr.id && (
                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                      )}
                    </div>
                  </button>
                ))
              )}
              {onCreateNew && linkedObjective && (
                <button
                  onClick={() => {
                    onCreateNew('keyResult', { objectiveId: linkedObjective.id });
                    setExpandedSection(null);
                  }}
                  className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-text-tertiary text-sm">add</span>
                    </div>
                    <p className="text-sm font-semibold text-primary">Create New Key Result</p>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

