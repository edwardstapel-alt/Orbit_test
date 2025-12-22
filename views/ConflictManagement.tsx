import React, { useState, useEffect } from 'react';
import { Conflict, ConflictResolution } from '../types';
import { ConflictResolver } from '../components/ConflictResolver';
import { syncService } from '../utils/syncService';
import { TopNav } from '../components/TopNav';

interface ConflictManagementProps {
  onNavigate: (view: any) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const ConflictManagement: React.FC<ConflictManagementProps> = () => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const detectedConflicts = await syncService.detectConflicts();
      setConflicts(detectedConflicts);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conflictId: string, resolution: ConflictResolution) => {
    try {
      await syncService.resolveConflict(conflictId, resolution.strategy);
      await loadConflicts(); // Reload
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      alert('Fout bij oplossen van conflict: ' + (error as Error).message);
    }
  };

  const handleAutoResolve = async () => {
    setLoading(true);
    try {
      await syncService.autoResolveConflicts();
      await loadConflicts();
    } catch (error) {
      console.error('Failed to auto-resolve conflicts:', error);
      alert('Fout bij automatisch oplossen: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredConflicts = conflicts.filter(c => {
    if (filter !== 'all' && c.priority !== filter) return false;
    if (serviceFilter !== 'all' && c.service !== serviceFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-32">
      <TopNav 
        title="Conflict Beheer" 
        subtitle={`${conflicts.length} conflict${conflicts.length !== 1 ? 'en' : ''} gedetecteerd`}
        onMenuClick={() => {}}
        onProfileClick={() => {}} 
      />

      {/* Header Actions */}
      <div className="px-6 md:px-12 lg:px-16 py-4 bg-white border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3">
            <button
              onClick={handleAutoResolve}
              disabled={loading || conflicts.length === 0}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              Auto Oplossen
            </button>
            <button
              onClick={loadConflicts}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Laden...' : 'Vernieuwen'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Alle Prioriteiten</option>
            <option value="high">Hoog</option>
            <option value="medium">Medium</option>
            <option value="low">Laag</option>
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Alle Services</option>
            <option value="google_tasks">Google Tasks</option>
            <option value="google_calendar">Google Calendar</option>
            <option value="google_contacts">Google Contacts</option>
          </select>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="px-6 md:px-12 lg:px-16 py-6">
        {filteredConflicts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-tertiary">
              {conflicts.length === 0 
                ? 'Geen conflicten gedetecteerd' 
                : 'Geen conflicten met huidige filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConflicts.map(conflict => (
              <ConflictResolver
                key={conflict.id}
                conflict={conflict}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
