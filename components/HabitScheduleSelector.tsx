import React, { useState } from 'react';

interface HabitScheduleSelectorProps {
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    interval?: number; // For weekly: repeat every X weeks
  } | null;
  onScheduleChange: (schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    interval?: number;
  } | null) => void;
  onClose: () => void;
}

const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const dayFullLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const HabitScheduleSelector: React.FC<HabitScheduleSelectorProps> = ({
  schedule,
  onScheduleChange,
  onClose
}) => {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(schedule?.frequency || 'weekly');
  const [interval, setInterval] = useState<number>(schedule?.interval || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>(schedule?.daysOfWeek || [1, 2, 3, 4, 5, 6, 0]); // Default: all days

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        const newDays = prev.filter(d => d !== dayIndex);
        return newDays.length > 0 ? newDays : [dayIndex]; // Keep at least one day selected
      } else {
        return [...prev, dayIndex].sort((a, b) => a - b);
      }
    });
  };

  const handleSave = () => {
    if (frequency === 'daily') {
      onScheduleChange({ frequency: 'daily', interval: 1 });
    } else if (frequency === 'weekly') {
      onScheduleChange({
        frequency: 'weekly',
        interval,
        daysOfWeek: selectedDays.length > 0 ? selectedDays : [1, 2, 3, 4, 5]
      });
    } else if (frequency === 'monthly') {
      onScheduleChange({ frequency: 'monthly', interval: 1 });
    }
    onClose();
  };

  const handleClear = () => {
    onScheduleChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-text-main mb-6">Schedule</h3>

        {/* Frequency Selection */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">
            Repeat
          </label>
          <select
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main font-medium"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Interval Selection (for weekly) */}
        {frequency === 'weekly' && (
          <div className="mb-6">
            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">
              Repeat every
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="52"
                className="w-20 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main font-medium text-center"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              />
              <span className="text-sm font-medium text-text-secondary">
                {interval === 1 ? 'week' : 'weeks'}
              </span>
            </div>
          </div>
        )}

        {/* Days Selection (for weekly) */}
        {frequency === 'weekly' && (
          <div className="mb-6">
            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">
              Each:
            </label>
            <div className="flex gap-2">
              {dayLabels.map((label, index) => {
                const dayIndex = index === 0 ? 1 : index === 6 ? 0 : index; // Mo=1, Tu=2, ..., Su=0
                const isSelected = selectedDays.includes(dayIndex);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayToggle(dayIndex)}
                    className={`flex-1 py-3 px-2 rounded-xl font-medium text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly info */}
        {frequency === 'monthly' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-text-secondary">
              This habit will repeat on the same day each month.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-3 px-4 bg-gray-100 text-text-secondary rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

