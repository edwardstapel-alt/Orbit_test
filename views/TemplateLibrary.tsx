import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { TaskTemplate, HabitTemplate, ObjectiveTemplate, View } from '../types';
import { getTaskTemplates } from '../utils/taskTemplates';
import { getAllTemplates } from '../utils/habitTemplates';
import { getObjectiveTemplates, getObjectiveTemplatesByCategory } from '../utils/objectiveTemplates';
import { createTaskFromTemplate as createTaskFromTemplateUtil } from '../utils/taskTemplates';
import { createHabitFromTemplate } from '../utils/habitTemplates';
import { createObjectiveFromTemplate as createObjectiveFromTemplateUtil } from '../utils/objectiveTemplates';

interface TemplateLibraryProps {
  onBack: () => void;
  onEdit?: (type: 'task' | 'habit' | 'objective', id?: string) => void;
  onNavigate?: (view: View) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onBack, onEdit, onNavigate }) => {
  const data = useData();
  const [activeTab, setActiveTab] = useState<'tasks' | 'habits' | 'objectives'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');

  const taskTemplates = getTaskTemplates(data.taskTemplates);
  const habitTemplates = getAllTemplates();
  const objectiveTemplates = getObjectiveTemplates(data.objectiveTemplates);

  const filteredTaskTemplates = taskTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredHabitTemplates = habitTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredObjectiveTemplates = objectiveTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleUseTaskTemplate = (template: TaskTemplate) => {
    const task = createTaskFromTemplateUtil(template);
    data.addTask(task);
    if (onEdit) {
      onEdit('task', task.id);
    }
  };

  const handleUseHabitTemplate = (template: HabitTemplate) => {
    const habit = createHabitFromTemplate(template);
    data.addHabit(habit);
    if (onEdit) {
      onEdit('habit', habit.id);
    }
  };

  const handleUseObjectiveTemplate = (template: ObjectiveTemplate) => {
    const objective = createObjectiveFromTemplateUtil(template);
    data.addObjective(objective);
    if (onEdit) {
      onEdit('objective', objective.id);
    } else if (onNavigate) {
      onNavigate(View.OBJECTIVE_DETAIL, objective.id);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen pb-24 overflow-y-auto">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Template Library</h1>
      </header>

      <div className="px-6 pt-4">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">search</span>
            <input
              type="text"
              placeholder="Zoek templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-text-main"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'bg-primary text-white'
                : 'bg-white text-text-main hover:bg-gray-50'
            }`}
          >
            Tasks ({filteredTaskTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'habits'
                ? 'bg-primary text-white'
                : 'bg-white text-text-main hover:bg-gray-50'
            }`}
          >
            Habits ({filteredHabitTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('objectives')}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'objectives'
                ? 'bg-primary text-white'
                : 'bg-white text-text-main hover:bg-gray-50'
            }`}
          >
            Goals ({filteredObjectiveTemplates.length})
          </button>
        </div>

        {/* Task Templates */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {filteredTaskTemplates.length === 0 ? (
              <div className="text-center py-12 text-text-tertiary">
                <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                <p>Geen task templates gevonden</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTaskTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {template.icon && (
                        <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-text-secondary">{template.icon}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-text-main mb-1">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-text-tertiary">{template.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded text-text-secondary">{template.category}</span>
                        {template.usageCount > 0 && (
                          <span className="text-xs text-text-tertiary">{template.usageCount}x gebruikt</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleUseTaskTemplate(template)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-soft transition-colors"
                      >
                        Gebruik
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Habit Templates */}
        {activeTab === 'habits' && (
          <div className="space-y-4">
            {filteredHabitTemplates.length === 0 ? (
              <div className="text-center py-12 text-text-tertiary">
                <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                <p>Geen habit templates gevonden</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHabitTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: template.color ? `${template.color}20` : '#f3f4f6' }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ color: template.color || '#6b7280' }}
                        >
                          {template.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-text-main mb-1">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-text-tertiary">{template.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded text-text-secondary">{template.category}</span>
                        {template.usageCount > 0 && (
                          <span className="text-xs text-text-tertiary">{template.usageCount}x gebruikt</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleUseHabitTemplate(template)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-soft transition-colors"
                      >
                        Gebruik
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Objective Templates */}
        {activeTab === 'objectives' && (
          <div className="space-y-6">
            {filteredObjectiveTemplates.length === 0 ? (
              <div className="text-center py-12 text-text-tertiary">
                <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                <p>Geen goal templates gevonden</p>
              </div>
            ) : (
              // Group by Life Area Category
              ['Work & Career', 'Sport & Health', 'Money & Finance', 'Personal Development', 'Fun & Relaxation', 'Education & Learning', 'Family & Friends', 'Love & Relationships', 'Spirituality'].map(category => {
                const categoryTemplates = getObjectiveTemplatesByCategory(category, data.objectiveTemplates).filter(t => 
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                );
                if (categoryTemplates.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-3">
                    <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryTemplates.map(template => (
                        <div
                          key={template.id}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-text-secondary">{template.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-text-main mb-1">{template.name}</h3>
                              {template.description && (
                                <p className="text-sm text-text-tertiary">{template.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded text-text-secondary">{template.category}</span>
                              {template.usageCount > 0 && (
                                <span className="text-xs text-text-tertiary">{template.usageCount}x gebruikt</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleUseObjectiveTemplate(template)}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-soft transition-colors"
                            >
                              Gebruik
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

