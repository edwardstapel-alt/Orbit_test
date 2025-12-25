import React from 'react';

interface OwnerSelectionModalProps {
  teamMembers: Array<{ id: string; name: string; image: string; role: string }>;
  selectedOwner: string;
  onSelect: (owner: string, ownerImage: string) => void;
  onClose: () => void;
  onAddTeamMember: () => void;
}

export const OwnerSelectionModal: React.FC<OwnerSelectionModalProps> = ({
  teamMembers,
  selectedOwner,
  onSelect,
  onClose,
  onAddTeamMember,
}) => {
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-fade-in-up">
        <h3 className="text-lg font-bold text-text-main mb-4">Select Owner</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {teamMembers
            .sort((a, b) => {
              if (a.role === 'You') return -1;
              if (b.role === 'You') return 1;
              return 0;
            })
            .map(member => (
              <button
                key={member.id}
                onClick={() => {
                  onSelect(member.name, member.image);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors ${
                  selectedOwner === member.name
                    ? 'bg-primary/5 border border-primary/20'
                    : 'border border-transparent'
                }`}
              >
                <img src={member.image} alt={member.name} className="size-10 rounded-full" />
                <div className="text-left flex-1">
                  <p className="font-semibold text-text-main text-sm">{member.name}</p>
                  <p className="text-xs text-text-tertiary">{member.role}</p>
                </div>
                {selectedOwner === member.name && (
                  <span className="material-symbols-outlined text-primary ml-auto">check</span>
                )}
                {member.role === 'You' && (
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase ml-2">
                    Primary
                  </span>
                )}
              </button>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onAddTeamMember}
            className="w-full p-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-primary font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-sm">group_add</span>
            <span>Add Team Member</span>
          </button>
          <p className="text-xs text-text-tertiary text-center mt-2">Manage team in Settings</p>
        </div>
      </div>
    </div>
  );
};


