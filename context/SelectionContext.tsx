import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { EntityType } from '../types';

interface SelectionContextType {
  // Selection state per entity type
  selectedIds: Map<EntityType, Set<string>>;
  isSelectMode: Map<EntityType, boolean>;
  
  // Actions
  enterSelectMode: (entityType: EntityType) => void;
  exitSelectMode: (entityType: EntityType) => void;
  toggleSelection: (entityType: EntityType, id: string) => void;
  clearSelection: (entityType: EntityType) => void;
  selectAll: (entityType: EntityType, allIds: string[]) => void;
  isSelected: (entityType: EntityType, id: string) => boolean;
  getSelectedCount: (entityType: EntityType) => number;
  getSelectedIds: (entityType: EntityType) => string[];
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<Map<EntityType, Set<string>>>(new Map());
  const [isSelectMode, setIsSelectMode] = useState<Map<EntityType, boolean>>(new Map());

  const enterSelectMode = useCallback((entityType: EntityType) => {
    setIsSelectMode(prev => {
      const next = new Map(prev);
      next.set(entityType, true);
      return next;
    });
  }, []);

  const exitSelectMode = useCallback((entityType: EntityType) => {
    setIsSelectMode(prev => {
      const next = new Map(prev);
      next.set(entityType, false);
      return next;
    });
    // Clear selection when exiting select mode
    setSelectedIds(prev => {
      const next = new Map(prev);
      next.set(entityType, new Set());
      return next;
    });
  }, []);

  const toggleSelection = useCallback((entityType: EntityType, id: string) => {
    setSelectedIds(prev => {
      const next = new Map(prev);
      const currentSet = next.get(entityType) || new Set<string>();
      const newSet = new Set(currentSet);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      next.set(entityType, newSet);
      return next;
    });
  }, []);

  const clearSelection = useCallback((entityType: EntityType) => {
    setSelectedIds(prev => {
      const next = new Map(prev);
      next.set(entityType, new Set());
      return next;
    });
  }, []);

  const selectAll = useCallback((entityType: EntityType, allIds: string[]) => {
    setSelectedIds(prev => {
      const next = new Map(prev);
      next.set(entityType, new Set(allIds));
      return next;
    });
  }, []);

  const isSelected = useCallback((entityType: EntityType, id: string): boolean => {
    const selectedSet = selectedIds.get(entityType);
    return selectedSet ? selectedSet.has(id) : false;
  }, [selectedIds]);

  const getSelectedCount = useCallback((entityType: EntityType): number => {
    const selectedSet = selectedIds.get(entityType);
    return selectedSet ? selectedSet.size : 0;
  }, [selectedIds]);

  const getSelectedIds = useCallback((entityType: EntityType): string[] => {
    const selectedSet = selectedIds.get(entityType);
    return selectedSet ? Array.from(selectedSet) : [];
  }, [selectedIds]);

  return (
    <SelectionContext.Provider
      value={{
        selectedIds,
        isSelectMode,
        enterSelectMode,
        exitSelectMode,
        toggleSelection,
        clearSelection,
        selectAll,
        isSelected,
        getSelectedCount,
        getSelectedIds,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = (): SelectionContextType => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};

