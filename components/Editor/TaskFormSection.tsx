import React from 'react';
import { QuickLinkSelector } from '../QuickLinkSelector';
import { getDayPartFromTime } from '../../utils/editor/editorHelpers';

interface TaskFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  data: {
    keyResults: any[];
    objectives: any[];
    lifeAreas: any[];
    friends: any[];
    timeSlots: any[];
    dayParts: any[];
  };
  contextObjectiveId?: string;
  contextLifeAreaId?: string;
  onEdit?: (type: any, id?: string, parentId?: string) => void;
}

export const TaskFormSection: React.FC<TaskFormSectionProps> = ({
  formData,
  onFieldChange,
  data,
  contextObjectiveId,
  contextLifeAreaId,
  onEdit,
}) => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1 px-1">
          Task Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full p-4 rounded-xl text-xl font-bold bg-transparent outline-none placeholder:text-gray-300"
          value={formData.title || ''}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="What needs focus?"
          autoFocus
          required
        />
      </div>

      {/* Category */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          className="w-full bg-transparent font-medium outline-none text-text-main"
          value={formData.tag || 'Work'}
          onChange={(e) => onFieldChange('tag', e.target.value)}
          required
        >
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Health">Health</option>
          <option value="Family">Family</option>
          <option value="Finance">Finance</option>
          <option value="Strategy">Strategy</option>
        </select>
      </div>

      {/* Priority */}
      <div
        className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer"
        onClick={() => onFieldChange('priority', !formData.priority)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-8 rounded-full flex items-center justify-center ${
              formData.priority ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">priority_high</span>
          </div>
          <span className="font-semibold text-text-main">High Priority</span>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            formData.priority ? 'border-primary bg-primary' : 'border-gray-300'
          }`}
        >
          {formData.priority && (
            <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
          Schedule (Optional)
        </label>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Date</label>
            <input
              type="date"
              className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
              value={formData.scheduledDate || ''}
              onChange={(e) => onFieldChange('scheduledDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Time</label>
            <input
              type="time"
              step="900"
              className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
              value={formData.scheduledTime || ''}
              onChange={(e) => {
                const newTime = e.target.value;
                onFieldChange('scheduledTime', newTime);
                const autoDayPart = getDayPartFromTime(newTime, data.dayParts);
                onFieldChange('dayPart', autoDayPart);
              }}
            />
            {formData.dayPart && (
              <p className="text-xs text-text-tertiary mt-1">
                Automatically set to: <span className="font-medium">{formData.dayPart}</span>
              </p>
            )}
          </div>
          {data.timeSlots.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Link to Time Block
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
                value={formData.timeSlotId || ''}
                onChange={(e) => onFieldChange('timeSlotId', e.target.value)}
              >
                <option value="">No Time Block</option>
                {data.timeSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.title} ({slot.date} {slot.startTime}-{slot.endTime})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Link to Goals */}
      {(data.keyResults.length > 0 || data.objectives.length > 0 || data.lifeAreas.length > 0) && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
            Link to Goals (Optional)
          </label>
          <QuickLinkSelector
            entityType="task"
            currentLinks={{
              objectiveId: formData.objectiveId,
              keyResultId: formData.keyResultId,
              lifeAreaId: formData.lifeAreaId,
            }}
            onLinkChange={(links) => {
              if (links.objectiveId !== formData.objectiveId) {
                onFieldChange('objectiveId', links.objectiveId || '');
              }
              if (links.keyResultId !== formData.keyResultId) {
                onFieldChange('keyResultId', links.keyResultId || '');
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
            entityTitle={formData.title}
            entityDescription={formData.description}
            entityDate={formData.dueDate}
            contextLifeAreaId={contextLifeAreaId}
            contextObjectiveId={contextObjectiveId}
            showSuggestions={true}
          />
        </div>
      )}

      {/* Link to Person */}
      {data.friends.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
            Link to Person (Optional)
          </label>
          <div className="flex items-center gap-3">
            {formData.friendId && (() => {
              const selectedFriend = data.friends.find((f) => f.id === formData.friendId);
              return selectedFriend ? (
                <div
                  className="size-10 rounded-full bg-cover bg-center border-2 border-white shadow-sm flex-shrink-0"
                  style={{
                    backgroundImage: selectedFriend.image
                      ? `url("${selectedFriend.image}")`
                      : 'none',
                    backgroundColor: selectedFriend.image ? 'transparent' : '#E5E7EB',
                  }}
                >
                  {!selectedFriend.image && (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                      <span className="material-symbols-outlined text-xl">person</span>
                    </div>
                  )}
                </div>
              ) : null;
            })()}
            <select
              className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
              value={formData.friendId || ''}
              onChange={(e) => onFieldChange('friendId', e.target.value)}
            >
              <option value="">No person linked</option>
              {data.friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};


