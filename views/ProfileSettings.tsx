import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { View } from '../types';

interface ProfileSettingsProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onBack, onNavigate }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const { clearAllData, restoreExampleData, teamMembers, addTeamMember, deleteTeamMember } = useData();

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleNav = (item: string) => {
    // Navigation placeholder - implement actual navigation if needed
  };

  const handleUnlink = async () => {
      if(window.confirm("This will clear all current data from the dashboard. Are you sure?")) {
          await clearAllData();
          onBack(); // Navigate back to dashboard to see empty state
      }
  }

  const handleRestore = () => {
    if(window.confirm("Restore example data?")) {
        restoreExampleData();
        onBack(); // Navigate back to dashboard to see data
    }
  }

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
    <div className="flex flex-col w-full h-full bg-background min-h-screen pb-32 lg:pb-8">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Settings</h1>
      </header>

      <div className="flex flex-col items-center py-8">
        <div className="relative mb-4 group">
            <div className="size-24 rounded-full bg-cover bg-center shadow-soft border-4 border-white transition-transform group-hover:scale-105" style={{backgroundImage: 'url("https://picsum.photos/id/64/200/200")'}}></div>
            <button onClick={() => alert("Edit Photo")} className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full border-2 border-white flex items-center justify-center shadow-sm hover:bg-primary-soft transition-colors">
                <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
        </div>
        <h2 className="text-xl font-bold text-text-main">Alex Morgan</h2>
        <p className="text-text-secondary text-sm">alex.morgan@example.com</p>
      </div>

      <div className="px-6 space-y-6">
        <section>
             <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Team & Collaborators</h3>
             <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-4">
                 <div className="space-y-3 mb-4">
                     {teamMembers.map(member => (
                         <div key={member.id} className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <img src={member.image} alt={member.name} className="size-8 rounded-full" />
                                 <span className="text-sm font-medium text-text-main">{member.name}</span>
                             </div>
                             {member.role !== 'You' && (
                                <button onClick={() => deleteTeamMember(member.id)} className="text-gray-300 hover:text-red-500">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                             )}
                         </div>
                     ))}
                 </div>
                 <form onSubmit={handleAddMember} className="flex gap-2">
                     <input 
                        type="text" 
                        placeholder="Add team member name..." 
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                     />
                     <button type="submit" className="bg-primary text-white rounded-lg px-3 py-2 text-sm font-bold">Add</button>
                 </form>
             </div>
        </section>

        <section>
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Account</h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => handleNav('Personal Information')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-text-secondary">person</span>
                        <span className="text-text-main font-medium">Personal Information</span>
                    </div>
                    <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
                </button>
                <button onClick={() => onNavigate(View.MAP)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-text-secondary">map</span>
                        <span className="text-text-main font-medium">Saved Places & Map</span>
                    </div>
                    <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
                </button>
                <button onClick={handleUnlink} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors border-b border-gray-100 group">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500">link_off</span>
                        <span className="text-red-500 font-medium">Unlink Example Data</span>
                    </div>
                    <span className="material-symbols-outlined text-red-300 group-hover:text-red-500">chevron_right</span>
                </button>
                 <button onClick={handleRestore} className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-500">restore</span>
                        <span className="text-blue-500 font-medium">Restore Examples</span>
                    </div>
                    <span className="material-symbols-outlined text-blue-300">chevron_right</span>
                </button>
            </div>
        </section>

        <section>
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Preferences</h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer" onClick={toggleDarkMode}>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-text-secondary">dark_mode</span>
                        <span className="text-text-main font-medium">Dark Mode</span>
                    </div>
                    <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" checked={darkMode} readOnly className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" style={{top: '2px', left: '2px', transform: darkMode ? 'translateX(100%)' : 'translateX(0)'}}/>
                        <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-200'}`}></label>
                    </div>
                </div>
            </div>
        </section>

        <button onClick={() => window.alert('Signed out')} className="w-full py-3.5 rounded-xl text-red-500 font-semibold bg-red-50 hover:bg-red-100 transition-colors border border-red-100 mb-6">
            Sign Out
        </button>
      </div>
    </div>
  );
};