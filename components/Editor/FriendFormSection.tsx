import React from 'react';

interface FriendFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
}

export const FriendFormSection: React.FC<FriendFormSectionProps> = ({ formData, onFieldChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100 flex flex-col items-center gap-4">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
          Friend's Name <span className="text-red-500">*</span>
        </label>
        <div className="size-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
          <span className="material-symbols-outlined text-[40px] text-gray-300">person_add</span>
        </div>
        <input
          type="text"
          className="w-full text-center text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300"
          value={formData.name || ''}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder="New Friend's Name"
          autoFocus
          required
        />
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
            Relationship Type (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {['friend', 'professional', 'family', 'mentor'].map((role) => (
              <button
                key={role}
                onClick={() => onFieldChange('roleType', role)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                  formData.roleType === role
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-text-secondary'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
            Label (Optional)
          </label>
          <input
            type="text"
            className="w-full bg-gray-50 p-3 rounded-xl outline-none font-medium"
            value={formData.role || ''}
            onChange={(e) => onFieldChange('role', e.target.value)}
            placeholder="e.g. Bestie, Gym Buddy"
          />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
            Location (Optional)
          </label>
          <input
            type="text"
            className="w-full bg-gray-50 p-3 rounded-xl outline-none font-medium"
            value={formData.location || ''}
            onChange={(e) => onFieldChange('location', e.target.value)}
            placeholder="e.g. San Francisco"
          />
        </div>
      </div>
    </div>
  );
};

