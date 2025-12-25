import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DayPart, View } from '../types';

interface DayPartsSettingsProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

export const DayPartsSettings: React.FC<DayPartsSettingsProps> = ({ onBack, onNavigate }) => {
  const { dayParts, updateDayPart, reorderDayParts } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DayPart>>({});

  // Sort day parts by order
  const sortedDayParts = [...dayParts].sort((a, b) => a.order - b.order);

  const handleEdit = (dayPart: DayPart) => {
    setEditingId(dayPart.id);
    setEditForm({ ...dayPart });
  };

  const handleSave = (id: string) => {
    const dayPart = dayParts.find(dp => dp.id === id);
    if (dayPart) {
      updateDayPart({
        ...dayPart,
        ...editForm
      });
    }
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...sortedDayParts];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    // Update order values
    newOrder.forEach((dp, i) => {
      dp.order = i;
    });
    reorderDayParts(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === sortedDayParts.length - 1) return;
    const newOrder = [...sortedDayParts];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    // Update order values
    newOrder.forEach((dp, i) => {
      dp.order = i;
    });
    reorderDayParts(newOrder);
  };

  const handleAddNew = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newOrder = Math.max(...dayParts.map(dp => dp.order)) + 1;
    const newDayPart: DayPart = {
      id: newId,
      name: 'New Day Part',
      startTime: '09:00',
      endTime: '17:00',
      order: newOrder
    };
    updateDayPart(newDayPart);
    setEditingId(newId);
    setEditForm(newDayPart);
  };

  const handleDelete = (id: string) => {
    // Prevent deleting "All Day" as it's a special case
    const dayPart = dayParts.find(dp => dp.id === id);
    if (dayPart?.id === 'all-day') {
      alert('"All Day" kan niet worden verwijderd');
      return;
    }
    
    if (window.confirm('Weet je zeker dat je dit dagdeel wilt verwijderen?')) {
      deleteDayPart(id);
      // Reorder remaining items
      const remaining = dayParts.filter(dp => dp.id !== id);
      remaining.forEach((dp, i) => {
        dp.order = i;
      });
      reorderDayParts(remaining);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen pb-32 lg:pb-8 overflow-y-auto">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Dagdelen Configuratie</h1>
      </header>

      <div className="px-6 space-y-4 pt-4">
        {/* Info Box */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
            <div>
              <h4 className="text-sm font-bold text-blue-900 mb-1">Dagdelen</h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Configureer de indeling van je dag. Dagdelen helpen je om tasks te organiseren en te plannen. Je kunt de naam, start- en eindtijd aanpassen, of de volgorde wijzigen.
              </p>
            </div>
          </div>
        </div>

        {/* Day Parts List */}
        <div className="space-y-3">
          {sortedDayParts.map((dayPart, index) => {
            const isEditing = editingId === dayPart.id;
            const isAllDay = dayPart.id === 'all-day';

            return (
              <div
                key={dayPart.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Naam</label>
                      <input
                        type="text"
                        className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Bijv. Ochtend, Middag, Avond"
                      />
                    </div>

                    {!isAllDay && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Start Tijd</label>
                          <input
                            type="time"
                            className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
                            value={editForm.startTime || ''}
                            onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Eind Tijd</label>
                          <input
                            type="time"
                            className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
                            value={editForm.endTime || ''}
                            onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {isAllDay && (
                      <p className="text-xs text-text-tertiary italic">
                        "All Day" heeft geen specifieke tijden
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(dayPart.id)}
                        className="flex-1 px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors"
                      >
                        Opslaan
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-bold text-text-main">{dayPart.name}</h3>
                        {isAllDay && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-text-tertiary">
                            Standaard
                          </span>
                        )}
                      </div>
                      {dayPart.startTime && dayPart.endTime && (
                        <p className="text-sm text-text-secondary">
                          {dayPart.startTime} - {dayPart.endTime}
                        </p>
                      )}
                      {isAllDay && (
                        <p className="text-sm text-text-tertiary italic">Geen specifieke tijden</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Move Up/Down Buttons */}
                      {!isAllDay && (
                        <>
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || sortedDayParts[index - 1]?.id === 'all-day'}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Omhoog verplaatsen"
                          >
                            <span className="material-symbols-outlined text-text-tertiary text-lg">arrow_upward</span>
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === sortedDayParts.length - 1}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Omlaag verplaatsen"
                          >
                            <span className="material-symbols-outlined text-text-tertiary text-lg">arrow_downward</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleEdit(dayPart)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        title="Bewerken"
                      >
                        <span className="material-symbols-outlined text-text-tertiary text-lg">edit</span>
                      </button>

                      {!isAllDay && (
                        <button
                          onClick={() => handleDelete(dayPart.id)}
                          className="p-2 rounded-xl hover:bg-red-100 transition-colors"
                          title="Verwijderen"
                        >
                          <span className="material-symbols-outlined text-red-500 text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Button */}
        <button
          onClick={handleAddNew}
          className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-text-tertiary group-hover:text-primary transition-colors">
              add_circle
            </span>
            <span className="text-sm font-semibold text-text-secondary group-hover:text-primary transition-colors">
              Nieuw Dagdeel Toevoegen
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

