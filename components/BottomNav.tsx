import React from 'react';
import { View } from '../types';

interface BottomNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const getIconClass = (view: View) => {
    return currentView === view 
      ? "text-primary bg-primary-light/30" 
      : "text-text-tertiary hover:text-text-secondary hover:bg-gray-50";
  };

  const isFilled = (view: View) => currentView === view ? "filled" : "";

  return (
    <nav className="fixed bottom-0 w-full z-50 px-6 py-6 pointer-events-none max-w-md mx-auto left-0 right-0">
      <div className="pointer-events-auto h-[72px] rounded-full bg-surface/95 backdrop-blur-xl shadow-floating flex items-center justify-between px-2 border border-white/50">
        
        <button 
          onClick={() => onNavigate(View.DASHBOARD)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.DASHBOARD)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.DASHBOARD)}`}>dashboard</span>
        </button>

        <button 
          onClick={() => onNavigate(View.TASKS)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.TASKS)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.TASKS)}`}>calendar_today</span>
        </button>

        <button 
          onClick={() => onNavigate(View.OBJECTIVES_OVERVIEW)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.OBJECTIVES_OVERVIEW)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.OBJECTIVES_OVERVIEW)}`}>track_changes</span>
        </button>

        <button 
          onClick={() => onNavigate(View.GROWTH)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.GROWTH)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.GROWTH)}`}>spa</span>
        </button>

        <button 
          onClick={() => onNavigate(View.RELATIONSHIPS)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.RELATIONSHIPS)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.RELATIONSHIPS)}`}>person</span>
        </button>

      </div>
    </nav>
  );
};