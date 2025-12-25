import React from 'react';
import { OwnerSelectionModal } from '../EditorModals/OwnerSelectionModal';

interface KeyResultFormSectionProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  editId?: string;
  parentId?: string;
  data: {
    teamMembers: any[];
  };
  showOwnerModal: boolean;
  setShowOwnerModal: (show: boolean) => void;
}

const formatKeyResultValue = (
  current: number,
  target: number,
  decimals: number,
  measurementType: string,
  currency: string,
  customUnit?: string
): string => {
  const formatValue = (val: number) => {
    if (decimals === 0) return Math.round(val).toString();
    return val.toFixed(decimals);
  };

  let unit = '';
  if (measurementType === 'percentage') {
    unit = '%';
  } else if (measurementType === 'currency') {
    unit = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;
  } else if (measurementType === 'weight') {
    unit = 'kg';
  } else if (measurementType === 'distance') {
    unit = 'km';
  } else if (measurementType === 'time') {
    unit = 'hours';
  } else if (measurementType === 'height') {
    unit = 'm';
  } else if (measurementType === 'pages') {
    unit = 'pages';
  } else if (measurementType === 'chapters') {
    unit = 'chapters';
  } else if (measurementType === 'custom') {
    unit = customUnit || '';
  }

  return `${formatValue(current)}${unit ? ' ' + unit : ''} / ${formatValue(target)}${unit ? ' ' + unit : ''}`;
};

const getUnitForType = (
  measurementType: string,
  currency: string,
  customUnit?: string
): string => {
  if (measurementType === 'percentage') return '%';
  if (measurementType === 'currency') {
    return currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency || '€';
  }
  if (measurementType === 'weight') return 'kg';
  if (measurementType === 'distance') return 'km';
  if (measurementType === 'time') return 'hours';
  if (measurementType === 'height') return 'm';
  if (measurementType === 'pages') return 'pages';
  if (measurementType === 'chapters') return 'chapters';
  if (measurementType === 'custom') return customUnit || '';
  return '';
};

