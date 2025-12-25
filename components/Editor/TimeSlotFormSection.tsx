import React from 'react';

interface TimeSlotFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  data: {
    objectives: any[];
    keyResults: any[];
    lifeAreas: any[];
  };
}

export const TimeSlotFormSection: React.FC<TimeSlotFormSectionProps> = ({
  formData,
  onFieldChange,
  data,
}) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold text-text-main placeholder:text-gray-400"
          value={formData.title || ''}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="e.g. Deep Work Session"
          autoFocus
          required
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
          value={formData.date || ''}
          onChange={(e) => onFieldChange('date', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
            value={formData.startTime || ''}
            onChange={(e) => onFieldChange('startTime', e.target.value)}
            required
          />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
            value={formData.endTime || ''}
            onChange={(e) => onFieldChange('endTime', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
          Type (Optional)
        </label>
        <select
          className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
          value={formData.type || 'deep-work'}
          onChange={(e) => onFieldChange('type', e.target.value)}
        >
          <option value="deep-work">Deep Work</option>
          <option value="goal-work">Goal Work</option>
          <option value="life-area">Life Area</option>
          <option value="meeting">Meeting</option>
          <option value="personal">Personal</option>
        </select>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
          Color (Optional)
        </label>
        <input
          type="color"
          className="w-full h-12 rounded-xl cursor-pointer"
          value={formData.color || '#D95829'}
          onChange={(e) => onFieldChange('color', e.target.value)}
        />
      </div>

      {data.objectives.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
            Link to Goals (Optional)
          </label>
          <select
            className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main appearance-none"
            value={formData.keyResultId || ''}
            onChange={(e) => {
              const selectedKRId = e.target.value;
              onFieldChange('keyResultId', selectedKRId);
              if (selectedKRId) {
                const selectedKR = data.keyResults.find((kr) => kr.id === selectedKRId);
                if (selectedKR) {
                  onFieldChange('objectiveId', selectedKR.objectiveId);
                  const parentObjective = data.objectives.find((obj) => obj.id === selectedKR.objectiveId);
                  if (parentObjective?.lifeAreaId) {
                    onFieldChange('lifeAreaId', parentObjective.lifeAreaId);
                  }
                }
              }
            }}
          >
            <option value="">No Goal</option>
            {data.keyResults.map((kr) => (
              <option key={kr.id} value={kr.id}>
                {kr.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
          Description (Optional)
        </label>
        <textarea
          className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main min-h-[100px]"
          value={formData.description || ''}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Add a description..."
        />
      </div>
    </div>
  );
};

