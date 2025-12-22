import React from 'react';
import { QuickAction, View } from '../types';
import { getPinnedQuickActions } from '../utils/quickActions';

interface QuickActionsPanelProps {
  customActions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
  onNavigate?: (view: View) => void;
  onEdit?: (type: 'task' | 'habit') => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  customActions,
  onActionClick,
  onNavigate,
  onEdit
}) => {
  const pinnedActions = getPinnedQuickActions(customActions);

  const handleActionClick = (action: QuickAction) => {
    onActionClick(action);

    // Handle navigation actions
    if (action.type === 'navigation' && action.targetView && onNavigate) {
      onNavigate(action.targetView);
    }

    // Handle template actions
    if (action.type === 'template' && action.templateType && onEdit) {
      onEdit(action.templateType);
    }
  };

  if (pinnedActions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">bolt</span>
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {pinnedActions.map(action => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-2xl">{action.icon}</span>
            </div>
            <span className="text-xs font-medium text-text-main text-center">{action.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

