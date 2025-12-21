import React, { useState } from 'react';
import { useData } from '../context/DataContext';

interface TeamSettingsProps {
  onBack: () => void;
}

export const TeamSettings: React.FC<TeamSettingsProps> = ({ onBack }) => {
  const [newMemberName, setNewMemberName] = useState('');
  const { teamMembers, addTeamMember, deleteTeamMember } = useData();

  const handleAddMember = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newMemberName.trim()) return;
      addTeamMember({
          id: Math.random().toString(36).substr(2, 9),
          name: newMemberName,
          role: 'Member',
          image: `https://ui-avatars.com/api/?name=${newMemberName}&background=random`
      });
      setNewMemberName('');
  }

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <header className="sticky z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50" style={{ top: '50px' }}>
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Team Settings</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-text-main mb-2">Invite User</h2>
            <p className="text-sm text-text-secondary mb-4">Add collaborators to your workspace.</p>
            <form onSubmit={handleAddMember} className="flex gap-2">
                <input 
                type="text" 
                placeholder="Enter name or email..." 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                />
                <button type="submit" className="bg-primary text-white rounded-xl px-4 py-3 text-sm font-bold shadow-glow hover:bg-primary-soft transition-colors">
                    Invite
                </button>
            </form>
        </div>

        <div>
             <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3 pl-1">Active Members</h3>
             <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-2">
                 {teamMembers.map(member => (
                     <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                         <div className="flex items-center gap-3">
                             <img src={member.image} alt={member.name} className="size-10 rounded-full bg-gray-100" />
                             <div>
                                 <p className="text-sm font-bold text-text-main">{member.name}</p>
                                 <p className="text-xs text-text-secondary">{member.role}</p>
                             </div>
                         </div>
                         {member.role !== 'You' ? (
                            <button onClick={() => deleteTeamMember(member.id)} className="size-8 flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                         ) : (
                             <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">Owner</span>
                         )}
                     </div>
                 ))}
             </div>
        </div>
      </div>
    </div>
  );
};