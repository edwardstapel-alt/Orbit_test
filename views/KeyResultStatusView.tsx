import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { StatusUpdate, KeyResult } from '../types';

interface KeyResultStatusViewProps {
  keyResult: KeyResult;
  onClose: () => void;
}

export const KeyResultStatusView: React.FC<KeyResultStatusViewProps> = ({ keyResult, onClose }) => {
  const { 
    statusUpdates, 
    addStatusUpdate, 
    updateStatusUpdate,
    deleteStatusUpdate,
    updateKeyResult,
    getStatusUpdatesByKeyResult, 
    formatKeyResultValue,
    userProfile,
    teamMembers
  } = useData();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    currentValue: keyResult.current,
    status: keyResult.status,
    description: ''
  });

  // Update formData when keyResult changes
  React.useEffect(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      currentValue: keyResult.current,
      status: keyResult.status,
      description: ''
    });
  }, [keyResult.current, keyResult.status]);

  const updates = getStatusUpdatesByKeyResult(keyResult.id);
  const primaryOwner = teamMembers.find(m => m.role === 'You') || teamMembers[0];
  const authorName = primaryOwner?.name || `${userProfile.firstName} ${userProfile.lastName}`;
  const authorImage = primaryOwner?.image || userProfile.image;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      alert('Voeg een beschrijving toe');
      return;
    }

    if (editingUpdateId) {
      // Update existing status update
      const existingUpdate = updates.find(u => u.id === editingUpdateId);
      if (existingUpdate) {
        const updatedUpdate: StatusUpdate = {
          ...existingUpdate,
          date: formData.date,
          currentValue: formData.currentValue,
          status: formData.status,
          description: formData.description
        };
        updateStatusUpdate(updatedUpdate);
      }
      setEditingUpdateId(null);
    } else {
      // Create new status update
      const newUpdate: StatusUpdate = {
        id: Math.random().toString(36).substr(2, 9),
        keyResultId: keyResult.id,
        date: formData.date,
        currentValue: formData.currentValue,
        status: formData.status,
        description: formData.description,
        author: authorName,
        authorImage: authorImage,
        createdAt: new Date().toISOString()
      };
      addStatusUpdate(newUpdate);
    }

    setShowAddForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      currentValue: keyResult.current,
      status: keyResult.status,
      description: ''
    });
  };

  const handleEdit = (update: StatusUpdate) => {
    setEditingUpdateId(update.id);
    setFormData({
      date: update.date,
      currentValue: update.currentValue,
      status: update.status,
      description: update.description
    });
    setShowAddForm(true);
  };

  const handleDelete = (updateId: string) => {
    if (window.confirm('Weet je zeker dat je deze status update wilt verwijderen?')) {
      // Sorteer alle updates op datum (nieuwste eerst)
      const sortedUpdates = [...updates].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Vind de index van de update die wordt verwijderd
      const deleteIndex = sortedUpdates.findIndex(u => u.id === updateId);
      
      // Verwijder de update eerst
      deleteStatusUpdate(updateId);
      
      // Bepaal welke update nu de laatst gecommit update is
      // Als deleteIndex === 0 (nieuwste), dan is sortedUpdates[1] de nieuwe nieuwste
      // Als deleteIndex > 0, dan blijft sortedUpdates[0] de nieuwste
      if (deleteIndex === 0 && sortedUpdates.length > 1) {
        // De nieuwste update werd verwijderd, pak de op één na nieuwste
        const previousUpdate = sortedUpdates[1];
        updateKeyResult({
          ...keyResult,
          current: previousUpdate.currentValue,
          status: previousUpdate.status
        });
      } else if (deleteIndex > 0) {
        // Een oudere update werd verwijderd, de nieuwste blijft
        const latestUpdate = sortedUpdates[0];
        updateKeyResult({
          ...keyResult,
          current: latestUpdate.currentValue,
          status: latestUpdate.status
        });
      } else {
        // Dit was de enige update, reset naar 0
        updateKeyResult({
          ...keyResult,
          current: 0,
          status: 'On Track'
        });
      }
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'vandaag';
    if (diffDays === 1) return 'gisteren';
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} maanden geleden`;
    return `${Math.floor(diffDays / 365)} jaar geleden`;
  };

  const percent = Math.min(Math.round((keyResult.current / keyResult.target) * 100), 100);

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-surface rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-text-main mb-1 truncate">
              Statusrapport: {keyResult.title}
            </h2>
            <p className="text-sm text-text-secondary">
              {formatKeyResultValue(keyResult, keyResult.current)} / {formatKeyResultValue(keyResult, keyResult.target)} - {percent}% - {keyResult.status} voor {keyResult.endDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-text-tertiary hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Key Information */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-slate-100">
            <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-widest mb-4">Key Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">Status</span>
                <div className="flex items-center gap-2">
                  <div className={`size-2 rounded-full ${getStatusColor(keyResult.status)}`}></div>
                  <span className="text-sm font-semibold text-text-main">{keyResult.status}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">Progress</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${getStatusColor(keyResult.status)}`} style={{width: `${percent}%`}}></div>
                  </div>
                  <span className="text-sm font-bold text-text-main">{percent}%</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">Owner</span>
                <div className="flex items-center gap-2">
                  {keyResult.ownerImage ? (
                    <div 
                      className="size-6 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${keyResult.ownerImage}")` }}
                    />
                  ) : null}
                  <span className="text-sm font-medium text-text-main">{keyResult.owner || authorName}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">Time Period</span>
                <span className="text-sm font-medium text-text-main">
                  {new Date(keyResult.startDate).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })} - {new Date(keyResult.endDate).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Add Update Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-6 p-4 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary-soft transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              <span>Update Status</span>
            </button>
          )}

          {/* Add/Edit Update Form */}
          {showAddForm && (
            <div className="bg-white rounded-2xl p-6 mb-6 border border-slate-100">
              <h3 className="text-lg font-bold text-text-main mb-4">
                {editingUpdateId ? 'Bewerk Status Update' : 'Nieuwe Status Update'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Datum</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Nieuwe Waarde</label>
                    <input
                      type="number"
                      step={keyResult.decimals === 0 ? 1 : keyResult.decimals === 1 ? 0.1 : 0.01}
                      value={formData.currentValue}
                      onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1">Target: {formatKeyResultValue(keyResult, keyResult.target)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main"
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Off Track">Off Track</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Voortgang / Blokkades</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main resize-none"
                    rows={6}
                    placeholder="Beschrijf de belangrijkste voortgang of blokkades..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors"
                  >
                    Opslaan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingUpdateId(null);
                      setFormData({
                        date: new Date().toISOString().split('T')[0],
                        currentValue: keyResult.current,
                        status: keyResult.status,
                        description: ''
                      });
                    }}
                    className="flex-1 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Status Updates List */}
          <div>
            <h3 className="text-lg font-bold text-text-main mb-4">Voortgang</h3>
            {updates.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-slate-200 text-center">
                <span className="material-symbols-outlined text-4xl text-text-tertiary mb-3">description</span>
                <p className="text-sm text-text-secondary">Nog geen status updates</p>
                <p className="text-xs text-text-tertiary mt-1">Voeg de eerste update toe om de voortgang bij te houden</p>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => {
                  const updatePercent = Math.min(Math.round((update.currentValue / keyResult.target) * 100), 100);
                  return (
                    <div key={update.id} className="bg-white rounded-2xl p-6 border border-slate-100 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {update.authorImage ? (
                            <div 
                              className="size-10 rounded-full bg-cover bg-center"
                              style={{ backgroundImage: `url("${update.authorImage}")` }}
                            />
                          ) : (
                            <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="material-symbols-outlined text-text-tertiary">account_circle</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-text-main">{update.author}</p>
                            <p className="text-xs text-text-tertiary">{formatDate(update.date)} · {formatRelativeDate(update.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${getStatusBadge(update.status)}`}>
                            {update.status}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(update)}
                              className="p-1.5 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Bewerken"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(update.id)}
                              className="p-1.5 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Verwijderen"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-end justify-between mb-2">
                          <div>
                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">Progress</span>
                            <span className="text-2xl font-bold text-primary">
                              {formatKeyResultValue(keyResult, update.currentValue)}
                            </span>
                            <span className="text-sm text-text-tertiary ml-1">
                              / {formatKeyResultValue(keyResult, keyResult.target)} ({updatePercent}%)
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${getStatusColor(update.status)}`} style={{width: `${updatePercent}%`}}></div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">{update.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

