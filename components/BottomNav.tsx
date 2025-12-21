import React from 'react';
import { View } from '../types';

interface BottomNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  // Map sub-views to their parent views for highlighting
  const getActiveView = (view: View): View => {
    // If we're in a sub-view, highlight the parent
    if (view === View.GOAL_TIMELINE || view === View.OBJECTIVE_DETAIL) {
      return View.OBJECTIVES_OVERVIEW;
    }
    if (view === View.LIFE_AREA_DETAIL) {
      return View.LIFE_AREAS;
    }
    if (view === View.TASKS) {
      return View.TODAY; // Tasks view maps to Today for navigation
    }
    return view;
  };

  const activeView = getActiveView(currentView);

  const getIconClass = (view: View) => {
    return activeView === view 
      ? "text-primary bg-primary-light/30" 
      : "text-text-tertiary hover:text-text-secondary hover:bg-gray-50";
  };

  const isFilled = (view: View) => activeView === view ? "filled" : "";

  return (
    <nav className="fixed bottom-0 w-full z-[70] px-6 py-6 pointer-events-none max-w-md mx-auto left-0 right-0">
      <div className="pointer-events-auto h-[72px] rounded-full bg-surface/95 backdrop-blur-xl shadow-floating flex items-center justify-between px-2 border border-white/50">
        
        <button 
          onClick={() => onNavigate(View.DASHBOARD)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.DASHBOARD)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.DASHBOARD)}`}>dashboard</span>
        </button>

        <button 
          onClick={() => onNavigate(View.LIFE_AREAS)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.LIFE_AREAS)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.LIFE_AREAS)}`}>category</span>
        </button>

        <button 
          onClick={() => onNavigate(View.TODAY)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.TODAY)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.TODAY)}`}>today</span>
        </button>

        <button 
          onClick={() => onNavigate(View.OBJECTIVES_OVERVIEW)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.OBJECTIVES_OVERVIEW)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.OBJECTIVES_OVERVIEW)}`}>track_changes</span>
        </button>

        <button 
          onClick={() => onNavigate(View.STATISTICS)}
          className={`flex flex-col items-center justify-center size-14 rounded-full transition-colors ${getIconClass(View.STATISTICS)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${isFilled(View.STATISTICS)}`}>bar_chart</span>
        </button>

      </div>
    </nav>
  );
};