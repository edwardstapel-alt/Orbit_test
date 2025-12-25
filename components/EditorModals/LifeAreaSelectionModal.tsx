import React from 'react';

interface LifeArea {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface LifeAreaSelectionModalProps {
  lifeAreas: LifeArea[];
  selectedLifeAreaId: string;
  onSelect: (lifeAreaId: string) => void;
  onClose: () => void;
  onCreateNew: () => void;
}

export const LifeAreaSelectionModal: React.FC<LifeAreaSelectionModalProps> = ({
  lifeAreas,
  selectedLifeAreaId,
  onSelect,
  onClose,
  onCreateNew,
}) => {
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-fade-in-up max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-bold text-text-main mb-4">Select Life Area</h3>

        <div className="flex-1 overflow-y-auto space-y-3">
          <button
            onClick={onCreateNew}
            className="w-full p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-primary">add</span>
            <span className="font-semibold text-primary">Create New Life Area</span>
          </button>

          {lifeAreas.length > 0 && (
            <>
              <div className="mb-2">
                <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">
                  Select Existing
                </h4>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onSelect('');
                    onClose();
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-colors flex items-center gap-3 ${
                    !selectedLifeAreaId
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl text-text-tertiary">close</span>
                  <span className="font-semibold text-text-main">No Life Area</span>
                  {!selectedLifeAreaId && (
                    <span className="material-symbols-outlined text-primary ml-auto">check</span>
                  )}
                </button>
                {lifeAreas.map(la => (
                  <button
                    key={la.id}
                    onClick={() => {
                      onSelect(la.id);
                      onClose();
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-colors flex items-center gap-3 ${
                      selectedLifeAreaId === la.id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {la.icon && (
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ color: la.color }}
                      >
                        {la.icon}
                      </span>
                    )}
                    <span className="font-semibold text-text-main flex-1">{la.name}</span>
                    {selectedLifeAreaId === la.id && (
                      <span className="material-symbols-outlined text-primary">check</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


