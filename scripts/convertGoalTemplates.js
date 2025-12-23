// Script to convert goal_plans_templates.json to ObjectiveTemplate format
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon mapping based on category and keywords
const iconMap = {
  'work_and_career': 'work',
  'sport_and_health': 'fitness_center',
  'money_and_finance': 'account_balance',
  'personal_development': 'trending_up',
  'fun_and_relaxation': 'celebration',
  'education_and_learning': 'school',
  'family_and_friends': 'people',
  'love_and_relationships': 'favorite',
  'spirituality': 'self_improvement',
};

// Category name mapping
const categoryNameMap = {
  'work_and_career': 'Work & Career',
  'sport_and_health': 'Sport & Health',
  'money_and_finance': 'Money & Finance',
  'personal_development': 'Personal Development',
  'fun_and_relaxation': 'Fun & Relaxation',
  'education_and_learning': 'Education & Learning',
  'family_and_friends': 'Family & Friends',
  'love_and_relationships': 'Love & Relationships',
  'spirituality': 'Spirituality',
};

// Timeline color mapping
const colorMap = {
  'work_and_career': '#3B82F6',
  'sport_and_health': '#10B981',
  'money_and_finance': '#F59E0B',
  'personal_development': '#8B5CF6',
  'fun_and_relaxation': '#EC4899',
  'education_and_learning': '#6366F1',
  'family_and_friends': '#F97316',
  'love_and_relationships': '#EF4444',
  'spirituality': '#8B5CF6',
};

// Read the JSON file
const jsonPath = path.join(__dirname, '..', 'goal_plans_templates.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const templates = [];

jsonData.templateCategories.forEach(category => {
  const categoryId = category.id;
  const categoryName = categoryNameMap[categoryId] || category.name.nl || category.name.en;
  const icon = iconMap[categoryId] || 'flag';
  const color = colorMap[categoryId] || '#8B5CF6';
  
  category.templates.forEach(template => {
    // Use Dutch translations if available, otherwise fall back to English
    const name = template.name.nl || template.name.en;
    const description = template.description?.nl || template.description?.en || '';
    
    const templateObj = {
      id: template.id,
      name: name,
      description: description,
      icon: icon,
      category: categoryName,
      objectiveData: {
        title: name,
        description: description,
        status: 'On Track',
        category: categoryId === 'work_and_career' ? 'professional' : 'personal',
        progress: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        timelineColor: color,
      },
      usageCount: 0,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: template.tags || [],
    };
    
    templates.push(templateObj);
  });
});

// Generate TypeScript code
const tsCode = `// Objective Templates Service
// Pre-made and custom objective templates organized by Life Area
// Generated from goal_plans_templates.json

import { ObjectiveTemplate, Objective } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default objective templates organized by Life Area
 * Based on goal_plans_templates.json
 */
export const defaultObjectiveTemplates: ObjectiveTemplate[] = ${JSON.stringify(templates, null, 2)};

/**
 * Get all objective templates (default + custom)
 */
export const getObjectiveTemplates = (customTemplates: ObjectiveTemplate[] = []): ObjectiveTemplate[] => {
  return [...defaultObjectiveTemplates, ...customTemplates];
};

/**
 * Get templates filtered by category (Life Area)
 */
export const getObjectiveTemplatesByCategory = (
  category: string,
  customTemplates: ObjectiveTemplate[] = []
): ObjectiveTemplate[] => {
  const allTemplates = getObjectiveTemplates(customTemplates);
  return allTemplates.filter(t => t.category === category);
};

/**
 * Create an objective from a template
 */
export const createObjectiveFromTemplate = (
  template: ObjectiveTemplate,
  lifeAreaId?: string
): Objective => {
  const objective: Objective = {
    id: uuidv4(),
    title: template.objectiveData.title || template.name,
    description: template.objectiveData.description || template.description,
    status: template.objectiveData.status || 'On Track',
    category: template.objectiveData.category || 'personal',
    progress: 0,
    owner: template.objectiveData.owner || '',
    ownerImage: template.objectiveData.ownerImage,
    lifeAreaId: lifeAreaId || template.objectiveData.lifeAreaId || '',
    visionId: template.objectiveData.visionId,
    startDate: template.objectiveData.startDate || new Date().toISOString().split('T')[0],
    endDate: template.objectiveData.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    timelineColor: template.objectiveData.timelineColor || '#8B5CF6',
  };
  
  return objective;
};

/**
 * Add a custom objective template
 */
export const addCustomObjectiveTemplate = (
  template: Omit<ObjectiveTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>,
  existingTemplates: ObjectiveTemplate[] = []
): ObjectiveTemplate => {
  const newTemplate: ObjectiveTemplate = {
    ...template,
    id: uuidv4(),
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return newTemplate;
};

/**
 * Update an objective template
 */
export const updateObjectiveTemplate = (
  template: ObjectiveTemplate,
  existingTemplates: ObjectiveTemplate[]
): ObjectiveTemplate[] => {
  return existingTemplates.map(t => 
    t.id === template.id 
      ? { ...template, updatedAt: new Date().toISOString() }
      : t
  );
};

/**
 * Delete an objective template
 */
export const deleteObjectiveTemplate = (
  templateId: string,
  existingTemplates: ObjectiveTemplate[]
): ObjectiveTemplate[] => {
  return existingTemplates.filter(t => t.id !== templateId);
};

/**
 * Update template usage count
 */
export const updateTemplateUsage = (
  templateId: string,
  existingTemplates: ObjectiveTemplate[]
): ObjectiveTemplate[] => {
  return existingTemplates.map(t => 
    t.id === templateId 
      ? { 
          ...t, 
          usageCount: (t.usageCount || 0) + 1,
          lastUsed: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      : t
  );
};
`;

// Write to file
const outputPath = path.join(__dirname, '..', 'utils', 'objectiveTemplates.ts');
fs.writeFileSync(outputPath, tsCode, 'utf8');

console.log(`✅ Generated ${templates.length} objective templates`);
console.log(`📝 Written to ${outputPath}`);

