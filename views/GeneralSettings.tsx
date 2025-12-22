import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { View } from '../types';
import { getCurrentUser } from '../utils/firebaseAuth';

interface GeneralSettingsProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ onBack, onNavigate }) => {
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isFirebaseLoggedIn, setIsFirebaseLoggedIn] = useState(false);
  const { accentColor, setAccentColor, userProfile, darkMode, setDarkMode, showCategory, setShowCategory } = useData();
  
  // Check Firebase auth status
  useEffect(() => {
    const user = getCurrentUser();
    setIsFirebaseLoggedIn(!!user);
  }, []);
  
  // Uniform color palette used throughout the app
  const predefinedColors = [
      '#D95829', // Default Orange
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#8B5CF6', // Violet
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F59E0B', // Amber
      '#EF4444'  // Red
  ];
  
  const [showCustomColor, setShowCustomColor] = useState(false);
  
  // Check if current accent color is a predefined color
  const isPredefinedColor = predefinedColors.includes(accentColor);
  
  // Initialize showCustomColor based on whether accentColor is predefined
  useEffect(() => {
    setShowCustomColor(!isPredefinedColor);
  }, [isPredefinedColor]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen pb-24 overflow-y-auto">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Settings</h1>
      </header>


      <div className="px-6 space-y-4 pt-4">
        {/* Quick Settings */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Profile */}
          <button onClick={() => onNavigate(View.PROFILE)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">person</span>
              <span className="text-text-main font-medium">Profile</span>
            </div>
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>

          {/* Theme & Appearance */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setShowThemePicker(!showThemePicker)}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-text-secondary">palette</span>
                <span className="text-text-main font-medium">Theme & Appearance</span>
              </div>
              <span className={`material-symbols-outlined text-text-tertiary transition-transform ${showThemePicker ? 'rotate-90' : ''}`}>chevron_right</span>
            </div>
            
            {showThemePicker && (
              <div className="px-4 pb-4 border-t border-gray-100 animate-fade-in space-y-4">
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm font-medium text-text-secondary">Dark Mode</span>
                  <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" style={{top: '2px', left: '2px', transform: darkMode ? 'translateX(100%)' : 'translateX(0)'}}/>
                    <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-200'}`} onClick={toggleDarkMode}></label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-text-secondary">Accent Colour</span>
                  <div className="grid grid-cols-4 gap-2">
                    {predefinedColors.map(c => (
                      <button 
                        key={c} 
                        onClick={() => {
                          setAccentColor(c);
                          setShowCustomColor(false);
                        }}
                        className={`size-9 rounded-lg border-2 transition-all flex items-center justify-center ${
                          accentColor === c && !showCustomColor
                            ? 'border-gray-900 scale-110 shadow-md' 
                            : 'border-gray-200 hover:scale-105'
                        }`}
                        style={{backgroundColor: c}}
                      >
                        {accentColor === c && !showCustomColor && (
                          <span className="material-symbols-outlined text-white text-sm">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {showCustomColor && (
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="color" 
                        className="size-10 rounded-lg cursor-pointer border-2 border-gray-200" 
                        value={accentColor} 
                        onChange={(e) => {
                          setAccentColor(e.target.value);
                          setShowCustomColor(true);
                        }}
                      />
                      <input
                        type="text"
                        className="flex-1 p-2 bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-primary text-xs font-mono"
                        value={accentColor.toUpperCase()}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9A-F]/gi, '').slice(0, 6);
                          if (value.length === 6) {
                            setAccentColor('#' + value);
                            setShowCustomColor(true);
                          }
                        }}
                        placeholder="#D95829"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Split */}
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">category</span>
              <span className="text-text-main font-medium">Category Split</span>
            </div>
            <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                checked={showCategory} 
                onChange={() => setShowCategory(!showCategory)} 
                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" 
                style={{top: '2px', left: '2px', transform: showCategory ? 'translateX(100%)' : 'translateX(0)'}}
              />
              <label 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${showCategory ? 'bg-primary' : 'bg-gray-200'}`} 
                onClick={() => setShowCategory(!showCategory)}
              />
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => onNavigate(View.FIREBASE_AUTH)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">cloud_sync</span>
              <div className="flex flex-col">
                <span className="text-text-main font-medium">Cloud Sync</span>
                {isFirebaseLoggedIn ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    Syncing
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Not connected</span>
                )}
              </div>
            </div>
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>
          <button onClick={() => onNavigate(View.SYNCED_ACCOUNTS)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">sync_alt</span>
              <span className="text-text-main font-medium">Synced Accounts</span>
            </div>
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>
          {/* Day Parts Configuration */}
          <button onClick={() => onNavigate(View.DAY_PARTS_SETTINGS)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">schedule</span>
              <span className="text-text-main font-medium">Dagdelen Configuratie</span>
            </div>
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>

          <button onClick={() => onNavigate(View.NOTIFICATIONS)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">notifications</span>
              <span className="text-text-main font-medium">Notifications</span>
            </div>
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>
          <button onClick={() => onNavigate(View.NOTIFICATION_SETTINGS)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">settings</span>
              <span className="text-text-main font-medium">Notification Settings</span>
            </div>
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>
          <button onClick={() => onNavigate(View.DATA_MANAGEMENT)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">database</span>
              <span className="text-text-main font-medium">Data Management</span>
            </div>
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>
          <button onClick={() => onNavigate(View.TEAM_SETTINGS)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">group</span>
              <span className="text-text-main font-medium">Team Settings</span>
            </div>
            <span className="material-symbols-outlined text-text-tertiary">chevron_right</span>
          </button>
        </div>

        <button onClick={() => window.alert('Signed out')} className="w-full py-3.5 rounded-xl text-red-500 font-semibold bg-red-50 hover:bg-red-100 transition-colors border border-red-100 mb-6 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">logout</span>
            Sign Out
        </button>
      </div>
    </div>
  );
};