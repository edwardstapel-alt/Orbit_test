import React from 'react';

interface PlaceFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
}

export const PlaceFormSection: React.FC<PlaceFormSectionProps> = ({ formData, onFieldChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
          Place Name <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4 mb-4">
          <div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <span className="material-symbols-outlined">storefront</span>
          </div>
          <input
            type="text"
            className="flex-1 text-xl font-bold outline-none placeholder:text-gray-300"
            value={formData.name || ''}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="Place Name"
            autoFocus
            required
          />
        </div>
        <input
          type="text"
          className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main mb-4"
          value={formData.address || ''}
          onChange={(e) => onFieldChange('address', e.target.value)}
          placeholder="Address or Area (optional)"
        />
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
          Type (Optional)
        </label>
        <div className="flex gap-2">
          {['Coffee', 'Food', 'Gym', 'Park'].map((t) => (
            <button
              key={t}
              onClick={() => onFieldChange('type', t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                formData.type === t
                  ? 'bg-text-main text-white'
                  : 'bg-gray-50 text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

