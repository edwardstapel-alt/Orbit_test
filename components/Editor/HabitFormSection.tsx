import React from 'react';
import { QuickLinkSelector } from '../QuickLinkSelector';

interface HabitFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  data: {
    keyResults: any[];
    objectives: any[];
    lifeAreas: any[];
    formatKeyResultValue: (kr: any, value: number) => string;
  };
  contextObjectiveId?: string;
  contextLifeAreaId?: string;
  editId?: string;
  habitSchedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    interval?: number;
  } | null;
  generateAsTasks: boolean;
  onScheduleClick: () => void;
  onTemplateClick: () => void;
  onGenerateTasksChange: (value: boolean) => void;
  onEdit?: (type: any, id?: string, parentId?: string) => void;
}

export const HabitFormSection: React.FC<HabitFormSectionProps> = ({
  formData,
  onFieldChange,
  data,
  contextObjectiveId,
  contextLifeAreaId,
  editId,
  habitSchedule,
  generateAsTasks,
  onScheduleClick,
  onTemplateClick,
  onGenerateTasksChange,
  onEdit,
}) => {
  const linkedKR = formData.linkedKeyResultId
    ? data.keyResults.find((kr) => kr.id === formData.linkedKeyResultId)
    : null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100 flex flex-col items-center gap-4">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
          Habit Name <span className="text-red-500">*</span>
        </label>
        <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-4xl mb-2">
          <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>
            {formData.icon || 'star'}
          </span>
        </div>
        <input
          type="text"
          className="w-full text-center text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300 border-b border-transparent focus:border-gray-100 pb-2 transition-colors"
          value={formData.name || ''}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder="Name your habit"
          autoFocus
          required
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        {(data.keyResults.length > 0 || data.objectives.length > 0 || data.lifeAreas.length > 0) && (
          <QuickLinkSelector
            entityType="habit"
            currentLinks={{
              objectiveId: formData.objectiveId,
              keyResultId: formData.linkedKeyResultId,
              lifeAreaId: formData.lifeAreaId,
            }}
            onLinkChange={(links) => {
              if (links.objectiveId !== formData.objectiveId) {
                onFieldChange('objectiveId', links.objectiveId || '');
              }
              if (links.keyResultId !== formData.linkedKeyResultId) {
                onFieldChange('linkedKeyResultId', links.keyResultId || '');
                if (links.keyResultId) {
                  const kr = data.keyResults.find((k) => k.id === links.keyResultId);
                  if (kr && !formData.progressContribution) {
                    onFieldChange('progressContribution', 1);
                  }
                }
              }
              if (links.lifeAreaId !== formData.lifeAreaId) {
                onFieldChange('lifeAreaId', links.lifeAreaId || '');
              }
            }}
            onCreateNew={(type, context) => {
              if (onEdit) {
                onEdit(type, undefined, undefined, context);
              }
            }}
            entityTitle={formData.name}
            contextLifeAreaId={contextLifeAreaId}
            contextObjectiveId={contextObjectiveId}
            showSuggestions={true}
          />
        )}

        {linkedKR && (
          <div className="mt-4">
            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
              Progress Contribution per Completion
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step={linkedKR.decimals === 0 ? 1 : linkedKR.decimals === 1 ? 0.1 : 0.01}
                className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main font-medium"
                value={formData.progressContribution || 1}
                onChange={(e) => onFieldChange('progressContribution', parseFloat(e.target.value) || 0)}
                placeholder="1"
                min="0"
              />
              <span className="text-sm font-medium text-text-secondary">
                {data.formatKeyResultValue(linkedKR, formData.progressContribution || 1)}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Each time you complete this habit, the Key Result "{linkedKR.title}" will increase by this amount.
              {linkedKR.measurementType === 'currency' && ' Example: €10 per completion'}
              {linkedKR.measurementType === 'number' && ' Example: 0.5 per completion'}
              {linkedKR.measurementType === 'percentage' && ' Example: 1% per completion'}
              {linkedKR.measurementType === 'weight' && ' Example: 0.1 kg per completion'}
              {linkedKR.measurementType === 'distance' && ' Example: 0.5 km per completion'}
              {linkedKR.measurementType === 'time' && ' Example: 1 hour per completion'}
              {linkedKR.measurementType === 'height' && ' Example: 0.01 m per completion'}
              {linkedKR.measurementType === 'pages' && ' Example: 5 pages per completion'}
              {linkedKR.measurementType === 'chapters' && ' Example: 1 chapter per completion'}
              {linkedKR.measurementType === 'custom' &&
                ` Example: 1 ${linkedKR.customUnit || 'unit'} per completion`}
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
            Icon (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
              value={formData.icon || ''}
              onChange={(e) => onFieldChange('icon', e.target.value)}
              placeholder="e.g. water_drop"
            />
            <a
              href="https://fonts.google.com/icons"
              target="_blank"
              className="px-4 py-3 bg-gray-100 text-text-secondary rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Find
            </a>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
            Schedule (Optional)
          </label>
          <button
            type="button"
            onClick={onScheduleClick}
            className={`w-full p-3 bg-gray-50 rounded-xl border-2 transition-colors text-left flex items-center justify-between ${
              habitSchedule ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={habitSchedule ? 'text-primary font-medium' : 'text-text-tertiary'}>
              {habitSchedule
                ? habitSchedule.frequency === 'daily'
                  ? 'Daily'
                  : habitSchedule.frequency === 'weekly'
                    ? `Weekly (${habitSchedule.daysOfWeek?.length || 0} days)`
                    : 'Monthly'
                : 'Select schedule (optional)'}
            </span>
            <span className="material-symbols-outlined text-text-tertiary">arrow_forward</span>
          </button>
        </div>

        {!editId && habitSchedule && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="generateAsTasks"
              checked={generateAsTasks}
              onChange={(e) => onGenerateTasksChange(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="generateAsTasks" className="text-sm font-medium text-text-main cursor-pointer">
              Generate as tasks based on schedule
            </label>
          </div>
        )}

        {!editId && (
          <div>
            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
              Start from Template (Optional)
            </label>
            <button
              type="button"
              onClick={onTemplateClick}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
            >
              <span className="text-text-main">Selecteer template...</span>
              <span className="material-symbols-outlined text-text-tertiary">arrow_forward</span>
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">
            Additional Settings (Optional)
          </label>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Target Frequency (per week)
              </label>
              <input
                type="number"
                min="1"
                max="7"
                className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
                value={formData.targetFrequency || 7}
                onChange={(e) => onFieldChange('targetFrequency', parseInt(e.target.value) || 7)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Reminder Time</label>
              <input
                type="time"
                className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
                value={formData.reminderTime || ''}
                onChange={(e) => onFieldChange('reminderTime', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Category</label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
                value={formData.category || 'Personal'}
                onChange={(e) => onFieldChange('category', e.target.value)}
              >
                <option value="Health">Health</option>
                <option value="Productivity">Productivity</option>
                <option value="Learning">Learning</option>
                <option value="Personal">Personal</option>
                <option value="Fitness">Fitness</option>
                <option value="Social">Social</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Color</label>
              <input
                type="color"
                className="w-full h-12 p-1 bg-gray-50 rounded-xl outline-none cursor-pointer"
                value={formData.color || '#8B5CF6'}
                onChange={(e) => onFieldChange('color', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Notes / Reflections</label>
            <textarea
              className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main min-h-[100px]"
              value={formData.notes || ''}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              placeholder="Add notes or reflections..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

