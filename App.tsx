import React, { useState } from 'react';
import { View, Friend, EntityType } from './types';
import { DataProvider } from './context/DataContext';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './views/Dashboard';
import { Relationships } from './views/Relationships';
import { FriendDetail } from './views/FriendDetail';
import { MapDiscovery } from './views/MapDiscovery';
import { Tasks } from './views/Tasks';
import { Notifications } from './views/Notifications';
import { Editor } from './views/Editor';
import { ObjectiveDetail } from './views/ObjectiveDetail';
import { ObjectivesOverview } from './views/ObjectivesOverview';
import { GeneralSettings } from './views/GeneralSettings';
import { PersonalSettings } from './views/PersonalSettings';
import { SyncedAccounts } from './views/SyncedAccounts';
import { TeamSettings } from './views/TeamSettings';
import { DataManagement } from './views/DataManagement';
import { LifeAreas } from './views/LifeAreas';
import { LifeAreaDetail } from './views/LifeAreaDetail';
import { GoalTimeline } from './views/GoalTimeline';
import { Today } from './views/Today';
import { DayPartsSettings } from './views/DayPartsSettings';
import { Calendar } from './views/Calendar';
import { UnifiedSearch } from './components/UnifiedSearch';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.LIFE_AREAS);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  
  // Navigation History Stack
  const [viewHistory, setViewHistory] = useState<View[]>([View.LIFE_AREAS]);
  
  // Editor State
  const [editorType, setEditorType] = useState<EntityType | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  // Detail View States
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | undefined>(undefined);

  // Navigation helper functions
  const navigateTo = (view: View, addToHistory: boolean = true) => {
    if (addToHistory && currentView !== view) {
      setViewHistory(prev => [...prev, currentView]);
    }
    setCurrentView(view);
  };

  const navigateBack = () => {
    if (viewHistory.length > 0) {
      const previousView = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setCurrentView(previousView);
    } else {
      // Fallback to default view if no history
      setCurrentView(View.LIFE_AREAS);
    }
  };

  const navigateBackToSettings = () => {
    // For sub-settings pages, always go back to settings
    // Check if settings is in history, if so go back normally
    // Otherwise navigate to settings without adding to history
    if (viewHistory.length > 0 && viewHistory[viewHistory.length - 1] === View.SETTINGS) {
      navigateBack();
    } else {
      // Settings not in history, navigate there without adding current view
      setCurrentView(View.SETTINGS);
    }
  };

  const getPreviousView = (): View => {
    if (viewHistory.length > 0) {
      return viewHistory[viewHistory.length - 1];
    }
    return View.LIFE_AREAS; // Default fallback
  };

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const [editorContext, setEditorContext] = useState<{ objectiveId?: string; lifeAreaId?: string } | null>(null);

  const openEditor = (type: EntityType, id?: string, parent?: string, context?: { objectiveId?: string; lifeAreaId?: string }) => {
      setEditorType(type);
      setEditingId(id);
      setParentId(parent);
      setEditorContext(context || null);
  };

  const closeEditor = () => {
      setEditorType(null);
      setEditingId(undefined);
      setParentId(undefined);
      setEditorContext(null);
  };

  const handleViewObjective = (id: string) => {
    setSelectedObjectiveId(id);
    navigateTo(View.OBJECTIVE_DETAIL);
  };

  const handleUpdateKeyResult = (id: string) => {
    openEditor('keyResult', id);
  };

  // Navigation Handlers
  const openMenu = () => navigateTo(View.SETTINGS);
  const openProfile = () => {
    // Direct navigation to profile - more intuitive
    if (currentView === View.PROFILE) {
      // Already in profile, do nothing or go back
      navigateBack();
    } else {
      navigateTo(View.PROFILE);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard 
                onNavigate={navigateTo} 
                onEdit={openEditor} 
                onViewObjective={handleViewObjective}
                onMenuClick={openMenu}
                onProfileClick={openProfile}
               />;
      case View.RELATIONSHIPS:
        return <Relationships 
                  onFriendSelect={handleFriendSelect} 
                  onNavigate={navigateTo} 
                  onEdit={openEditor} 
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
               />;
      case View.FRIEND_DETAIL:
        return <FriendDetail friend={selectedFriend} onBack={navigateBack} />;
      case View.MAP:
        return <MapDiscovery onEdit={openEditor} />;
      case View.TASKS:
        return <Tasks onEdit={openEditor} onNavigate={navigateTo} onMenuClick={openMenu} onProfileClick={openProfile} />;
      case View.TODAY:
        return <Today 
                  onEdit={openEditor} 
                  onNavigate={navigateTo} 
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onViewObjective={handleViewObjective}
               />;
      case View.CALENDAR:
        return <Calendar 
                  onEdit={openEditor} 
                  onNavigate={navigateTo} 
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onViewObjective={handleViewObjective}
               />;
      case View.SETTINGS:
        return <GeneralSettings onBack={navigateBack} onNavigate={navigateTo} />;
      case View.PROFILE:
        return <PersonalSettings onBack={navigateBackToSettings} />;
      case View.SYNCED_ACCOUNTS:
        return <SyncedAccounts onBack={navigateBackToSettings} />;
      case View.TEAM_SETTINGS:
        return <TeamSettings onBack={navigateBackToSettings} />;
      case View.DATA_MANAGEMENT:
        return <DataManagement onBack={navigateBackToSettings} />;
      case View.DAY_PARTS_SETTINGS:
        return <DayPartsSettings onBack={navigateBackToSettings} onNavigate={navigateTo} />;
      case View.NOTIFICATIONS:
        return <Notifications onBack={navigateBack} />;
      case View.OBJECTIVES_OVERVIEW:
        return <ObjectivesOverview 
                  onViewObjective={handleViewObjective} 
                  onEdit={openEditor} 
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
               />;
      case View.LIFE_AREAS:
        return <LifeAreas 
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onSearchClick={() => setShowSearch(true)}
                  onEdit={openEditor}
               />;
      case View.LIFE_AREA_DETAIL:
        const selectedLifeAreaId = localStorage.getItem('orbit_selectedLifeArea') || '';
        return <LifeAreaDetail 
                  lifeAreaId={selectedLifeAreaId}
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onEdit={(type, id, parentId, context) => {
                    openEditor(type as EntityType, id, parentId, context);
                  }}
                  onViewObjective={handleViewObjective}
               />;
      case View.OBJECTIVE_DETAIL:
        const objectiveIdFromStorage = localStorage.getItem('orbit_selectedObjectiveId');
        const activeObjectiveId = selectedObjectiveId || objectiveIdFromStorage || undefined;
        if (activeObjectiveId && !selectedObjectiveId) {
          setSelectedObjectiveId(activeObjectiveId);
        }
        return activeObjectiveId ? (
            <ObjectiveDetail 
                objectiveId={activeObjectiveId} 
                onBack={navigateBack}
                onEdit={(type, id, parentId, context) => {
                  if (type === 'keyResult') {
                    openEditor(type, id, parentId || activeObjectiveId);
                  } else if (type === 'habit') {
                    openEditor('habit', id, undefined, context);
                  } else if (type === 'lifeArea') {
                    openEditor('lifeArea', id);
                  } else {
                    openEditor('objective', activeObjectiveId);
                  }
                }}
                onAddKR={() => openEditor('keyResult', undefined, activeObjectiveId)}
            />
        ) : <Dashboard 
              onNavigate={navigateTo} 
              onEdit={openEditor} 
              onViewObjective={handleViewObjective}
              onMenuClick={openMenu}
              onProfileClick={openProfile}
            />;
      case View.GOAL_TIMELINE:
        return <GoalTimeline 
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onViewObjective={handleViewObjective}
               />;
      default:
        return <Dashboard 
                onNavigate={navigateTo} 
                onEdit={openEditor} 
                onViewObjective={handleViewObjective}
                onMenuClick={openMenu}
                onProfileClick={openProfile}
               />;
    }
  };

  const showBottomNav = 
    currentView !== View.FRIEND_DETAIL && 
    currentView !== View.PROFILE && 
    currentView !== View.SETTINGS && 
    currentView !== View.SYNCED_ACCOUNTS && 
    currentView !== View.TEAM_SETTINGS && 
    currentView !== View.DATA_MANAGEMENT && 
    currentView !== View.DAY_PARTS_SETTINGS &&
    currentView !== View.NOTIFICATIONS &&
    currentView !== View.OBJECTIVE_DETAIL &&
    currentView !== View.MAP &&
    currentView !== View.EDITOR; 

  return (
    <DataProvider>
        <div className="flex justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md h-screen bg-background relative shadow-2xl overflow-hidden flex flex-col">
            {renderView()}
            {showBottomNav && <BottomNav currentView={currentView} onNavigate={navigateTo} />}
            
            {/* Modal Layer */}
      {editorType && (
        <Editor 
          type={editorType} 
          editId={editingId} 
          parentId={parentId}
          contextObjectiveId={editorContext?.objectiveId}
          contextLifeAreaId={editorContext?.lifeAreaId}
          onClose={closeEditor}
          onNavigate={navigateTo}
          onEdit={openEditor}
        />
      )}
      
      {/* Unified Search */}
      {showSearch && (
        <UnifiedSearch
          onClose={() => setShowSearch(false)}
          onNavigate={navigateTo}
          onEdit={openEditor}
          onViewObjective={handleViewObjective}
        />
      )}
        </div>
        </div>
    </DataProvider>
  );
}