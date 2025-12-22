import React, { useState } from 'react';
import { Conflict, ConflictResolution } from '../types';

interface ConflictResolverProps {
  conflict: Conflict;
  onResolve: (conflictId: string, resolution: ConflictResolution) => void;
  onDismiss?: () => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  conflict,
  onResolve,
  onDismiss,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolution['strategy']>('last_write_wins');
  const [showDetails, setShowDetails] = useState(false);

  const handleResolve = () => {
    const resolution: ConflictResolution = {
      strategy: selectedStrategy,
      resolvedBy: 'user',
      resolvedAt: new Date().toISOString(),
    };
    onResolve(conflict.id, resolution);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-amber-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-text-main mb-1">
            Conflict Gedetecteerd
          </h3>
          <p className="text-sm text-text-tertiary">
            {conflict.entityType} • {conflict.service}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          conflict.priority === 'high' ? 'bg-red-100 text-red-700' :
          conflict.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {conflict.priority.toUpperCase()}
        </span>
      </div>

      {/* Conflict Details */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-primary font-medium mb-2"
        >
          {showDetails ? 'Verberg' : 'Toon'} Details
        </button>
        
        {showDetails && (
          <div className="space-y-3 mt-2">
            {conflict.conflictFields.map((field, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-bold text-text-tertiary mb-2 uppercase">
                  {field.field}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">App Versie</div>
                    <div className="text-sm text-text-main bg-white p-2 rounded">
                      {String(field.appValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Externe Versie</div>
                    <div className="text-sm text-text-main bg-white p-2 rounded">
                      {String(field.externalValue)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Strategy Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-main mb-2">
          Oplossingsstrategie
        </label>
        <select
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value as ConflictResolution['strategy'])}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="last_write_wins">Laatste wijziging wint</option>
          <option value="app_wins">App versie behouden</option>
          <option value="external_wins">Externe versie gebruiken</option>
          {conflict.conflictFields.some(f => f.canMerge) && (
            <option value="merge">Beide versies combineren</option>
          )}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleResolve}
          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Oplossen
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Later
          </button>
        )}
      </div>
    </div>
  );
};
