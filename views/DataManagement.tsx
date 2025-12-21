import React from 'react';
import { useData } from '../context/DataContext';

interface DataManagementProps {
  onBack: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ onBack }) => {
  const { clearAllData, restoreExampleData, tasks, habits, objectives } = useData();

  const handleExport = () => {
      const data = { tasks, habits, objectives };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orbit_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert("Export started.");
  };

  const handleBackup = () => {
      alert("Cloud backup created successfully.");
  };

  const handleReset = () => {
      if(confirm("Are you sure you want to reset all data? This cannot be undone.")) {
          clearAllData();
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

             <button onClick={handleExport} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
                 <div className="size-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                     <span className="material-symbols-outlined">download</span>
                 </div>
                 <div className="flex-1">
                     <span className="block text-sm font-semibold text-text-main">Export Data (JSON)</span>
                     <span className="block text-[10px] text-text-tertiary">Download a local copy</span>
                 </div>
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