import React from 'react';

interface LifeAreaFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
}

export const LifeAreaFormSection: React.FC<LifeAreaFormSectionProps> = ({ formData, onFieldChange }) => {
  const iconOptions = [
    'category',
    'fitness_center',
    'work',
    'family_restroom',
    'school',
    'favorite',
    'savings',
    'travel',
    'restaurant',
    'home',
    'spa',
    'sports_soccer',
  ];

  const predefinedColors = [
    '#D95829',
    '#3B82F6',
    '#10B981',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F59E0B',
    '#EF4444',
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-soft border border-white">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="relative size-20 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: formData.image
                ? 'transparent'
                : `${formData.color || '#D95829'}20`,
              backgroundImage: formData.image ? `url("${formData.image}")` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!formData.image && (
              <span
                className="material-symbols-outlined text-4xl"
                style={{ color: formData.color || '#D95829' }}
              >
                {formData.icon || 'category'}
              </span>
            )}
            <div
              className="absolute bottom-0 right-0 size-4 rounded-full border-2 border-white"
              style={{ backgroundColor: formData.color || '#D95829' }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2">
              Life Area Name
            </label>
            <input
              type="text"
              className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300"
              value={formData.name || ''}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder="e.g. Health, Career, Family"
              autoFocus
            />
          </div>
        </div>
        <textarea
          className="w-full mt-4 text-base font-medium text-text-secondary bg-transparent outline-none placeholder:text-gray-400 resize-none"
          rows={2}
          value={formData.description || ''}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Add a description (optional)..."
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">
          Icon (Optional)
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
            value={formData.icon || ''}
            onChange={(e) => onFieldChange('icon', e.target.value)}
            placeholder="e.g. fitness_center, work, family_restroom"
          />
          <a
            href="https://fonts.google.com/icons"
            target="_blank"
            className="px-4 py-3 bg-gray-100 text-text-secondary rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Find
          </a>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {iconOptions.map((icon) => (
            <button
              key={icon}
              onClick={() => onFieldChange('icon', icon)}
              className={`p-3 rounded-xl border-2 transition-all ${
                formData.icon === icon
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{
                  color:
                    formData.icon === icon ? formData.color || '#D95829' : '#9CA3AF',
                }}
              >
                {icon}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">
          Color (Optional)
        </label>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {predefinedColors.map((color) => (
            <button
              key={color}
              onClick={() => onFieldChange('color', color)}
              className={`size-12 rounded-xl border-2 transition-all flex items-center justify-center ${
                formData.color === color
                  ? 'border-gray-900 scale-110 shadow-lg'
                  : 'border-gray-200 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            >
              {formData.color === color && (
                <span className="material-symbols-outlined text-white text-xl">check</span>
              )}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium text-text-secondary">Custom Color</span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="size-12 rounded-xl cursor-pointer border-2 border-gray-200"
              value={formData.color || '#D95829'}
              onChange={(e) => onFieldChange('color', e.target.value)}
            />
            <input
              type="text"
              className="flex-1 p-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm font-mono"
              value={(formData.color || '#D95829').toUpperCase()}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9A-F]/gi, '').slice(0, 6);
                if (value.length === 6) {
                  onFieldChange('color', '#' + value);
                } else if (value.length === 0) {
                  onFieldChange('color', '#D95829');
                }
              }}
              placeholder="#D95829"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
          Image URL (Optional)
        </label>
        <p className="text-xs text-text-tertiary mb-2">
          Add a custom image URL to replace the icon
        </p>
        <input
          type="text"
          className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
          value={formData.image || ''}
          onChange={(e) => onFieldChange('image', e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
};

