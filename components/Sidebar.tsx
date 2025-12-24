import React from 'react';
import { View } from '../types';
import { useData } from '../context/DataContext';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onMenuClick, onProfileClick }) => {
  const { userProfile } = useData();

  // Map sub-views to their parent views for highlighting
  const getActiveView = (view: View): View => {
    if (view === View.GOAL_TIMELINE || view === View.OBJECTIVE_DETAIL) {
      return View.OBJECTIVES_OVERVIEW;
    }
    if (view === View.LIFE_AREA_DETAIL) {
      return View.LIFE_AREAS;
    }
    if (view === View.TASKS) {
      return View.TODAY;
    }
    return view;
  };

  const activeView = getActiveView(currentView);

  const navItems = [
    { view: View.DASHBOARD, icon: 'dashboard', label: 'Dashboard' },
    { view: View.LIFE_AREAS, icon: 'category', label: 'Life Areas' },
    { view: View.TODAY, icon: 'today', label: 'Today' },
    { view: View.OBJECTIVES_OVERVIEW, icon: 'track_changes', label: 'Objectives' },
    { view: View.STATISTICS, icon: 'bar_chart', label: 'Statistics' },
    { view: View.CALENDAR, icon: 'calendar_month', label: 'Calendar' },
    { view: View.REVIEWS_OVERVIEW, icon: 'rate_review', label: 'Reviews' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0">
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">track_changes</span>
          </div>
          <h1 className="text-xl font-bold text-text-main">Orbit</h1>
        </div>
        
        {/* User Profile */}
        <button
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
        >
          <div
            className="size-10 rounded-full bg-center bg-no-repeat bg-cover ring-2 ring-white shadow-sm"
            style={{
              backgroundImage: userProfile.image ? `url("${userProfile.image}")` : 'none',
              backgroundColor: userProfile.image ? 'transparent' : '#E5E7EB'
            }}
          >
            {!userProfile.image && (
              <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                <span className="material-symbols-outlined text-2xl">account_circle</span>
              </div>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
              {userProfile.firstName} {userProfile.lastName}
            </p>
            <p className="text-xs text-text-tertiary">{userProfile.email}</p>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-text-main'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? 'filled' : ''}`}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings/More */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <button
          onClick={onMenuClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-text-main transition-all"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </aside>
  );
};

