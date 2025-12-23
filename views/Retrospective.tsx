import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { View, Retrospective as RetrospectiveType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface RetrospectiveProps {
  objectiveId?: string;
  keyResultId?: string;
  onBack: () => void;
  onNavigate: (view: View, objectiveId?: string) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const Retrospective: React.FC<RetrospectiveProps> = ({ 
  objectiveId: propObjectiveId, 
  keyResultId, 
  onBack, 
  onNavigate, 
  onMenuClick, 
  onProfileClick 
}) => {
  const { 
    objectives,
    keyResults,
    retrospectives,
    addRetrospective,
    updateRetrospective,
    deleteRetrospective,
    getRetrospectivesByObjective
  } = useData();

  // Get objectiveId from prop or localStorage (set by ObjectiveDetail)
  const [objectiveId] = useState<string | undefined>(() => {
    if (propObjectiveId) return propObjectiveId;
    const stored = localStorage.getItem('orbit_retrospective_objectiveId');
    if (stored) {
      localStorage.removeItem('orbit_retrospective_objectiveId');
      return stored;
    }
    return undefined;
  });

  const objective = objectiveId ? objectives.find(o => o.id === objectiveId) : null;
  const keyResult = keyResultId ? keyResults.find(kr => kr.id === keyResultId) : null;
  const entity = keyResult || objective;

  // Get all retrospectives for this entity
  const allRetrospectives = useMemo(() => {
    if (objectiveId) {
      return getRetrospectivesByObjective(objectiveId);
    }
    if (keyResultId) {
      return retrospectives.filter(r => r.keyResultId === keyResultId)
        .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    }
    return [];
  }, [retrospectives, objectiveId, keyResultId, getRetrospectivesByObjective]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRetrospectiveId, setEditingRetrospectiveId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RetrospectiveType>>({
    date: new Date().toISOString().split('T')[0],
    start: [],
    stop: [],
    continue: [],
    lessonsLearned: '',
    whatWouldIDoDifferently: '',
    biggestChallenges: '',
    actionItems: []
  });

  const getTitle = () => {
    if (keyResult) return `Retrospectives: ${keyResult.title}`;
    if (objective) return `Retrospectives: ${objective.title}`;
    return 'Retrospectives';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRetrospectiveId) {
      // Update existing retrospective
      const existing = allRetrospectives.find(r => r.id === editingRetrospectiveId);
      if (existing) {
        const updated: RetrospectiveType = {
          ...existing,
          ...formData,
          updatedAt: new Date().toISOString()
        } as RetrospectiveType;
        updateRetrospective(updated);
      }
      setEditingRetrospectiveId(null);
    } else {
      // Create new retrospective
      const newRetrospective: RetrospectiveType = {
        id: uuidv4(),
        objectiveId: objectiveId || undefined,
        keyResultId: keyResultId || undefined,
        date: formData.date || new Date().toISOString().split('T')[0],
        start: formData.start || [],
        stop: formData.stop || [],
        continue: formData.continue || [],
        lessonsLearned: formData.lessonsLearned || '',
        whatWouldIDoDifferently: formData.whatWouldIDoDifferently || '',
        biggestChallenges: formData.biggestChallenges || '',
        actionItems: formData.actionItems || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completed: true
      };
      addRetrospective(newRetrospective);
    }

    setShowAddForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      start: [],
      stop: [],
      continue: [],
      lessonsLearned: '',
      whatWouldIDoDifferently: '',
      biggestChallenges: '',
      actionItems: []
    });
  };

  const handleEdit = (retrospective: RetrospectiveType) => {
    setEditingRetrospectiveId(retrospective.id);
    setFormData({
      date: retrospective.date || new Date(retrospective.createdAt).toISOString().split('T')[0],
      start: retrospective.start || [],
      stop: retrospective.stop || [],
      continue: retrospective.continue || [],
      lessonsLearned: retrospective.lessonsLearned || '',
      whatWouldIDoDifferently: retrospective.whatWouldIDoDifferently || '',
      biggestChallenges: retrospective.biggestChallenges || '',
      actionItems: retrospective.actionItems || []
    });
    setShowAddForm(true);
  };

  const handleDelete = (retrospectiveId: string) => {
    if (window.confirm('Weet je zeker dat je deze retrospective wilt verwijderen?')) {
      deleteRetrospective(retrospectiveId);
    }
  };

  const addItem = (list: 'start' | 'stop' | 'continue') => {
    const current = formData[list] || [];
    setFormData(prev => ({
      ...prev,
      [list]: [...current, '']
    }));
  };

  const removeItem = (list: 'start' | 'stop' | 'continue', index: number) => {
    const current = formData[list] || [];
    setFormData(prev => ({
      ...prev,
      [list]: current.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (list: 'start' | 'stop' | 'continue', index: number, value: string) => {
    const current = formData[list] || [];
    const updated = [...current];
    updated[index] = value;
    setFormData(prev => ({
      ...prev,
      [list]: updated
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav
        title={getTitle()}
        subtitle={keyResult ? 'Key Result' : objective ? 'Objective' : ''}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onBack={onBack}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 pt-6">
        {/* Existing Retrospectives List */}
        {allRetrospectives.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-text-main mb-4">Previous Retrospectives</h2>
            <div className="space-y-3">
              {allRetrospectives.map(retro => (
                <div key={retro.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-text-main">
                          {formatDate(retro.date || retro.createdAt)}
                        </span>
                        {retro.completed && (
                          <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                        )}
                      </div>
                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-2 text-xs text-text-tertiary mb-3">
                        <div>Start: {retro.start?.length || 0}</div>
                        <div>Stop: {retro.stop?.length || 0}</div>
                        <div>Continue: {retro.continue?.length || 0}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(retro)}
                        className="text-primary text-xs font-bold hover:bg-primary/5 px-2 py-1 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(retro.id)}
                        className="text-red-500 text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <label className="block text-sm font-bold text-text-main mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main focus:outline-none focus:border-primary focus:bg-white"
                required
              />
            </div>

            {/* Start/Stop/Continue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">play_arrow</span>
                  Start
                </h2>
                <p className="text-xs text-text-tertiary mb-3">What should I start doing?</p>
                <div className="space-y-2 mb-3">
                  {(formData.start || []).map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem('start', index, e.target.value)}
                        className="flex-1 text-sm text-text-main bg-transparent border-none outline-none"
                        placeholder="Enter item..."
                      />
                      <button
                        type="button"
                        onClick={() => removeItem('start', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addItem('start')}
                  className="w-full py-2 text-sm text-green-600 border-2 border-dashed border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  + Add item
                </button>
              </div>

              {/* Stop */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">stop</span>
                  Stop
                </h2>
                <p className="text-xs text-text-tertiary mb-3">What should I stop doing?</p>
                <div className="space-y-2 mb-3">
                  {(formData.stop || []).map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem('stop', index, e.target.value)}
                        className="flex-1 text-sm text-text-main bg-transparent border-none outline-none"
                        placeholder="Enter item..."
                      />
                      <button
                        type="button"
                        onClick={() => removeItem('stop', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addItem('stop')}
                  className="w-full py-2 text-sm text-red-600 border-2 border-dashed border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  + Add item
                </button>
              </div>

              {/* Continue */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-blue-600 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  Continue
                </h2>
                <p className="text-xs text-text-tertiary mb-3">What works well and should I continue?</p>
                <div className="space-y-2 mb-3">
                  {(formData.continue || []).map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem('continue', index, e.target.value)}
                        className="flex-1 text-sm text-text-main bg-transparent border-none outline-none"
                        placeholder="Enter item..."
                      />
                      <button
                        type="button"
                        onClick={() => removeItem('continue', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addItem('continue')}
                  className="w-full py-2 text-sm text-blue-600 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  + Add item
                </button>
              </div>
            </div>

            {/* Lessons Learned */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-text-main mb-3">What did I learn?</h2>
                <textarea
                  value={formData.lessonsLearned || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                  placeholder="Key lessons and insights..."
                  className="w-full min-h-[120px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-text-main mb-3">What would I do differently?</h2>
                <textarea
                  value={formData.whatWouldIDoDifferently || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatWouldIDoDifferently: e.target.value }))}
                  placeholder="Reflect on what you would change..."
                  className="w-full min-h-[120px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-text-main mb-3">What were the biggest challenges?</h2>
                <textarea
                  value={formData.biggestChallenges || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, biggestChallenges: e.target.value }))}
                  placeholder="Identify obstacles and difficulties..."
                  className="w-full min-h-[120px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRetrospectiveId(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    start: [],
                    stop: [],
                    continue: [],
                    lessonsLearned: '',
                    whatWouldIDoDifferently: '',
                    biggestChallenges: '',
                    actionItems: []
                  });
                }}
                className="flex-1 py-3 bg-white border-2 border-gray-200 text-text-main font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-soft transition-colors"
              >
                {editingRetrospectiveId ? 'Update' : 'Save'} Retrospective
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-soft transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Add New Retrospective
          </button>
        )}
      </main>
    </div>
  );
};
