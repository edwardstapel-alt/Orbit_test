// Quick Actions Service
// Shortcuts voor veelgebruikte acties

import { QuickAction, View } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default quick actions
 */
export const defaultQuickActions: QuickAction[] = [
  {
    id: 'qa-add-task',
    name: 'Nieuwe Taak',
    icon: 'add_task',
    type: 'navigation',
    targetView: View.EDITOR,
    order: 1,
    isPinned: true,
    usageCount: 0,
  },
  {
    id: 'qa-add-habit',
    name: 'Nieuwe Habit',
    icon: 'add_circle',
    type: 'navigation',
    targetView: View.EDITOR,
    order: 2,
    isPinned: true,
    usageCount: 0,
  },
  {
    id: 'qa-today',
    name: 'Vandaag',
    icon: 'today',
    type: 'navigation',
    targetView: View.TODAY,
    order: 3,
    isPinned: false,
    usageCount: 0,
  },
  {
    id: 'qa-statistics',
    name: 'Statistieken',
    icon: 'bar_chart',
    type: 'navigation',
    targetView: View.STATISTICS,
    order: 4,
    isPinned: false,
    usageCount: 0,
  },
];

/**
 * Get all quick actions (default + custom)
 */
export const getQuickActions = (customActions: QuickAction[] = []): QuickAction[] => {
  return [...defaultQuickActions, ...customActions].sort((a, b) => a.order - b.order);
};

/**
 * Get pinned quick actions
 */
export const getPinnedQuickActions = (customActions: QuickAction[] = []): QuickAction[] => {
  return getQuickActions(customActions).filter(a => a.isPinned);
};

/**
 * Get quick action by ID
 */
export const getQuickActionById = (id: string, customActions: QuickAction[] = []): QuickAction | undefined => {
  const allActions = getQuickActions(customActions);
  return allActions.find(a => a.id === id);
};

/**
 * Add custom quick action
 */
export const addCustomQuickAction = (
  action: Omit<QuickAction, 'id' | 'usageCount' | 'lastUsed'>
): QuickAction => {
  const newAction: QuickAction = {
    ...action,
    id: uuidv4(),
    usageCount: 0,
  };
  return newAction;
};

/**
 * Update quick action
 */
export const updateQuickAction = (updatedAction: QuickAction): QuickAction => {
  return updatedAction;
};

/**
 * Delete quick action (only custom actions can be deleted)
 */
export const deleteQuickAction = (id: string, customActions: QuickAction[]): QuickAction[] => {
  return customActions.filter(a => a.id !== id);
};

/**
 * Update action usage count
 */
export const updateActionUsage = (actionId: string, actions: QuickAction[]): QuickAction[] => {
  return actions.map(a => {
    if (a.id === actionId) {
      return {
        ...a,
        usageCount: (a.usageCount || 0) + 1,
        lastUsed: new Date().toISOString(),
      };
    }
    return a;
  });
};

