import React from 'react';
import { LifeAreaSelectionModal } from '../EditorModals/LifeAreaSelectionModal';
import { OwnerSelectionModal } from '../EditorModals/OwnerSelectionModal';
import { getStatusBadge, getStatusColor } from '../../utils/editor/editorHelpers';
import { KeyResult } from '../../types';

interface ObjectiveFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  editId?: string;
  data: {
    lifeAreas: any[];
    teamMembers: any[];
    keyResults: KeyResult[];
    showCategory: boolean;
    formatKeyResultValue: (kr: KeyResult, value: number) => string;
  };
  showLifeAreaModal: boolean;
  setShowLifeAreaModal: (show: boolean) => void;
  showOwnerModal: boolean;
  setShowOwnerModal: (show: boolean) => void;
  showObjectiveTemplateSelector: boolean;
  setShowObjectiveTemplateSelector: (show: boolean) => void;
  loadedTemplateId: string | null;
  templateKeyResults: Partial<KeyResult>[];
  setTemplateKeyResults: (krs: Partial<KeyResult>[]) => void;
  getEffectiveStatus: (status: string, entityId: string, isKeyResult: boolean) => string;
  onEdit?: (type: any, id?: string, parentId?: string) => void;
}

export const ObjectiveFormSection: React.FC<ObjectiveFormSectionProps> = ({
  formData,
  onFieldChange,
  editId,
  data,
  showLifeAreaModal,
  setShowLifeAreaModal,
  showOwnerModal,
  setShowOwnerModal,
  showObjectiveTemplateSelector,
  setShowObjectiveTemplateSelector,
  loadedTemplateId,
  templateKeyResults,
  setTemplateKeyResults,
  getEffectiveStatus,
  onEdit,
}) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Hero Card - Title & Description */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-soft border border-white">
        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">flag</span>
          Objective <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full text-3xl font-bold bg-transparent outline-none placeholder:text-gray-300 resize-none leading-tight"
          rows={2}
          value={formData.title || ''}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="What do you want to achieve?"
          autoFocus
          required
        />
        <input
          type="text"
          className="w-full mt-4 text-base font-medium text-text-secondary bg-transparent outline-none placeholder:text-gray-400"
          value={formData.description || ''}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Add a brief description or 'why' (optional)..."
        />
      </div>

      {/* Template Selector */}
      {!editId && (
        <div>
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
            Start vanuit Template (optioneel)
          </label>
          <button
            type="button"
            onClick={() => setShowObjectiveTemplateSelector(true)}
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
          >
            <span className="text-text-main">Selecteer goal template...</span>
            <span className="material-symbols-outlined text-text-tertiary">arrow_forward</span>
          </button>
        </div>
      )}

      {/* Category Switcher */}
      {data.showCategory && (
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 px-2">
            Category (Optional)
          </label>
          <div className="flex">
            {['professional', 'personal'].map((cat) => (
              <button
                key={cat}
                onClick={() => onFieldChange('category', cat)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${
                  formData.category === cat
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-text-tertiary hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:border-primary/30 transition-colors">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
          Initial Status (Optional)
        </label>
        <select
          className="w-full bg-transparent font-semibold outline-none text-text-main appearance-none cursor-pointer"
          value={formData.status || 'On Track'}
          onChange={(e) => onFieldChange('status', e.target.value)}
        >
          <option value="On Track">🟢 On Track</option>
          <option value="At Risk">🟠 At Risk</option>
          <option value="Off Track">🔴 Off Track</option>
          <option value="No status">⚪ No status</option>
        </select>
        <p className="text-xs text-text-tertiary mt-2">Status will be determined by Key Result updates</p>
      </div>

      {/* Timeline Dates */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">
          Timeline Dates <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
              value={formData.startDate || ''}
              onChange={(e) => onFieldChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main"
              value={formData.endDate || ''}
              onChange={(e) => onFieldChange('endDate', e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-text-tertiary mt-3">
          These dates are required and used for the Goal Timeline (Gantt chart) view.
        </p>
      </div>

      {/* Key Results from Template */}
      {!editId && loadedTemplateId && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest">
              Key Results
            </label>
            <span className="text-xs text-text-tertiary">
              {templateKeyResults.length} result{templateKeyResults.length !== 1 ? 's' : ''}
            </span>
          </div>
          {templateKeyResults.length > 0 ? (
            <div className="space-y-3">
              {templateKeyResults.map((kr, index) => (
                <div key={kr.id || index} className="bg-gray-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <input
                      type="text"
                      className="flex-1 text-sm font-semibold text-text-main bg-transparent outline-none"
                      value={kr.title || ''}
                      onChange={(e) => {
                        const updated = [...templateKeyResults];
                        updated[index] = { ...updated[index], title: e.target.value };
                        setTemplateKeyResults(updated);
                      }}
                      placeholder="Key Result title"
                    />
                    <button
                      onClick={() => {
                        const updated = templateKeyResults.filter((_, i) => i !== index);
                        setTemplateKeyResults(updated);
                      }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium ml-2"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                        Current
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 bg-white rounded-lg outline-none text-sm font-medium"
                        value={kr.current || 0}
                        onChange={(e) => {
                          const updated = [...templateKeyResults];
                          updated[index] = { ...updated[index], current: parseFloat(e.target.value) || 0 };
                          setTemplateKeyResults(updated);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                        Target
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 bg-white rounded-lg outline-none text-sm font-medium"
                        value={kr.target || 100}
                        onChange={(e) => {
                          const updated = [...templateKeyResults];
                          updated[index] = { ...updated[index], target: parseFloat(e.target.value) || 100 };
                          setTemplateKeyResults(updated);
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                      Measurement Type
                    </label>
                    <select
                      className="w-full p-2 bg-white rounded-lg outline-none text-sm font-medium"
                      value={kr.measurementType || 'percentage'}
                      onChange={(e) => {
                        const updated = [...templateKeyResults];
                        updated[index] = { ...updated[index], measurementType: e.target.value as any };
                        setTemplateKeyResults(updated);
                      }}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="number">Number</option>
                      <option value="currency">Currency</option>
                      <option value="weight">Weight</option>
                      <option value="distance">Distance</option>
                      <option value="time">Time</option>
                      <option value="height">Height</option>
                      <option value="pages">Pages</option>
                      <option value="chapters">Chapters</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  {kr.measurementType === 'custom' && (
                    <div className="mt-3">
                      <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">
                        Custom Unit
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 bg-white rounded-lg outline-none text-sm font-medium"
                        value={kr.customUnit || ''}
                        onChange={(e) => {
                          const updated = [...templateKeyResults];
                          updated[index] = { ...updated[index], customUnit: e.target.value };
                          setTemplateKeyResults(updated);
                        }}
                        placeholder="e.g. hours, km, etc."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-text-tertiary text-sm">
              <p>No key results in template. Add them below.</p>
            </div>
          )}
          <button
            onClick={() => {
              setTemplateKeyResults([
                ...templateKeyResults,
                {
                  title: '',
                  current: 0,
                  target: 100,
                  measurementType: 'percentage',
                  status: 'On Track',
                },
              ]);
            }}
            className="mt-4 w-full py-2 text-sm font-semibold text-primary border-2 border-primary rounded-xl hover:bg-primary/5 transition-colors"
          >
            + Add Key Result
          </button>
        </div>
      )}

      {/* Timeline Color */}
      {formData.startDate && formData.endDate && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">
            Timeline Color
          </label>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {['#D95829', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'].map(
              (color) => {
                const currentColor =
                  formData.timelineColor ||
                  (data.lifeAreas.find((la) => la.id === formData.lifeAreaId)?.color || '#D95829');
                return (
                  <button
                    key={color}
                    onClick={() => onFieldChange('timelineColor', color)}
                    className={`size-12 rounded-xl border-2 transition-all flex items-center justify-center ${
                      currentColor === color
                        ? 'border-gray-900 scale-110 shadow-lg'
                        : 'border-gray-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {currentColor === color && (
                      <span className="material-symbols-outlined text-white text-xl">check</span>
                    )}
                  </button>
                );
              }
            )}
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-text-secondary">Custom Color</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="size-12 rounded-xl cursor-pointer border-2 border-gray-200"
                value={
                  formData.timelineColor ||
                  (data.lifeAreas.find((la) => la.id === formData.lifeAreaId)?.color || '#D95829')
                }
                onChange={(e) => onFieldChange('timelineColor', e.target.value)}
              />
              <input
                type="text"
                className="flex-1 p-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm font-mono"
                value={(
                  formData.timelineColor ||
                  (data.lifeAreas.find((la) => la.id === formData.lifeAreaId)?.color || '#D95829')
                ).toUpperCase()}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9A-F]/gi, '').slice(0, 6);
                  if (value.length === 6) {
                    onFieldChange('timelineColor', '#' + value);
                  }
                }}
                placeholder="#D95829"
              />
            </div>
            <p className="text-xs text-text-tertiary">Defaults to Life Area color</p>
          </div>
        </div>
      )}

      {/* Life Area Card */}
      {data.lifeAreas.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
              Life Area (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowLifeAreaModal(true)}
              className="text-[10px] text-primary font-bold hover:underline"
            >
              Select or Create
            </button>
          </div>
          {formData.lifeAreaId ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {(() => {
                const selectedLA = data.lifeAreas.find((la) => la.id === formData.lifeAreaId);
                return selectedLA ? (
                  <>
                    {selectedLA.icon && (
                      <span className="material-symbols-outlined text-lg" style={{ color: selectedLA.color }}>
                        {selectedLA.icon}
                      </span>
                    )}
                    <span className="font-medium text-text-main flex-1">{selectedLA.name}</span>
                    <button
                      type="button"
                      onClick={() => onFieldChange('lifeAreaId', '')}
                      className="text-text-tertiary hover:text-text-main"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </>
                ) : null;
              })()}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLifeAreaModal(true)}
              className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-tertiary text-left hover:bg-gray-100 transition-colors"
            >
              Select Life Area...
            </button>
          )}
        </div>
      )}

      {/* Owner Card */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
          Owner
        </label>
        <button
          onClick={() => setShowOwnerModal(true)}
          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-slate-100"
        >
          <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
            {formData.ownerImage ? (
              <img src={formData.ownerImage} alt="owner" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-gray-400">person</span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-lg text-text-main">{formData.owner || 'Select owner'}</p>
            {formData.owner && (
              <p className="text-xs text-text-tertiary">
                {data.teamMembers.find((m) => m.name === formData.owner)?.role || ''}
              </p>
            )}
          </div>
          <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
        </button>
      </div>

      {/* Link Existing Key Results */}
      {editId && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
              Key Results
            </label>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit('keyResult', undefined, editId)}
                className="text-primary text-sm font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Add Result
              </button>
            )}
          </div>
          {(() => {
            const linkedKRs = data.keyResults.filter((kr) => kr.objectiveId === editId);
            if (linkedKRs.length > 0) {
              return (
                <div className="space-y-3">
                  {linkedKRs.map((kr) => {
                    const percent = Math.min(Math.round((kr.current / kr.target) * 100), 100);
                    return (
                      <div
                        key={kr.id}
                        onClick={() => onEdit && onEdit('keyResult', kr.id, editId)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md hover:border-primary/20 cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-base font-semibold text-text-main leading-snug flex-1 mr-2 group-hover:text-primary transition-colors">
                            {kr.title}
                          </h4>
                          <span
                            className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getStatusBadge(
                              getEffectiveStatus(kr.status, kr.id, true)
                            )}`}
                          >
                            {getEffectiveStatus(kr.status, kr.id, true)}
                          </span>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                          <span className="text-xs text-text-secondary font-medium">
                            {data.formatKeyResultValue(kr, kr.current)} /{' '}
                            <span className="text-text-tertiary">{data.formatKeyResultValue(kr, kr.target)}</span>
                          </span>
                          <span className="text-xs font-bold text-text-main">{percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getStatusColor(
                              getEffectiveStatus(kr.status, kr.id, true)
                            )} opacity-70`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }
            return (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-text-tertiary text-sm">
                No Key Results yet.
              </div>
            );
          })()}
        </div>
      )}

      {/* Modals */}
      {showLifeAreaModal && (
        <LifeAreaSelectionModal
          lifeAreas={data.lifeAreas}
          selectedLifeAreaId={formData.lifeAreaId}
          onSelect={(lifeAreaId) => {
            onFieldChange('lifeAreaId', lifeAreaId);
            setShowLifeAreaModal(false);
          }}
          onClose={() => setShowLifeAreaModal(false)}
          onCreateNew={() => {
            // Handle create new life area
            setShowLifeAreaModal(false);
          }}
        />
      )}

      {showOwnerModal && (
        <OwnerSelectionModal
          teamMembers={data.teamMembers}
          selectedOwner={formData.owner}
          onSelect={(owner, ownerImage) => {
            onFieldChange('owner', owner);
            onFieldChange('ownerImage', ownerImage);
            setShowOwnerModal(false);
          }}
          onClose={() => setShowOwnerModal(false)}
          onAddTeamMember={() => {
            // Handle add team member
          }}
        />
      )}
    </div>
  );
};



