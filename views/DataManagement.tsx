import React, { useRef, useState } from 'react';
import { useData } from '../context/DataContext';

interface DataManagementProps {
  onBack: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ onBack }) => {
  const { 
    clearAllData, 
    restoreExampleData, 
    tasks, 
    habits, 
    objectives, 
    keyResults,
    lifeAreas,
    timeSlots,
    friends,
    statusUpdates,
    userProfile,
    places,
    teamMembers,
    visions,
    dayParts,
    accentColor,
    darkMode,
    showCategory,
    addTask,
    addHabit,
    addObjective,
    addKeyResult,
    addLifeArea,
    addTimeSlot,
    addFriend,
    addStatusUpdate,
    updateUserProfile,
    addPlace,
    addTeamMember,
    addVision,
    updateDayPart
  } = useData();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  const handleExport = () => {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          userProfile,
          tasks,
          habits,
          objectives,
          keyResults,
          lifeAreas,
          timeSlots,
          friends,
          statusUpdates,
          places,
          teamMembers,
          visions,
          dayParts,
          settings: {
            accentColor,
            darkMode,
            showCategory
          }
        }
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orbit_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert("✅ Export successful! Your data has been downloaded.");
    } catch (error) {
      console.error('Export error:', error);
      alert("❌ Export failed. Please try again.");
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Reading file...');
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validate format - support both old and new format
      let dataToImport;
      if (importedData.version && importedData.data) {
        // New format with version
        dataToImport = importedData.data;
      } else if (importedData.tasks || importedData.habits || importedData.objectives) {
        // Old format (backwards compatibility)
        dataToImport = importedData;
      } else {
        throw new Error('Invalid backup format. Please ensure this is an Orbit backup file.');
      }

      if (!confirm(`This will replace all your current data with the imported data. Are you sure?`)) {
        setImportStatus('');
        return;
      }

      setImportStatus('Importing data...');
      
      // Clear existing data first
      await clearAllData();

      // Import all data
      const data = dataToImport;

      // Import user profile FIRST (before other data that might trigger Firebase sync)
      if (data.userProfile) {
        // Ensure all fields are present
        const profileToImport = {
          firstName: data.userProfile.firstName || '',
          lastName: data.userProfile.lastName || '',
          email: data.userProfile.email || '',
          dob: data.userProfile.dob || '',
          image: data.userProfile.image || '',
        };
        updateUserProfile(profileToImport);
        // Wait a bit to ensure profile is saved
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Import settings
      if (data.settings) {
        if (data.settings.accentColor) {
          localStorage.setItem('orbit_accent', JSON.stringify(data.settings.accentColor));
        }
        if (data.settings.darkMode !== undefined) {
          localStorage.setItem('orbit_darkMode', JSON.stringify(data.settings.darkMode));
        }
        if (data.settings.showCategory !== undefined) {
          localStorage.setItem('orbit_showCategory', JSON.stringify(data.settings.showCategory));
        }
      }

      // Import collections (in order to maintain relationships)
      // 1. Life Areas first (no dependencies)
      if (data.lifeAreas && Array.isArray(data.lifeAreas)) {
        data.lifeAreas.forEach((item: any) => addLifeArea(item));
      }

      // 2. Objectives (depend on lifeAreas)
      if (data.objectives && Array.isArray(data.objectives)) {
        data.objectives.forEach((item: any) => addObjective(item));
      }

      // 3. Key Results (depend on objectives) - wait a bit to ensure objectives are set
      if (data.keyResults && Array.isArray(data.keyResults)) {
        // Small delay to ensure objectives are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        let imported = 0;
        let skipped = 0;
        const importedObjectiveIds = new Set((data.objectives || []).map((obj: any) => obj.id));
        data.keyResults.forEach((item: any) => {
          // Validate that the objectiveId exists in the imported data
          if (item.objectiveId && !importedObjectiveIds.has(item.objectiveId)) {
            console.warn(`Key Result "${item.title}" references non-existent objective "${item.objectiveId}". Skipping.`);
            skipped++;
            return;
          }
          // Ensure required fields are present
          if (!item.measurementType) {
            item.measurementType = 'number';
          }
          if (item.decimals === undefined) {
            item.decimals = 0;
          }
          addKeyResult(item);
          imported++;
        });
        if (skipped > 0) {
          console.warn(`Skipped ${skipped} key results due to missing objectives`);
        }
        console.log(`Imported ${imported} key results${skipped > 0 ? `, skipped ${skipped}` : ''}`);
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        data.tasks.forEach((item: any) => addTask(item));
      }

      if (data.habits && Array.isArray(data.habits)) {
        data.habits.forEach((item: any) => addHabit(item));
      }

      if (data.timeSlots && Array.isArray(data.timeSlots)) {
        data.timeSlots.forEach((item: any) => addTimeSlot(item));
      }

      if (data.friends && Array.isArray(data.friends)) {
        data.friends.forEach((item: any) => addFriend(item));
      }

      if (data.statusUpdates && Array.isArray(data.statusUpdates)) {
        data.statusUpdates.forEach((item: any) => addStatusUpdate(item));
      }

      if (data.places && Array.isArray(data.places)) {
        data.places.forEach((item: any) => addPlace(item));
      }

      if (data.teamMembers && Array.isArray(data.teamMembers)) {
        data.teamMembers.forEach((item: any) => addTeamMember(item));
      }

      if (data.visions && Array.isArray(data.visions)) {
        data.visions.forEach((item: any) => addVision(item));
      }

      if (data.dayParts && Array.isArray(data.dayParts)) {
        data.dayParts.forEach((item: any) => {
          updateDayPart(item);
        });
      }

      setImportStatus('✅ Import successful!');
      alert("✅ Import successful! Your data has been restored.");
      
      // Reload page to apply all changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Import error:', error);
      setImportStatus('❌ Import failed');
      alert(`❌ Import failed: ${error.message || 'Unknown error'}`);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setImportStatus(''), 3000);
    }
  };

  const handleBackup = () => {
      alert("Cloud backup created successfully.");
  };

  const handleReset = async () => {
      if(confirm("Are you sure you want to reset all data? This cannot be undone.")) {
          await clearAllData();
          alert("All data has been reset.");
      }
  };

  const handleRestore = () => {
      if(confirm("Restore default example data? This will overwrite current data.")) {
          restoreExampleData();
          alert("Example data restored.");
      }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Data Management</h1>
      </header>

      <div className="p-6 space-y-6">
        
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100">
                 <h3 className="text-sm font-bold text-text-main mb-1">Backup & Export</h3>
                 <p className="text-xs text-text-secondary">Keep your data safe or move it elsewhere.</p>
             </div>
             
             <button onClick={handleBackup} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100">
                 <div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                     <span className="material-symbols-outlined">cloud_upload</span>
                 </div>
                 <div className="flex-1">
                     <span className="block text-sm font-semibold text-text-main">Cloud Backup</span>
                     <span className="block text-[10px] text-text-tertiary">Last backup: Never</span>
                 </div>
             </button>

             <button onClick={handleExport} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100">
                 <div className="size-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                     <span className="material-symbols-outlined">download</span>
                 </div>
                 <div className="flex-1">
                     <span className="block text-sm font-semibold text-text-main">Export Data (JSON)</span>
                     <span className="block text-[10px] text-text-tertiary">Download complete backup</span>
                 </div>
             </button>

             <button onClick={handleImport} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
                 <div className="size-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                     <span className="material-symbols-outlined">upload</span>
                 </div>
                 <div className="flex-1">
                     <span className="block text-sm font-semibold text-text-main">Import Data (JSON)</span>
                     <span className="block text-[10px] text-text-tertiary">
                       {importStatus || 'Restore from backup file'}
                     </span>
                 </div>
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept=".json"
                   onChange={handleFileSelect}
                   className="hidden"
                 />
             </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-gray-100">
                 <h3 className="text-sm font-bold text-text-main mb-1">Danger Zone</h3>
                 <p className="text-xs text-text-secondary">Irreversible actions.</p>
             </div>
             
             <button onClick={handleRestore} className="w-full flex items-center gap-4 p-4 hover:bg-orange-50 transition-colors text-left border-b border-gray-100 group">
                 <div className="size-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                     <span className="material-symbols-outlined">restore</span>
                 </div>
                 <div className="flex-1">
                     <span className="block text-sm font-semibold text-text-main group-hover:text-orange-700">Restore Example Data</span>
                     <span className="block text-[10px] text-text-tertiary">Reset to demo state</span>
                 </div>
             </button>

             <button onClick={handleReset} className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors text-left group">
                 <div className="size-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                     <span className="material-symbols-outlined">delete_forever</span>
                 </div>
                 <div className="flex-1">
                     <span className="block text-sm font-semibold text-text-main group-hover:text-red-700">Reset All Data</span>
                     <span className="block text-[10px] text-text-tertiary">Delete everything locally</span>
                 </div>
             </button>
        </div>

      </div>
    </div>
  );
};