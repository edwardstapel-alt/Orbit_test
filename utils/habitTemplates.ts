// Habit Templates Service
// Pre-made and custom habit templates

import { HabitTemplate, Habit } from '../types';

/**
 * Default habit templates
 */
export const defaultHabitTemplates: HabitTemplate[] = [
  // Health & Fitness
  {
    id: 'template-morning-exercise',
    name: 'Morning Exercise',
    description: 'Start je dag met beweging',
    icon: 'fitness_center',
    category: 'Health',
    color: '#10B981',
    habitData: {
      name: 'Morning Exercise',
      icon: 'fitness_center',
      targetFrequency: 5,
      reminderTime: '07:00',
      category: 'Health',
      color: '#10B981',
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['health', 'fitness', 'morning', 'exercise'],
  },
  {
    id: 'template-meditation',
    name: 'Meditation',
    description: 'Dagelijkse meditatie voor mentale rust',
    icon: 'self_improvement',
    category: 'Health',
    color: '#8B5CF6',
    habitData: {
      name: 'Meditation',
      icon: 'self_improvement',
      targetFrequency: 7,
      reminderTime: '08:00',
      category: 'Health',
      color: '#8B5CF6',
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['health', 'mental', 'meditation', 'mindfulness'],
  },
  {
    id: 'template-water-intake',
    name: 'Water Intake',
    description: 'Drink voldoende water gedurende de dag',
    icon: 'water_drop',
    category: 'Health',
    color: '#3B82F6',
    habitData: {
      name: 'Water Intake',
      icon: 'water_drop',
      targetFrequency: 7,
      category: 'Health',
      color: '#3B82F6',
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['health', 'hydration', 'water'],
  },
  {
    id: 'template-reading',
    name: 'Daily Reading',
    description: 'Lees elke dag minimaal 20 minuten',
    icon: 'menu_book',
    category: 'Learning',
    color: '#F59E0B',
    habitData: {
      name: 'Daily Reading',
      icon: 'menu_book',
      targetFrequency: 7,
      reminderTime: '20:00',
      category: 'Learning',
      color: '#F59E0B',
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['learning', 'reading', 'education', 'books'],
  },
  {
    id: 'template-journaling',
    name: 'Journaling',
    description: 'Schrijf elke dag in je dagboek',
    icon: 'edit_note',
    category: 'Personal',
    color: '#EC4899',
    habitData: {
      name: 'Journaling',
      icon: 'edit_note',
      targetFrequency: 7,
      reminderTime: '21:00',
      category: 'Personal',
      color: '#EC4899',
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['personal', 'journaling', 'reflection', 'writing'],
  },
  {
    id: 'template-no-phone-morning',
    name: 'No Phone Morning',
    description: 'Gebruik je telefoon niet in de eerste 2 uur na wakker worden',
    icon: 'phone_disabled',
    category: 'Productivity',
    color: '#6366F1',
    habitData: {
      name: 'No Phone Morning',
      icon: 'phone_disabled',
      targetFrequency: 7,
      category: 'Productivity',
      color: '#6366F1',
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['productivity', 'phone', 'morning', 'focus'],
  },
  {
    id: 'template-gratitude',
    name: 'Gratitude Practice',
    description: 'Schrijf elke dag 3 dingen op waar je dankbaar voor bent',
    icon: 'favorite',
    category: 'Personal',
    color: '#F97316',
    habitData: {
      name: 'Gratitude Practice',
      icon: 'favorite',
      targetFrequency: 7,
      reminderTime: '19:00',
      category: 'Personal',
      color: '#F97316',
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['personal', 'gratitude', 'mindfulness', 'wellbeing'],
  },
  {
    id: 'template-stretching',
    name: 'Stretching',
    description: 'Dagelijkse stretching routine',
    icon: 'accessibility_new',
    category: 'Health',
    color: '#14B8A6',
    habitData: {
      name: 'Stretching',
      icon: 'accessibility_new',
      targetFrequency: 7,
      reminderTime: '18:00',
      category: 'Health',
      color: '#14B8A6',
    },
    usageCount: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['health', 'fitness', 'flexibility', 'stretching'],
  },
];

/**
 * Get all templates (default + user templates)
 */
export function getAllTemplates(): HabitTemplate[] {
  const userTemplates = getUserTemplates();
  return [...defaultHabitTemplates, ...userTemplates];
}

/**
 * Get user-created templates from localStorage
 */
export function getUserTemplates(): HabitTemplate[] {
  const saved = localStorage.getItem('orbit_habit_templates');
  if (!saved) return [];
  
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load user templates:', e);
    return [];
  }
}

/**
 * Save user template
 */
export function saveUserTemplate(template: HabitTemplate): void {
  const userTemplates = getUserTemplates();
  const existingIndex = userTemplates.findIndex(t => t.id === template.id);
  
  if (existingIndex >= 0) {
    userTemplates[existingIndex] = {
      ...template,
      updatedAt: new Date().toISOString(),
    };
  } else {
    userTemplates.push({
      ...template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  localStorage.setItem('orbit_habit_templates', JSON.stringify(userTemplates));
}

/**
 * Delete user template
 */
export function deleteUserTemplate(templateId: string): void {
  const userTemplates = getUserTemplates().filter(t => t.id !== templateId);
  localStorage.setItem('orbit_habit_templates', JSON.stringify(userTemplates));
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): HabitTemplate[] {
  return getAllTemplates().filter(t => t.category === category);
}

/**
 * Search templates
 */
export function searchTemplates(query: string): HabitTemplate[] {
  const lowerQuery = query.toLowerCase();
  return getAllTemplates().filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description?.toLowerCase().includes(lowerQuery) ||
    template.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get popular templates (by usage count)
 */
export function getPopularTemplates(limit: number = 10): HabitTemplate[] {
  return getAllTemplates()
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * Create habit from template
 */
export function createHabitFromTemplate(
  template: HabitTemplate,
  customizations?: Partial<Habit>
): Habit {
  const habitId = `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const habit: Habit = {
    id: habitId,
    name: template.habitData.name || template.name,
    icon: template.habitData.icon || template.icon,
    streak: 0,
    completed: false,
    weeklyProgress: [false, false, false, false, false, false, false],
    ...template.habitData,
    ...customizations,
    templateId: template.id,
    createdAt: new Date().toISOString(),
  };

  // Update template usage
  if (template.isDefault) {
    // Update default template usage (stored separately)
    const defaultUsage = getDefaultTemplateUsage();
    defaultUsage[template.id] = (defaultUsage[template.id] || 0) + 1;
    localStorage.setItem('orbit_default_template_usage', JSON.stringify(defaultUsage));
  } else {
    // Update user template
    const updatedTemplate = {
      ...template,
      usageCount: template.usageCount + 1,
      lastUsed: new Date().toISOString(),
    };
    saveUserTemplate(updatedTemplate);
  }

  return habit;
}

/**
 * Get default template usage stats
 */
function getDefaultTemplateUsage(): { [templateId: string]: number } {
  const saved = localStorage.getItem('orbit_default_template_usage');
  if (!saved) return {};
  
  try {
    return JSON.parse(saved);
  } catch (e) {
    return {};
  }
}

/**
 * Update default template usage counts
 */
export function updateDefaultTemplateUsage(): void {
  const usage = getDefaultTemplateUsage();
  defaultHabitTemplates.forEach(template => {
    template.usageCount = usage[template.id] || 0;
  });
}

// Initialize usage counts on load
updateDefaultTemplateUsage();

