// Task Templates Service
// Pre-made and custom task templates

import { TaskTemplate, Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default task templates
 */
export const defaultTaskTemplates: TaskTemplate[] = [
  // Work templates
  {
    id: 'template-meeting-prep',
    name: 'Meeting Preparation',
    description: 'Voorbereiding voor een meeting',
    category: 'Work',
    icon: 'event',
    taskData: {
      title: 'Meeting voorbereiden',
      tag: 'Meeting',
      priority: false,
      scheduledDate: undefined,
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['work', 'meeting', 'preparation'],
  },
  {
    id: 'template-email-followup',
    name: 'Email Follow-up',
    description: 'Follow-up email sturen',
    category: 'Work',
    icon: 'mail',
    taskData: {
      title: 'Email follow-up',
      tag: 'Communication',
      priority: false,
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['work', 'email', 'communication'],
  },
  {
    id: 'template-weekly-review',
    name: 'Weekly Review',
    description: 'Wekelijkse review en planning',
    category: 'Work',
    icon: 'calendar_today',
    taskData: {
      title: 'Weekly Review',
      tag: 'Planning',
      priority: true,
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['work', 'review', 'planning'],
  },
  // Personal templates
  {
    id: 'template-grocery-shopping',
    name: 'Grocery Shopping',
    description: 'Boodschappen doen',
    category: 'Personal',
    icon: 'shopping_cart',
    taskData: {
      title: 'Boodschappen doen',
      tag: 'Personal',
      priority: false,
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['personal', 'shopping', 'errands'],
  },
  {
    id: 'template-exercise',
    name: 'Exercise',
    description: 'Training of beweging',
    category: 'Health',
    icon: 'fitness_center',
    taskData: {
      title: 'Training',
      tag: 'Health',
      priority: false,
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['health', 'fitness', 'exercise'],
  },
];

/**
 * Get all task templates (default + custom)
 */
export const getTaskTemplates = (customTemplates: TaskTemplate[] = []): TaskTemplate[] => {
  return [...defaultTaskTemplates, ...customTemplates];
};

/**
 * Get task template by ID
 */
export const getTaskTemplateById = (id: string, customTemplates: TaskTemplate[] = []): TaskTemplate | undefined => {
  const allTemplates = getTaskTemplates(customTemplates);
  return allTemplates.find(t => t.id === id);
};

/**
 * Create task from template
 */
export const createTaskFromTemplate = (template: TaskTemplate): Task => {
  const task: Task = {
    id: uuidv4(),
    title: template.taskData.title || template.name,
    tag: template.taskData.tag || template.category,
    time: template.taskData.time,
    completed: false,
    priority: template.taskData.priority || false,
    scheduledDate: template.taskData.scheduledDate,
    scheduledTime: template.taskData.scheduledTime,
    timeSlotId: template.taskData.timeSlotId,
    dayPart: template.taskData.dayPart,
    allDay: template.taskData.allDay,
    duration: template.taskData.duration,
    objectiveId: template.taskData.objectiveId,
    lifeAreaId: template.taskData.lifeAreaId,
    keyResultId: template.taskData.keyResultId,
    calendarEventId: template.taskData.calendarEventId,
    friendId: template.taskData.friendId,
    syncMetadata: template.taskData.syncMetadata,
    googleTaskId: template.taskData.googleTaskId,
    asanaTaskId: template.taskData.asanaTaskId,
    recurring: template.taskData.recurring,
  };

  return task;
};

/**
 * Add custom task template
 */
export const addCustomTaskTemplate = (
  template: Omit<TaskTemplate, 'id' | 'usageCount' | 'isDefault' | 'createdAt' | 'updatedAt'>
): TaskTemplate => {
  const newTemplate: TaskTemplate = {
    ...template,
    id: uuidv4(),
    usageCount: 0,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return newTemplate;
};

/**
 * Update task template
 */
export const updateTaskTemplate = (updatedTemplate: TaskTemplate): TaskTemplate => {
  return {
    ...updatedTemplate,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Delete task template (only custom templates can be deleted)
 */
export const deleteTaskTemplate = (id: string, customTemplates: TaskTemplate[]): TaskTemplate[] => {
  return customTemplates.filter(t => t.id !== id);
};

/**
 * Update template usage count
 */
export const updateTemplateUsage = (templateId: string, templates: TaskTemplate[]): TaskTemplate[] => {
  return templates.map(t => {
    if (t.id === templateId) {
      return {
        ...t,
        usageCount: (t.usageCount || 0) + 1,
        lastUsed: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return t;
  });
};

