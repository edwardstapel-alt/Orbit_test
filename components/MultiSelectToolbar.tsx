import React from 'react';
import { EntityType } from '../types';
import { useSelection } from '../context/SelectionContext';

interface MultiSelectToolbarProps {
  entityType: EntityType;
  onDelete: (ids: string[]) => void;
  onEdit?: (id: string) => void;
  onCancel: () => void;
  entityName?: string; // Singular name (e.g., "Task", "Habit")
  entityNamePlural?: string; // Plural name (e.g., "Tasks", "Habits")
}

export const MultiSelectToolbar: React.FC<MultiSelectToolbarProps> = ({
  entityType,
  onDelete,
  onEdit,
  onCancel,
  entityName = 'Item',
  entityNamePlural = 'Items'
}) => {
  const { getSelectedCount, getSelectedIds, exitSelectMode, clearSelection } = useSelection();
  const selectedCount = getSelectedCount(entityType);
  const selectedIds = getSelectedIds(entityType);

  if (selectedCount === 0) {
    return null;
  }

  const handleDelete = () => {
    if (window.confirm(`Delete ${selectedCount} ${selectedCount === 1 ? entityName.toLowerCase() : entityNamePlural.toLowerCase()}?`)) {
      onDelete(selectedIds);
      clearSelection(entityType);
      exitSelectMode(entityType);
    }
  };

  const handleEdit = () => {
    if (selectedIds.length === 1 && onEdit) {
      onEdit(selectedIds[0]);
      clearSelection(entityType);
      exitSelectMode(entityType);
    }
  };

  const handleCancel = () => {
    clearSelection(entityType);
    exitSelectMode(entityType);
    onCancel();
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[60] lg:bottom-8 lg:left-auto lg:right-8 lg:w-auto">
      <div className="mx-4 lg:mx-0 lg:rounded-2xl bg-white shadow-lg border-2 border-primary/20 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-text-main">
            {selectedCount} {selectedCount === 1 ? entityName : entityNamePlural} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedIds.length === 1 && onEdit && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-soft transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit
            </button>
          )}
          
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
            Delete
          </button>
          
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-100 text-text-main rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

