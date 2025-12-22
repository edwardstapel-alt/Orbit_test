import React, { useState, useEffect } from 'react';
import { Reminder, EntityType, NotificationSettings } from '../types';
import { reminderEngine } from '../utils/reminderEngine';
import { v4 as uuidv4 } from 'uuid';

interface ReminderEditorProps {
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  existingReminder?: Reminder;
  notificationSettings: NotificationSettings;
  onSave: (reminder: Reminder) => void;
  onCancel: () => void;
  onDelete?: (reminderId: string) => void;
}

export const ReminderEditor: React.FC<ReminderEditorProps> = ({
  entityType,
  entityId,
  entityTitle,
  existingReminder,
  notificationSettings,
  onSave,
  onCancel,
  onDelete
}) => {
  const [enabled, setEnabled] = useState(existingReminder?.completed === false || !existingReminder);
  const [offsetMinutes, setOffsetMinutes] = useState(
    existingReminder?.offsetMinutes ?? notificationSettings.reminderDefaults[entityType]
  );

  const handleSave = () => {
    if (!enabled) {
      // If disabling, mark as completed
      if (existingReminder) {
        onSave({ ...existingReminder, completed: true });
      }
      onCancel();
      return;
    }

    const reminder: Reminder = {
      id: existingReminder?.id || uuidv4(),
      entityType,
      entityId,
      title: entityTitle,
      scheduledTime: new Date().toISOString(), // Will be calculated by reminder engine
      offsetMinutes,
      completed: false,
      createdAt: existingReminder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(reminder);
    onCancel();
  };

  const formatOffset = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minuten`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} ${hours === 1 ? 'uur' : 'uren'}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} ${days === 1 ? 'dag' : 'dagen'}`;
    }
  };

  const quickOffsets = [
    { label: '5 min', value: 5 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 uur', value: 60 },
    { label: '2 uur', value: 120 },
    { label: '1 dag', value: 1440 },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">notifications</span>
          Herinnering
        </h3>
        <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={(e) => setEnabled(e.target.checked)} 
            className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" 
            style={{top: '2px', left: '2px', transform: enabled ? 'translateX(100%)' : 'translateX(0)'}}
          />
          <label 
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${enabled ? 'bg-primary' : 'bg-gray-200'}`} 
            onClick={() => setEnabled(!enabled)}
          />
        </div>
      </div>

      {enabled && (
        <>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Herinner me {formatOffset(offsetMinutes)} voor
            </label>
            <div className="grid grid-cols-3 gap-2">
              {quickOffsets.map(offset => (
                <button
                  key={offset.value}
                  onClick={() => setOffsetMinutes(offset.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    offsetMinutes === offset.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-main hover:bg-gray-200'
                  }`}
                >
                  {offset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Aangepaste tijd (minuten)
            </label>
            <input
              type="number"
              min="0"
              value={offsetMinutes}
              onChange={(e) => setOffsetMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        {existingReminder && onDelete && (
          <button
            onClick={() => {
              if (window.confirm('Herinnering verwijderen?')) {
                onDelete(existingReminder.id);
                onCancel();
              }
            }}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Verwijderen
          </button>
        )}
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 text-text-main rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Annuleren
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-soft transition-colors"
        >
          Opslaan
        </button>
      </div>
    </div>
  );
};

