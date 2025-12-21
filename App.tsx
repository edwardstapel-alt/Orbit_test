import React, { useState } from 'react';
import { View, Friend, EntityType } from './types';
import { DataProvider } from './context/DataContext';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './views/Dashboard';
import { Growth } from './views/Growth';
import { Relationships } from './views/Relationships';
import { FriendDetail } from './views/FriendDetail';
import { MapDiscovery } from './views/MapDiscovery';
import { Tasks } from './views/Tasks';
import { Notifications } from './views/Notifications';
import { Editor } from './views/Editor';
import { ObjectiveDetail } from './views/ObjectiveDetail';
import { KeyResultUpdate } from './views/KeyResultUpdate';
import { ObjectivesOverview } from './views/ObjectivesOverview';
import { GeneralSettings } from './views/GeneralSettings';
import { PersonalSettings } from './views/PersonalSettings';
import { SyncedAccounts } from './views/SyncedAccounts';
import { TeamSettings } from './views/TeamSettings';
import { DataManagement } from './views/DataManagement';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  
  // Editor State
  const [editorType, setEditorType] = useState<EntityType | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  // Detail View States
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | undefined>(undefined);
  const [updatingKRId, setUpdatingKRId] = useState<string | undefined>(undefined);

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const openEditor = (type: EntityType, id?: string, parent?: string) => {
      setEditorType(type);
      setEditingId(id);
      setParentId(parent);
  };

  const closeEditor = () => {
      setEditorType(null);
      setEditingId(undefined);
      setParentId(undefined);
  };

  const handleViewObjective = (id: string) => {
    setSelectedObjectiveId(id);
    setCurrentView(View.OBJECTIVE_DETAIL);
  };

  const handleUpdateKeyResult = (id: string) => {
    setUpdatingKRId(id);
  };

  const closeUpdateKR = () => {
    setUpdatingKRId(undefined);
  }

  // Navigation Handlers
  const openMenu = () => setCurrentView(View.SETTINGS);
  const openProfile = () => setCurrentView(View.PROFILE);

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard 
                onNavigate={setCurrentView} 
                onEdit={openEditor} 
                onViewObjective={handleViewObjective}
                onUpdateKeyResult={handleUpdateKeyResult}
                onMenuClick={openMenu}
                onProfileClick={openProfile}
               />;
      case View.GROWTH:
        return <Growth onNavigate={setCurrentView} onMenuClick={openMenu} onProfileClick={openProfile} />;
      case View.RELATIONSHIPS:
        return <Relationships 
                  onFriendSelect={handleFriendSelect} 
                  onNavigate={setCurrentView} 
                  onEdit={openEditor} 
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
               />;
      case View.FRIEND_DETAIL:
        return <FriendDetail friend={selectedFriend} onBack={() => setCurrentView(View.RELATIONSHIPS)} />;
      case View.MAP:
        return <MapDiscovery onEdit={openEditor} />;
      case View.TASKS:
        return <Tasks onEdit={openEditor} onNavigate={setCurrentView} onMenuClick={openMenu} onProfileClick={openProfile} />;
      case View.SETTINGS:
        return <GeneralSettings onBack={() => setCurrentView(View.DASHBOARD)} onNavigate={setCurrentView} />;
      case View.PROFILE:
        return <PersonalSettings onBack={() => setCurrentView(View.SETTINGS)} />;
      case View.SYNCED_ACCOUNTS:
        return <SyncedAccounts onBack={() => setCurrentView(View.SETTINGS)} />;
      case View.TEAM_SETTINGS:
        return <TeamSettings onBack={() => setCurrentView(View.SETTINGS)} />;
      case View.DATA_MANAGEMENT:
        return <DataManagement onBack={() => setCurrentView(View.SETTINGS)} />;
      case View.NOTIFICATIONS:
        return <Notifications onBack={() => setCurrentView(View.DASHBOARD)} />;
      case View.OBJECTIVES_OVERVIEW:
        return <ObjectivesOverview 
                  onViewObjective={handleViewObjective} 
                  onEdit={openEditor} 
                  onUpdateKeyResult={handleUpdateKeyResult} 
                  onNavigate={setCurrentView}
                  onMenuClick={openMenu}
                  onProfileClick={openProfile}
               />;
      case View.OBJECTIVE_DETAIL:
        return selectedObjectiveId ? (
            <ObjectiveDetail 
                objectiveId={selectedObjectiveId} 
                onBack={() => setCurrentView(View.OBJECTIVES_OVERVIEW)}
                onEdit={() => openEditor('objective', selectedObjectiveId)}
                onUpdateKR={handleUpdateKeyResult}
                onAddKR={() => openEditor('keyResult', undefined, selectedObjectiveId)}
            />
        ) : <Dashboard 
              onNavigate={setCurrentView} 
              onEdit={openEditor} 
              onViewObjective={handleViewObjective} 
              onUpdateKeyResult={handleUpdateKeyResult}
              onMenuClick={openMenu}
              onProfileClick={openProfile}
            />;
      default:
        return <Dashboard 
                onNavigate={setCurrentView} 
                onEdit={openEditor} 
                onViewObjective={handleViewObjective} 
                onUpdateKeyResult={handleUpdateKeyResult}
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
    currentView !== View.NOTIFICATIONS &&
    currentView !== View.OBJECTIVE_DETAIL &&
    currentView !== View.MAP; 

  return (
    <DataProvider>
        <div className="flex justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md h-screen bg-background relative shadow-2xl overflow-hidden flex flex-col">
            {renderView()}
            {showBottomNav && <BottomNav currentView={currentView} onNavigate={setCurrentView} />}
            
            {/* Modal Layer */}
            {editorType && (
                <Editor type={editorType} editId={editingId} parentId={parentId} onClose={closeEditor} />
            )}

            {updatingKRId && (
                <KeyResultUpdate 
                    keyResultId={updatingKRId} 
                    onClose={closeUpdateKR} 
                    onEditFull={() => {
                        closeUpdateKR();
                        openEditor('keyResult', updatingKRId);
                    }}
                />
            )}
        </div>
        </div>
    </DataProvider>
  );
}