export const KeyResultFormSection: React.FC<KeyResultFormSectionProps> = ({
  formData,
  onFieldChange,
  editId,
  parentId,
  data,
  showOwnerModal,
  setShowOwnerModal,
}) => {
  const current = formData.current || 0;
  const target = formData.target || 100;
  const decimals = formData.decimals !== undefined ? formData.decimals : 0;
  const measurementType = formData.measurementType || 'percentage';
  const currency = formData.currency || 'EUR';
  const customUnit = formData.customUnit;
  const percent = Math.min(Math.round((current / (target || 1)) * 100), 100);
  const unit = getUnitForType(measurementType, currency, customUnit);

  const handleMeasurementTypeChange = (newType: string) => {
    onFieldChange('measurementType', newType);
    // Set defaults based on type
    if (newType === 'percentage') {
      onFieldChange('target', 100);
      onFieldChange('current', 0);
      onFieldChange('decimals', 0);
    } else if (newType === 'number') {
      onFieldChange('target', 100);
      onFieldChange('current', 0);
      onFieldChange('decimals', 0);
    } else if (newType === 'currency') {
      onFieldChange('target', 1000);
      onFieldChange('current', 0);
      onFieldChange('decimals', 2);
      if (!formData.currency) onFieldChange('currency', 'EUR');
    } else if (newType === 'weight') {
      onFieldChange('target', 80);
      onFieldChange('current', 85);
      onFieldChange('decimals', 1);
    } else if (newType === 'distance') {
      onFieldChange('target', 42.2);
      onFieldChange('current', 0);
      onFieldChange('decimals', 1);
    } else if (newType === 'time') {
      onFieldChange('target', 10000);
      onFieldChange('current', 0);
      onFieldChange('decimals', 0);
    } else if (newType === 'height') {
      onFieldChange('target', 180);
      onFieldChange('current', 175);
      onFieldChange('decimals', 0);
    } else if (newType === 'pages') {
      onFieldChange('target', 500);
      onFieldChange('current', 0);
      onFieldChange('decimals', 0);
    } else if (newType === 'chapters') {
      onFieldChange('target', 10);
      onFieldChange('current', 0);
      onFieldChange('decimals', 0);
    } else if (newType === 'custom') {
      onFieldChange('target', 100);
      onFieldChange('current', 0);
      onFieldChange('decimals', 0);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Visual Preview */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex justify-between items-start mb-2 opacity-50">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Live Preview</span>
        </div>
        <div className="pointer-events-none">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-base font-semibold text-text-main leading-snug flex-1 mr-2">
              {formData.title || 'Result Title'}
            </h4>
            <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-100 text-green-700">
              {formData.status || 'On Track'}
            </span>
          </div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs text-text-secondary font-medium">
              {formatKeyResultValue(current, target, decimals, measurementType, currency, customUnit)}
            </span>
            <span className="text-xs font-bold text-text-main">{percent}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">target</span>
          Measurable Result <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300"
          value={formData.title || ''}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="e.g. Increase NPS to 50"
          autoFocus
          required
        />
      </div>

      {/* Target Configuration */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">
          Target Configuration <span className="text-red-500">*</span>
        </label>

        {/* Measurement Type */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
            Measurement
          </label>
          <select
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main font-medium"
            value={measurementType}
            onChange={(e) => handleMeasurementTypeChange(e.target.value)}
          >
            <option value="number">Numeric</option>
            <option value="percentage">Percentage</option>
            <option value="currency">Money</option>
            <option value="weight">Weight</option>
            <option value="distance">Distance</option>
            <option value="time">Time</option>
            <option value="height">Height</option>
            <option value="pages">Pages</option>
            <option value="chapters">Chapters</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Currency Selection */}
        {measurementType === 'currency' && (
          <div className="mb-6">
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
              Currency
            </label>
            <select
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main font-medium"
              value={currency}
              onChange={(e) => onFieldChange('currency', e.target.value)}
            >
              <option value="EUR">€ EUR</option>
              <option value="USD">$ USD</option>
              <option value="GBP">£ GBP</option>
              <option value="JPY">¥ JPY</option>
              <option value="CNY">CN¥ CNY</option>
              <option value="CAD">CA$ CAD</option>
              <option value="AUD">A$ AUD</option>
              <option value="MXN">MX$ MXN</option>
              <option value="BRL">R$ BRL</option>
              <option value="KRW">₩ KRW</option>
              <option value="NZD">NZ$ NZD</option>
              <option value="CHF">CHF CHF</option>
            </select>
          </div>
        )}

        {/* Custom Unit Input */}
        {measurementType === 'custom' && (
          <div className="mb-6">
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
              Custom Unit
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main font-medium"
              value={customUnit || ''}
              onChange={(e) => onFieldChange('customUnit', e.target.value)}
              placeholder="e.g., reps, sets, items"
            />
          </div>
        )}

        {/* Decimals Selection */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
            Decimals
          </label>
          <select
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main font-medium"
            value={decimals}
            onChange={(e) => onFieldChange('decimals', parseInt(e.target.value))}
          >
            <option value="0">0 decimals</option>
            <option value="1">1 decimal</option>
            <option value="2">2 decimals</option>
          </select>
        </div>

        {/* Current and Target Values */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
              Current Value <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step={decimals === 0 ? 1 : decimals === 1 ? 0.1 : 0.01}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main font-medium pr-12"
                value={current}
                onChange={(e) => onFieldChange('current', parseFloat(e.target.value) || 0)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
                {unit}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
              Target value <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step={decimals === 0 ? 1 : decimals === 1 ? 0.1 : 0.01}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-text-main font-medium pr-12"
                value={target || (measurementType === 'percentage' ? 100 : measurementType === 'currency' ? 1000 : 100)}
                onChange={(e) => onFieldChange('target', parseFloat(e.target.value) || 0)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
                {unit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Initial Status */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
          Initial Status (Optional)
        </label>
        <p className="text-xs text-text-tertiary mb-3">Status will be determined by status updates</p>
        <div className="flex gap-2">
          {['On Track', 'At Risk', 'Off Track'].map((s) => (
            <button
              key={s}
              onClick={() => onFieldChange('status', s)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                formData.status === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-50 text-text-secondary border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Dates */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">
          Timeline Dates <span className="text-red-500">*</span>{' '}
          <span className="text-xs font-normal text-text-tertiary normal-case">
            (Required for Goal Timeline view)
          </span>
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

      {/* Owner Card */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
          Owner (Optional)
        </label>
        <p className="text-xs text-text-tertiary mb-2">Defaults to parent Objective owner if not set</p>
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

      {!editId && parentId && (
        <div className="flex items-center gap-2 justify-center text-text-tertiary">
          <span className="material-symbols-outlined text-[16px]">link</span>
          <span className="text-xs font-medium">Linked to parent Objective</span>
        </div>
      )}

      {/* Owner Modal */}
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



