import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { View, HabitTemplate } from '../types';
import { TopNav } from '../components/TopNav';
import {
  getAllTemplates,
  getTemplatesByCategory,
  searchTemplates,
  getPopularTemplates,
  createHabitFromTemplate,
  saveUserTemplate,
  deleteUserTemplate,
} from '../utils/habitTemplates';

interface HabitTemplatesProps {
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onEdit?: (type: 'habit', id?: string) => void;
}

export const HabitTemplates: React.FC<HabitTemplatesProps> = ({
  onNavigate,
  onMenuClick,
  onProfileClick,
  onEdit,
  onBack,
}) => {
  const { addHabit } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'alphabetical'>('popular');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const allTemplates = getAllTemplates();
  
  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(allTemplates.map(t => t.category));
    return Array.from(cats).sort();
  }, [allTemplates]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = searchQuery
      ? searchTemplates(searchQuery)
      : selectedCategory === 'all'
      ? allTemplates
      : getTemplatesByCategory(selectedCategory);

    // Sort
    if (sortBy === 'popular') {
      filtered = [...filtered].sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortBy === 'recent') {
      filtered = [...filtered].sort((a, b) => {
        const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        return bTime - aTime;
      });
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [allTemplates, searchQuery, selectedCategory, sortBy]);

  const handleUseTemplate = (template: HabitTemplate) => {
    const habit = createHabitFromTemplate(template);
    addHabit(habit);
    
    if (onEdit) {
      onEdit('habit', habit.id);
    } else {
      // Navigate back or show success message
      alert(`Habit "${habit.name}" is aangemaakt!`);
    }
  };

  const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Weet je zeker dat je deze template wilt verwijderen?')) {
      deleteUserTemplate(templateId);
      // Force re-render by updating state
      setSearchQuery('');
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-32">
      <TopNav
        title="Habit Templates"
        subtitle={`${filteredTemplates.length} templates beschikbaar`}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onBack={onBack}
        showBack={!!onBack}
      />

      {/* Filters */}
      <div className="px-6 md:px-12 lg:px-16 py-4 bg-white border-b">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Zoek templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              search
            </span>
          </div>

          {/* Category & Sort */}
          <div className="flex gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Alle Categorieën</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="popular">Populair</option>
              <option value="recent">Recent</option>
              <option value="alphabetical">Alfabetisch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="px-6 md:px-12 lg:px-16 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleUseTemplate(template)}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="size-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: template.color ? `${template.color}20` : '#f3f4f6' }}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: template.color || '#6b7280' }}
                  >
                    {template.icon}
                  </span>
                </div>
                {!template.isDefault && (
                  <button
                    onClick={(e) => handleDeleteTemplate(template.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                )}
              </div>

              <h3 className="text-lg font-bold text-text-main mb-1">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-text-tertiary mb-4">{template.description}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-text-tertiary bg-gray-100 px-2 py-1 rounded">
                  {template.category}
                </span>
                {template.habitData.targetFrequency && (
                  <span className="text-xs text-text-tertiary">
                    {template.habitData.targetFrequency}x/week
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-text-tertiary">
                <span>{template.usageCount} keer gebruikt</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-text-tertiary">Geen templates gevonden.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

