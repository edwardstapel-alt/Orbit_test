import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ObjectiveTemplate, View, ActionPlanWeek } from '../types';
import { createObjectiveFromTemplate as createObjectiveFromTemplateUtil } from '../utils/objectiveTemplates';

interface GoalPlanPreviewProps {
  template: ObjectiveTemplate;
  onBack: () => void;
  onEdit?: (type: 'objective', id?: string, parentId?: string, context?: { fromTemplate?: boolean }) => void;
  onNavigate?: (view: View, objectiveId?: string) => void;
}

export const GoalPlanPreview: React.FC<GoalPlanPreviewProps> = ({ template, onBack, onEdit, onNavigate }) => {
  const data = useData();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2, 3]));
  const [expandedProgress, setExpandedProgress] = useState(true);

  // Calculate time left
  const timeLeft = useMemo(() => {
    if (!template.objectiveData.endDate) return null;
    const endDate = new Date(template.objectiveData.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays < 30) return `${diffDays} days left`;
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''} left`;
  }, [template.objectiveData.endDate]);

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekNumber)) {
        next.delete(weekNumber);
      } else {
        next.add(weekNumber);
      }
      return next;
    });
  };

  const handleSelectAndPersonalize = () => {
    // Get stored lifeAreaId if available
    const storedLifeAreaId = localStorage.getItem('orbit_newObjective_lifeAreaId');
    const lifeAreaId = storedLifeAreaId || '';
    if (storedLifeAreaId) localStorage.removeItem('orbit_newObjective_lifeAreaId');
    
    // Store template ID in localStorage so Editor can load it
    localStorage.setItem('orbit_selectedTemplateId', template.id);
    if (lifeAreaId) {
      localStorage.setItem('orbit_newObjective_lifeAreaId', lifeAreaId);
    }
    
    // Open Editor in create mode with fromTemplate flag
    // Do NOT add objective to data yet - let Editor handle it after user edits
    if (onEdit) {
      onEdit('objective', undefined, undefined, { fromTemplate: true });
    }
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

  const categoryColor = getCategoryColor(template.category);
  const actionPlan = template.actionPlan || generateDefaultActionPlan(template);

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center bg-background/95 backdrop-blur-md px-6 py-4 justify-between border-b border-slate-200/50">
        <button onClick={onBack} className="text-text-main flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Goal preview</span>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 lg:pb-8">
        {/* Goal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="size-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${categoryColor}15` }}
            >
              <span 
                className="material-symbols-outlined text-3xl"
                style={{ color: categoryColor }}
              >
                {template.icon}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-main mb-2">{template.name}</h1>
              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                {timeLeft && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">bookmark</span>
                    <span>{timeLeft}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">radio_button_unchecked</span>
                  <span>0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <button
            onClick={() => setExpandedProgress(!expandedProgress)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h2 className="text-lg font-bold text-text-main">Progress</h2>
            <span 
              className={`material-symbols-outlined text-text-tertiary transition-transform ${expandedProgress ? 'rotate-180' : ''}`}
            >
              expand_more
            </span>
          </button>
          {expandedProgress && (
            <div>
              <h3 className="text-sm font-semibold text-text-tertiary mb-2">Target</h3>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all"
                  style={{ 
                    width: '0%',
                    backgroundColor: categoryColor 
                  }}
                />
              </div>
              <p className="text-xs text-text-tertiary mt-2">0%</p>
            </div>
          )}
        </div>

        {/* Action Plan Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text-main mb-4">Action plan</h2>
          
          <div className="space-y-3">
            {actionPlan.weeks.map((week: ActionPlanWeek) => {
              const isExpanded = expandedWeeks.has(week.weekNumber);
              
              return (
                <div key={week.weekNumber} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Week Header */}
                  <button
                    onClick={() => toggleWeek(week.weekNumber)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-text-main">
                        Week {week.weekNumber}: {week.title}
                      </h3>
                      <span className="text-sm text-text-tertiary">({week.tasks.length})</span>
                    </div>
                    <span 
                      className={`material-symbols-outlined text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Week Tasks */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {week.tasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="mt-1">
                            <div className="size-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                              {/* Empty checkbox */}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text-main">{task.title}</p>
                            {task.scheduledDate && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-text-tertiary">
                                <span className="material-symbols-outlined text-xs">calendar_today</span>
                                <span>{formatDate(task.scheduledDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 px-6 py-4 flex gap-3 z-[80]" style={{ bottom: '6rem', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-white border-2 border-gray-200 text-text-main font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSelectAndPersonalize}
          className="flex-1 py-3 text-white font-semibold rounded-xl transition-colors"
          style={{ backgroundColor: categoryColor }}
        >
          Select and Personalize
        </button>
      </div>
    </div>
  );
};

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (dateString === today.toISOString().split('T')[0]) {
    return 'Today';
  }
  if (dateString === tomorrow.toISOString().split('T')[0]) {
    return 'Tomorrow';
  }
  
  const day = date.getDate();
  const month = date.toLocaleDateString('nl-NL', { month: 'short' });
  return `${day} ${month}`;
}

// Generate default action plan based on template
function generateDefaultActionPlan(template: ObjectiveTemplate): { weeks: ActionPlanWeek[] } {
  // Generate a simple 3-week action plan as default
  const weeks: ActionPlanWeek[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 3; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (i - 1) * 7);
    
    const tasks = [];
    const taskCount = i === 1 ? 3 : i === 2 ? 3 : 2; // 3, 3, 2 tasks per week
    
    for (let j = 0; j < taskCount; j++) {
      const taskDate = new Date(weekStart);
      taskDate.setDate(weekStart.getDate() + j * 2);
      
      tasks.push({
        id: `task-${i}-${j}`,
        title: generateTaskTitle(template.name, i, j),
        scheduledDate: taskDate.toISOString().split('T')[0],
        week: i,
        order: j + 1,
      });
    }
    
    weeks.push({
      weekNumber: i,
      title: generateWeekTitle(template.name, i),
      tasks,
    });
  }
  
  return { weeks };
}

function generateWeekTitle(goalName: string, weekNumber: number): string {
  const titles: { [key: number]: string[] } = {
    1: ['Identify the Skill', 'Get Started', 'Planning Phase'],
    2: ['Gather Resources', 'Research Phase', 'Preparation'],
    3: ['Learn the Basics', 'Implementation', 'Take Action'],
  };
  
  return titles[weekNumber]?.[0] || `Week ${weekNumber} Tasks`;
}

function generateTaskTitle(goalName: string, weekNumber: number, taskIndex: number): string {
  // Generate contextual task titles based on week and goal
  const taskTemplates: { [key: number]: string[] } = {
    1: [
      `List all skills that would benefit my work and enable me to add more value`,
      `Select the skill that aligns best with my personal interest`,
      `Define a clear outcome (e.g., improve productivity, take on new responsibilities, complete a specific project)`,
    ],
    2: [
      `Identify colleagues, mentors, or experts who can support me`,
      `Find learning materials (e.g., courses, books, tutorials, internal training)`,
      `Set aside time in my schedule for focused learning`,
    ],
    3: [
      `Complete beginner tutorials or attend introductory training`,
      `Practice one simple application of the skill related to my work`,
    ],
  };
  
  return taskTemplates[weekNumber]?.[taskIndex] || `Task ${taskIndex + 1} for ${goalName}`;
}

