import React, { useState } from 'react';
import { View, Friend, EntityType } from './types';
import { DataProvider } from './context/DataContext';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
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
import { Statistics } from './views/Statistics';
import { FirebaseAuth } from './views/FirebaseAuth';
import { ConflictManagement } from './views/ConflictManagement';
import { HabitDetail } from './views/HabitDetail';
import { HabitAnalytics } from './views/HabitAnalytics';
import { HabitTemplates } from './views/HabitTemplates';
import { Habits } from './views/Habits';
import { TasksOverview } from './views/TasksOverview';
import { TemplateLibrary } from './views/TemplateLibrary';
import { GoalPlans } from './views/GoalPlans';
import { WeeklyReview } from './views/WeeklyReview';
import { MonthlyReview } from './views/MonthlyReview';
import { Retrospective } from './views/Retrospective';
import { ReviewsOverview } from './views/ReviewsOverview';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  
  // Navigation History Stack
  const [viewHistory, setViewHistory] = useState<View[]>([View.DASHBOARD]);
  
  // Editor State
  const [editorType, setEditorType] = useState<EntityType | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  // Detail View States
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | undefined>(undefined);
  const [selectedLifeAreaId, setSelectedLifeAreaId] = useState<string | undefined>(undefined);
  const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>(undefined);

  // Main navigation views (bottom nav items)
  const mainNavViews = [
    View.DASHBOARD,
    View.LIFE_AREAS,
    View.TODAY,
    View.OBJECTIVES_OVERVIEW,
    View.STATISTICS
  ];

  // Navigation helper functions
  const navigateTo = (view: View, addToHistory: boolean = true) => {
    // If navigating to a main nav view, replace history instead of adding
    // This provides better UX: clicking bottom nav resets navigation stack
    if (mainNavViews.includes(view)) {
      // Replace history with just the current view (if it's not already a main nav)
      if (!mainNavViews.includes(currentView)) {
        setViewHistory([currentView]);
      } else {
        // Already on a main nav, just switch without history
        setViewHistory([]);
      }
      setCurrentView(view);
    } else if (addToHistory && currentView !== view) {
      // For detail views, add to history normally
      setViewHistory(prev => [...prev, currentView]);
      setCurrentView(view);
    } else {
      setCurrentView(view);
    }
  };

  const navigateBack = () => {
    if (viewHistory.length > 0) {
      const previousView = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setCurrentView(previousView);
    } else {
      // Fallback to default view if no history
      setCurrentView(View.DASHBOARD);
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
      // Don't add to history - this is a direct navigation
    }
  };
  
  const navigateBackToProfile = () => {
    // For profile sub-pages, always go back to profile
    if (viewHistory.length > 0 && viewHistory[viewHistory.length - 1] === View.PROFILE) {
      navigateBack();
    } else {
      setCurrentView(View.PROFILE);
    }
  };

  const getPreviousView = (): View => {
    if (viewHistory.length > 0) {
      return viewHistory[viewHistory.length - 1];
    }
    return View.DASHBOARD; // Default fallback
  };

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const [editorContext, setEditorContext] = useState<{ objectiveId?: string; lifeAreaId?: string; fromTemplate?: boolean } | null>(null);

  const openEditor = (type: EntityType, id?: string, parent?: string, context?: { objectiveId?: string; lifeAreaId?: string; fromTemplate?: boolean }) => {
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

  const handleViewLifeArea = (id: string) => {
    setSelectedLifeAreaId(id);
    navigateTo(View.LIFE_AREA_DETAIL);
  };

  const handleViewHabit = (id: string) => {
    setSelectedHabitId(id);
    navigateTo(View.HABIT_DETAIL);
  };

  const handleUpdateKeyResult = (id: string) => {
    openEditor('keyResult', id);
  };

  // Navigation Handlers
  const openMenu = () => {
    // If already in settings, go back
    if (currentView === View.SETTINGS) {
      navigateBack();
    } else {
      navigateTo(View.SETTINGS);
    }
  };
  
  const openProfile = () => {
    // Direct navigation to profile - always navigate, don't add to history if coming from settings
    if (currentView === View.PROFILE) {
      // Already in profile, go back
      navigateBack();
    } else if (currentView === View.SETTINGS) {
      // Coming from settings, navigate without adding to history
      setCurrentView(View.PROFILE);
    } else {
      navigateTo(View.PROFILE);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard 
                onNavigate={(view, habitId?, lifeAreaId?) => {
                  if (view === View.HABIT_DETAIL && habitId) {
                    setSelectedHabitId(habitId);
                    navigateTo(View.HABIT_DETAIL);
                  } else if (view === View.LIFE_AREA_DETAIL && lifeAreaId) {
                    handleViewLifeArea(lifeAreaId);
                  } else {
                    navigateTo(view);
                  }
                }} 
                onEdit={openEditor} 
                onViewObjective={handleViewObjective}
                onViewLifeArea={handleViewLifeArea}
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
      case View.STATISTICS:
        return <Statistics 
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
               />;
      case View.FRIEND_DETAIL:
        return <FriendDetail friend={selectedFriend} onBack={navigateBack} />;
      case View.MAP:
        return <MapDiscovery onEdit={openEditor} />;
      case View.TASKS:
        return <Tasks onEdit={openEditor} onNavigate={navigateTo} onMenuClick={openMenu} onProfileClick={openProfile} />;
      case View.TASKS_OVERVIEW:
        return <TasksOverview onEdit={openEditor} onNavigate={navigateTo} onMenuClick={openMenu} onProfileClick={openProfile} onBack={navigateBack} />;
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
        return <PersonalSettings onBack={navigateBack} />;
      case View.SYNCED_ACCOUNTS:
        return <SyncedAccounts onBack={navigateBackToSettings} onNavigate={navigateTo} />;
      case View.TEAM_SETTINGS:
        return <TeamSettings onBack={navigateBackToSettings} />;
      case View.DATA_MANAGEMENT:
        return <DataManagement onBack={navigateBackToSettings} />;
      case View.FIREBASE_AUTH:
        return <FirebaseAuth onBack={navigateBackToSettings} onAuthenticated={() => navigateBackToSettings()} />;
      case View.CONFLICT_MANAGEMENT:
        return <ConflictManagement onNavigate={navigateTo} onMenuClick={openMenu} onProfileClick={openProfile} />;
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
                  onNavigate={(view, lifeAreaId?) => {
                    if (lifeAreaId) {
                      handleViewLifeArea(lifeAreaId);
                    } else {
                      navigateTo(view);
                    }
                  }}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onSearchClick={() => setShowSearch(true)}
                  onEdit={openEditor}
               />;
      case View.LIFE_AREA_DETAIL:
        if (!selectedLifeAreaId) {
          // Fallback to dashboard if no life area selected
          return <Dashboard 
            onNavigate={navigateTo} 
            onEdit={openEditor} 
            onViewObjective={handleViewObjective}
            onMenuClick={openMenu}
            onProfileClick={openProfile}
          />;
        }
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
        if (!selectedObjectiveId) {
          // Fallback to dashboard if no objective selected
          return <Dashboard 
            onNavigate={navigateTo} 
            onEdit={openEditor} 
            onViewObjective={handleViewObjective}
            onMenuClick={openMenu}
            onProfileClick={openProfile}
          />;
        }
        return (
            <ObjectiveDetail 
                objectiveId={selectedObjectiveId} 
                onBack={navigateBack}
                onEdit={(type, id, parentId, context) => {
                  if (type === 'keyResult') {
                    openEditor(type, id, parentId || selectedObjectiveId);
                  } else if (type === 'habit') {
                    openEditor('habit', id, undefined, context);
                  } else if (type === 'lifeArea') {
                    openEditor('lifeArea', id);
                  } else {
                    openEditor('objective', selectedObjectiveId);
                  }
                }}
                onAddKR={() => openEditor('keyResult', undefined, selectedObjectiveId)}
                onNavigate={(view, objectiveId?) => {
                  if (objectiveId) {
                    setSelectedObjectiveId(objectiveId);
                    navigateTo(View.OBJECTIVE_DETAIL);
                  } else {
                    navigateTo(view);
                  }
                }}
            />
        );
      case View.GOAL_TIMELINE:
        return <GoalTimeline 
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onViewObjective={handleViewObjective}
               />;
      case View.HABIT_DETAIL:
        return <HabitDetail 
                  habitId={selectedHabitId || ''}
                  onBack={navigateBack}
                  onEdit={() => openEditor('habit', selectedHabitId)}
                  onNavigate={navigateTo}
               />;
      case View.HABIT_ANALYTICS:
        return <HabitAnalytics 
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onBack={navigateBack}
               />;
      case View.HABIT_TEMPLATES:
        return <HabitTemplates 
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onEdit={openEditor}
                  onBack={navigateBack}
               />;
      case View.GOAL_PLANS:
        return <GoalPlans 
                  onEdit={openEditor}
                  onNavigate={navigateTo}
                  onBack={navigateBack}
               />;
      case View.HABITS:
        return <Habits 
                  onNavigate={(view, habitId?) => {
                    if (view === View.HABIT_DETAIL && habitId) {
                      setSelectedHabitId(habitId);
                      navigateTo(View.HABIT_DETAIL);
                    } else {
                      navigateTo(view);
                    }
                  }}
                  onEdit={openEditor}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
                  onBack={navigateBack}
               />;
      case View.WEEKLY_REVIEW:
        return <WeeklyReview 
                  onBack={navigateBack}
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
               />;
      case View.MONTHLY_REVIEW:
        return <MonthlyReview 
                  onBack={navigateBack}
                  onNavigate={navigateTo}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
               />;
      case View.RETROSPECTIVE:
        // Get objectiveId from localStorage if not in selectedObjectiveId
        const retrospectiveObjectiveId = selectedObjectiveId || (() => {
          const stored = localStorage.getItem('orbit_retrospective_objectiveId');
          if (stored) {
            const id = stored;
            localStorage.removeItem('orbit_retrospective_objectiveId');
            return id;
          }
          return undefined;
        })();
        return <Retrospective 
                  objectiveId={retrospectiveObjectiveId}
                  onBack={navigateBack}
                  onNavigate={(view, objectiveId?) => {
                    if (objectiveId) {
                      setSelectedObjectiveId(objectiveId);
                      navigateTo(View.OBJECTIVE_DETAIL);
                    } else {
                      navigateTo(view);
                    }
                  }}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
               />;
      case View.REVIEWS_OVERVIEW:
        return <ReviewsOverview 
                  onBack={navigateBack}
                  onNavigate={(view, objectiveId?) => {
                    if (objectiveId) {
                      setSelectedObjectiveId(objectiveId);
                      navigateTo(View.OBJECTIVE_DETAIL);
                    } else {
                      navigateTo(view);
                    }
                  }}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
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
    currentView !== View.CONFLICT_MANAGEMENT &&
    currentView !== View.OBJECTIVE_DETAIL &&
    currentView !== View.HABIT_DETAIL &&
    currentView !== View.MAP &&
    currentView !== View.EDITOR &&
    currentView !== View.RELATIONSHIPS &&
    currentView !== View.FIREBASE_AUTH &&
    currentView !== View.WEEKLY_REVIEW &&
    currentView !== View.MONTHLY_REVIEW &&
    currentView !== View.RETROSPECTIVE &&
    currentView !== View.REVIEWS_OVERVIEW; 

  return (
    <DataProvider>
        <div className="block lg:flex min-h-screen bg-background">
          {/* Sidebar - Desktop only */}
          <Sidebar 
            currentView={currentView} 
            onNavigate={navigateTo}
            onMenuClick={openMenu}
            onProfileClick={openProfile}
          />
          
          {/* Main Content */}
          <div className="w-full lg:flex-1 flex flex-col">
            <div className="flex min-h-screen bg-background md:bg-gray-100">
              <div className="w-full h-screen bg-background relative overflow-hidden flex flex-col">
                  <div 
                    key={currentView} 
                    className="flex-1 overflow-y-auto"
                    style={{
                      animation: 'fadeIn 0.25s ease-in-out'
                    }}
                  >
                    {renderView()}
                  </div>
                  {/* Bottom Nav - Mobile only */}
                  {showBottomNav && (
                    <div className="lg:hidden">
                      <BottomNav currentView={currentView} onNavigate={navigateTo} />
                    </div>
                  )}
            
            {/* Modal Layer */}
      {editorType && (
        <Editor 
          type={editorType} 
          editId={editingId} 
          parentId={parentId}
          contextObjectiveId={editorContext?.objectiveId}
          contextLifeAreaId={editorContext?.lifeAreaId}
          fromTemplate={editorContext?.fromTemplate}
          onClose={closeEditor}
          onNavigate={(view, objectiveId?, lifeAreaId?) => {
            if (objectiveId) {
              setSelectedObjectiveId(objectiveId);
              navigateTo(View.OBJECTIVE_DETAIL);
            } else if (lifeAreaId) {
              setSelectedLifeAreaId(lifeAreaId);
              navigateTo(View.LIFE_AREA_DETAIL);
            } else {
              navigateTo(view);
            }
          }}
          onEdit={openEditor}
        />
      )}
      
      {/* Unified Search */}
      {showSearch && (
        <UnifiedSearch
          onClose={() => setShowSearch(false)}
          onNavigate={(view, lifeAreaId?) => {
            if (lifeAreaId) {
              handleViewLifeArea(lifeAreaId);
            } else {
              navigateTo(view);
            }
          }}
          onEdit={openEditor}
          onViewObjective={handleViewObjective}
        />
      )}
              </div>
            </div>
          </div>
        </div>
    </DataProvider>
  );
}