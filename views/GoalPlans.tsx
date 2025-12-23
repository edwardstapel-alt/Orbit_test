import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { View, ObjectiveTemplate } from '../types';
import { getObjectiveTemplates, getObjectiveTemplatesByCategory } from '../utils/objectiveTemplates';
import { GoalPlanPreview } from './GoalPlanPreview';

interface GoalPlansProps {
  onBack: () => void;
  onEdit?: (type: 'objective', id?: string, parentId?: string, context?: { fromTemplate?: boolean }) => void;
  onNavigate?: (view: View, objectiveId?: string) => void;
}

export const GoalPlans: React.FC<GoalPlansProps> = ({ onBack, onEdit, onNavigate }) => {
  const data = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Work & Career', 'Sport & Health', 'Money & Finance', 'Personal Development']));
  const [selectedTemplate, setSelectedTemplate] = useState<ObjectiveTemplate | null>(null);
  
  const allTemplates = getObjectiveTemplates(data.objectiveTemplates);
  
  const categories = [
    'Work & Career',
    'Sport & Health',
    'Money & Finance',
    'Personal Development',
    'Fun & Relaxation',
    'Education & Learning',
    'Family & Friends',
    'Love & Relationships',
    'Spirituality'
  ];

  const filteredTemplates = allTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleSelectTemplate = (template: ObjectiveTemplate) => {
    setSelectedTemplate(template);
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      'Work & Career': '#3B82F6',
      'Sport & Health': '#10B981',
      'Money & Finance': '#F59E0B',
      'Personal Development': '#8B5CF6',
      'Fun & Relaxation': '#EC4899',
      'Education & Learning': '#6366F1',
      'Family & Friends': '#F97316',
      'Love & Relationships': '#EF4444',
      'Spirituality': '#8B5CF6',
    };
    return colorMap[category] || '#8B5CF6';
  };

  // If template is selected, show preview
  if (selectedTemplate) {
    return (
      <GoalPlanPreview
        template={selectedTemplate}
        onBack={() => setSelectedTemplate(null)}
        onEdit={onEdit}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title="Goal Plans" 
        onBack={onBack}
        showBack={true}
      />

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">search</span>
            <input
              type="text"
              placeholder="What do you want to achieve?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-text-main"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {categories.map(category => {
            const categoryTemplates = getObjectiveTemplatesByCategory(category, data.objectiveTemplates).filter(t => 
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            
            if (categoryTemplates.length === 0 && searchQuery) return null;
            
            const isExpanded = expandedCategories.has(category);
            const categoryColor = getCategoryColor(category);

            return (
              <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-lg font-bold text-text-main">{category}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-tertiary">{categoryTemplates.length} goals</span>
                    <span 
                      className={`material-symbols-outlined text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Category Content */}
                {isExpanded && (
                  <div className="px-6 pb-4 space-y-3">
                    {categoryTemplates.length === 0 ? (
                      <p className="text-sm text-text-tertiary py-4 text-center">No templates found</p>
                    ) : (
                      categoryTemplates.map((template, index) => (
                        <button
                          key={`${category}-${template.id}-${index}`}
                          onClick={() => handleSelectTemplate(template)}
                          className="w-full p-4 rounded-xl bg-gray-50 border-2 border-transparent hover:border-primary/30 hover:bg-white transition-all text-left group"
                        >
                          <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div 
                              className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${categoryColor}15` }}
                            >
                              <span 
                                className="material-symbols-outlined text-xl"
                                style={{ color: categoryColor }}
                              >
                                {template.icon}
                              </span>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-text-main mb-1 group-hover:text-primary transition-colors">
                                {template.name}
                              </h3>
                              {template.description && (
                                <p className="text-sm text-text-tertiary line-clamp-2">
                                  {template.description}
                                </p>
                              )}
                            </div>
                            
                            {/* Arrow */}
                            <span className="material-symbols-outlined text-text-tertiary group-hover:text-primary transition-colors">
                              chevron_right
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">search_off</span>
            <p className="text-sm text-text-tertiary">No templates found</p>
            <p className="text-xs text-text-tertiary mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
};

