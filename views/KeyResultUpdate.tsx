import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

interface KeyResultUpdateProps {
  keyResultId: string;
  onClose: () => void;
  onEditFull: () => void;
}

export const KeyResultUpdate: React.FC<KeyResultUpdateProps> = ({ keyResultId, onClose, onEditFull }) => {
  const { keyResults, updateKeyResult, teamMembers, formatKeyResultValue } = useData();
  const [currentValue, setCurrentValue] = useState(0);
  const [status, setStatus] = useState<string>('On Track');
  const [activeModal, setActiveModal] = useState<'owner' | 'date' | null>(null);
  
  const kr = keyResults.find(k => k.id === keyResultId);

  useEffect(() => {
    if (kr) {
      setCurrentValue(kr.current);
      setStatus(kr.status);
    }
  }, [kr]);

  if (!kr) return null;

  const handleSave = () => {
    updateKeyResult({ ...kr, current: currentValue, status: status as any });
    onClose();
  };

  const handleUpdateOwner = (member: any) => {
    updateKeyResult({ ...kr, owner: member.name });
    setActiveModal(null);
  };

  const handleUpdateDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateKeyResult({ ...kr, dueDate: e.target.value });
  };

  // Defaults if not set on KR
  const displayOwner = kr.owner || 'Unassigned';
  const displayDate = kr.dueDate || 'No Due Date';
  // Find owner image
  const ownerMember = teamMembers.find(t => t.name === kr.owner);
  const ownerImage = ownerMember ? ownerMember.image : 'https://via.placeholder.com/100';

  const safeTarget = kr.target || 1;
  const percentage = Math.min(Math.round((currentValue / safeTarget) * 100), 100);
  const step = safeTarget <= 10 ? 0.1 : 1;

  return (
    <div className="absolute inset-0 z-[70] flex items-end justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl pointer-events-auto p-6 animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="flex justify-center mb-4 shrink-0">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        <div className="flex items-start justify-between mb-6 shrink-0">
            <div>
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Update Progress</span>
                <h2 className="text-xl font-bold text-text-main mt-1 leading-tight">{kr.title}</h2>
            </div>
            <button onClick={onEditFull} className="p-2 text-text-tertiary hover:bg-gray-100 rounded-full transition-colors">
                <span className="material-symbols-outlined">edit</span>
            </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
             <div onClick={() => setActiveModal('owner')} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-2 cursor-pointer hover:border-primary/30 transition-colors">
                 <img src={ownerImage} className="size-8 rounded-full bg-gray-200" alt="Owner" />
                 <div className="overflow-hidden">
                     <p className="text-[10px] text-text-tertiary font-bold uppercase">Owner</p>
                     <p className="text-sm font-semibold text-text-main truncate">{displayOwner}</p>
                 </div>
             </div>
             <div onClick={() => setActiveModal('date')} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-2 cursor-pointer hover:border-primary/30 transition-colors">
                 <div className="size-8 rounded-full bg-white flex items-center justify-center text-text-secondary border border-gray-200">
                     <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                 </div>
                 <div className="overflow-hidden">
                     <p className="text-[10px] text-text-tertiary font-bold uppercase">Due Date</p>
                     <p className="text-sm font-semibold text-text-main truncate">{displayDate}</p>
                 </div>
             </div>
        </div>

        <div className="mb-8 overflow-y-auto">
            <div className="flex items-end justify-between mb-2">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-primary">{currentValue}</span>
                    <span className="text-text-secondary font-medium">/ {formatKeyResultValue(kr, kr.target)}</span>
                </div>
                <span className="text-sm font-bold text-text-main">{percentage}% Done</span>
            </div>
            
            <input 
                type="range" 
                min="0" 
                max={kr.target}
                step={step}
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="w-full h-3 bg-transparent cursor-pointer"
            />
            <div className="flex justify-between mt-4">
                 <button onClick={() => setCurrentValue(Number(Math.max(0, currentValue - step).toFixed(1)))} className="size-10 rounded-full border border-gray-200 flex items-center justify-center text-text-main hover:bg-gray-50">
                    <span className="material-symbols-outlined">remove</span>
                 </button>
                 <button onClick={() => setCurrentValue(Number((currentValue + step).toFixed(1)))} className="size-10 rounded-full border border-gray-200 flex items-center justify-center text-text-main hover:bg-gray-50">
                    <span className="material-symbols-outlined">add</span>
                 </button>
            </div>
        </div>

        <div className="mb-6 shrink-0">
            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Status Check-in</label>
            <div className="flex gap-2">
                {['On Track', 'At Risk', 'Off Track'].map(s => (
                    <button 
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                            status === s 
                            ? (s === 'On Track' ? 'bg-green-100 border-green-200 text-green-700' : s === 'At Risk' ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-red-100 border-red-200 text-red-700')
                            : 'bg-white border-gray-100 text-text-secondary hover:border-gray-300'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>

        <button onClick={handleSave} className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-glow hover:bg-primary-soft transition-colors active:scale-[0.98] shrink-0">
            Update Key Result
        </button>

         {/* NESTED MODALS */}
         {activeModal && (
            <div className="absolute inset-0 z-[80] flex items-center justify-center pointer-events-auto">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
                <div className="bg-white w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-fade-in-up">
                    
                    {activeModal === 'owner' && (
                        <>
                            <h3 className="text-lg font-bold text-text-main mb-4">Assign Owner</h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {/* Primary owner first */}
                                {teamMembers
                                  .sort((a, b) => {
                                    if (a.role === 'You') return -1;
                                    if (b.role === 'You') return 1;
                                    return 0;
                                  })
                                  .map(member => (
                                    <button 
                                        key={member.id} 
                                        onClick={() => handleUpdateOwner(member)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors ${kr.owner === member.name ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'}`}
                                    >
                                        <img src={member.image} alt={member.name} className="size-10 rounded-full" />
                                        <div className="text-left flex-1">
                                            <p className="font-semibold text-text-main text-sm">{member.name}</p>
                                            <p className="text-xs text-text-tertiary">{member.role}</p>
                                        </div>
                                        {kr.owner === member.name && <span className="material-symbols-outlined text-primary ml-auto">check</span>}
                                        {member.role === 'You' && (
                                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase ml-2">Primary</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {activeModal === 'date' && (
                        <>
                            <h3 className="text-lg font-bold text-text-main mb-4">Set Due Date</h3>
                            <div className="p-2">
                                <input 
                                    type="date" 
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-text-main font-medium"
                                    value={kr.dueDate || ''}
                                    onChange={handleUpdateDate}
                                />
                            </div>
                            <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-3 bg-primary text-white font-bold rounded-xl">
                                Done
                            </button>
                        </>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
