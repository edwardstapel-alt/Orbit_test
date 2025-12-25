import React from 'react';

interface VisionFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  editId?: string;
  data: {
    lifeAreas: any[];
  };
}

export const VisionFormSection: React.FC<VisionFormSectionProps> = ({
  formData,
  onFieldChange,
  editId,
  data,
}) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">lightbulb</span>
          Vision Statement <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main placeholder:text-gray-400 resize-none leading-relaxed"
          rows={6}
          value={formData.statement || ''}
          onChange={(e) => onFieldChange('statement', e.target.value)}
          placeholder="Describe your vision for this Life Area. What does success look like? What do you want to achieve? How do you want to feel?"
          autoFocus
        />
        <p className="text-xs text-text-tertiary mt-3">
          This is your "Why" - the deeper purpose that drives your goals in this Life Area.
        </p>
      </div>

      {!editId && data.lifeAreas.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
            Life Area <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main appearance-none"
            value={formData.lifeAreaId || ''}
            onChange={(e) => onFieldChange('lifeAreaId', e.target.value)}
          >
            <option value="">Select Life Area</option>
            {data.lifeAreas.map((la) => (
              <option key={la.id} value={la.id}>
                {la.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">
          Vision Images (Optional)
        </label>
        <p className="text-xs text-text-secondary mb-4">
          Add images that represent your vision. These can be inspirational photos, goals, or
          visual reminders.
        </p>

        <div className="space-y-3">
          {(formData.images || []).map((img: string, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="size-20 rounded-xl bg-gray-100 bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url("${img}")` }}
              >
                {!img && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400">image</span>
                  </div>
                )}
              </div>
              <input
                type="text"
                className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main text-sm"
                value={img}
                onChange={(e) => {
                  const newImages = [...(formData.images || [])];
                  newImages[index] = e.target.value;
                  onFieldChange('images', newImages);
                }}
                placeholder="Image URL..."
              />
              <button
                onClick={() => {
                  const newImages = (formData.images || []).filter(
                    (_: any, i: number) => i !== index
                  );
                  onFieldChange('images', newImages);
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            const newImages = [...(formData.images || []), ''];
            onFieldChange('images', newImages);
          }}
          className="w-full mt-4 p-4 border-2 border-dashed border-gray-200 rounded-xl text-text-tertiary hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_photo_alternate</span>
          <span className="text-sm font-medium">Add Image</span>
        </button>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
          <div>
            <h4 className="text-sm font-bold text-blue-900 mb-1">Why Define a Vision?</h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              Your vision is your North Star. It helps you stay focused on what truly matters and
              makes decision-making easier. When you're clear on your vision, every goal and task
              becomes purposeful.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

