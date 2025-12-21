import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { View } from '../types';

interface GeneralSettingsProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ onBack, onNavigate }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const { accentColor, setAccentColor, userProfile } = useData();

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const colors = [
      '#D95829', // Default Orange
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#8B5CF6', // Violet
      '#EC4899', // Pink
      '#14B8A6'  // Teal
  ];

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen pb-24">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Settings</h1>
      </header>

      <div className="flex flex-col items-center py-8">
        <div className="relative mb-4 group cursor-pointer" onClick={() => onNavigate(View.PROFILE)}>
            <div className="size-24 rounded-full bg-cover bg-center shadow-soft border-4 border-white transition-transform group-hover:scale-105" style={{backgroundImage: `url("${userProfile.image}")`}}></div>
            <div className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[16px]">edit</span>
            </div>
        </div>
        <h2 className="text-xl font-bold text-text-main">{userProfile.firstName} {userProfile.lastName}</h2>
        <span className="text-xs font-semibold text-text-tertiary bg-white px-2 py-0.5 rounded-full border border-gray-100 mt-1">Free Plan</span>
      </div>

      <div className="px-6 space-y-6">
        
        {/* ACCOUNT SECTION */}
        <section>
             <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3 pl-1">Account</h3>
             <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => onNavigate(View.PROFILE)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-text-secondary">badge</span>
                        <div className="flex flex-col items-start">
                            <span className="text-text-main font-medium leading-none">Personal Information</span>
                            <span className="text-[10px] text-text-tertiary mt-1">Profile image, name, DOB</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
                </button>
                <button onClick={() => onNavigate(View.SYNCED_ACCOUNTS)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-text-secondary">sync_alt</span>
                         <div className="flex flex-col items-start">
                            <span className="text-text-main font-medium leading-none">Synced Accounts</span>
                            <span className="text-[10px] text-text-tertiary mt-1">Google, Calendar, Maps</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
                </button>
                 <button onClick={() => onNavigate(View.TEAM_SETTINGS)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-text-secondary">group</span>
                         <div className="flex flex-col items-start">
                            <span className="text-text-main font-medium leading-none">Team Settings</span>
                            <span className="text-[10px] text-text-tertiary mt-1">Manage users & profiles</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
                </button>
             </div>
        </section>

        {/* APP SECTION */}
        <section>
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3 pl-1">App</h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => onNavigate(View.DATA_MANAGEMENT)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-text-secondary">database</span>
                        <div className="flex flex-col items-start">
                            <span className="text-text-main font-medium leading-none">Data Management</span>
                            <span className="text-[10px] text-text-tertiary mt-1">Backup, restore, reset, export</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
                </button>

                {/* Theme Toggle & Picker */}
                <div className="flex flex-col p-4 border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between" onClick={() => setShowThemePicker(!showThemePicker)}>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-text-secondary">palette</span>
                            <div className="flex flex-col items-start">
                                <span className="text-text-main font-medium leading-none">Theme & Appearance</span>
                                <span className="text-[10px] text-text-tertiary mt-1">Dark mode, accent colour</span>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-text-tertiary transition-transform ${showThemePicker ? 'rotate-90' : ''}`}>chevron_right</span>
                    </div>
                    
                    {showThemePicker && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-text-secondary">Dark Mode</span>
                                <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" style={{top: '2px', left: '2px', transform: darkMode ? 'translateX(100%)' : 'translateX(0)'}}/>
                                    <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-200'}`} onClick={toggleDarkMode}></label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-text-secondary">Accent Colour</span>
                                <div className="flex gap-3">
                                    {colors.map(c => (
                                        <button 
                                            key={c} 
                                            onClick={() => setAccentColor(c)}
                                            className={`size-8 rounded-full transition-transform hover:scale-110 ${accentColor === c ? 'ring-2 ring-offset-2 ring-gray-300 scale-110' : ''}`}
                                            style={{backgroundColor: c}}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>

        <button onClick={() => window.alert('Signed out')} className="w-full py-3.5 rounded-xl text-red-500 font-semibold bg-red-50 hover:bg-red-100 transition-colors border border-red-100 mb-6 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">logout</span>
            Sign Out
        </button>
      </div>
    </div>
  );
};