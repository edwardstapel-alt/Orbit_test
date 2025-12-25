import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { View, Task } from '../types';
import { TopNav } from '../components/TopNav';

interface TasksOverviewProps {
  onNavigate: (view: View) => void;
  onEdit: (type: 'task', id?: string) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onBack?: () => void;
}

export const TasksOverview: React.FC<TasksOverviewProps> = ({ onNavigate, onEdit, onMenuClick, onProfileClick, onBack }) => {
  const { tasks, objectives, lifeAreas, updateTask, deleteCompletedTasks } = useData();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'normal'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique tags
  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(task => {
      if (task.tag) {
        tagSet.add(task.tag);
      }
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (filter === 'active' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;

      // Priority filter
      if (priorityFilter === 'high' && !task.priority) return false;
      if (priorityFilter === 'normal' && task.priority) return false;

      // Tag filter
      if (tagFilter !== 'all' && task.tag !== tagFilter) return false;

      // Search filter
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [tasks, filter, priorityFilter, tagFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const highPriority = tasks.filter(t => t.priority && !t.completed).length;
    return { total, completed, active, highPriority };
  }, [tasks]);

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask({ ...task, completed: !task.completed });
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav 
        title="Tasks" 
        subtitle="Manage Your Tasks" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onBack={onBack}
        showBack={!!onBack}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-8 px-6 md:px-12 lg:px-16 pt-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-bold text-text-main">{stats.total}</div>
                  <div className="text-xs text-text-tertiary">Total</div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{stats.active}</div>
                  <div className="text-xs text-text-tertiary">Active</div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                  <div className="text-xs text-text-tertiary">Done</div>
                </div>
                {stats.highPriority > 0 && (
                  <>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{stats.highPriority}</div>
                      <div className="text-xs text-text-tertiary">Priority</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats.completed > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${stats.completed} completed task${stats.completed > 1 ? 's' : ''}?`)) {
                      const deletedCount = deleteCompletedTasks();
                      alert(`Deleted ${deletedCount} completed task${deletedCount > 1 ? 's' : ''}.`);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl shadow-sm hover:bg-red-600 transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">delete_sweep</span>
                  Clear Completed ({stats.completed})
                </button>
              )}
              <button
                onClick={() => onNavigate(View.TASKS)}
                className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm font-semibold text-text-main hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">calendar_view_week</span>
                Week View
              </button>
              <button
                onClick={() => onEdit('task')}
                className="px-4 py-2 bg-primary text-white rounded-xl shadow-md hover:bg-primary-soft transition-colors text-sm font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add Task
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xl">search</span>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-100 focus:border-primary focus:outline-none text-text-main placeholder:text-text-tertiary"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === 'active'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === 'completed'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Priority and Tag Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Priority Filter */}
              <button
                onClick={() => setPriorityFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  priorityFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                }`}
              >
                All Priorities
              </button>
              <button
                onClick={() => setPriorityFilter('high')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  priorityFilter === 'high'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-sm">flag</span>
                High Priority
              </button>
              <button
                onClick={() => setPriorityFilter('normal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  priorityFilter === 'normal'
                    ? 'bg-primary text-white'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                }`}
              >
                Normal
              </button>

              {/* Tag Filter */}
              {tags.length > 0 && (
                <>
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                  <button
                    onClick={() => setTagFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      tagFilter === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    All Tags
                  </button>
                  {tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tagFilter === tag
                          ? 'bg-primary text-white'
                          : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">task_alt</span>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">No Tasks Found</h3>
              <p className="text-sm text-text-secondary mb-4">
                {tasks.length === 0
                  ? "Create your first task to start organizing your work."
                  : "No tasks match your current filters."}
              </p>
              <button 
                onClick={() => onEdit('task')}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-soft transition-colors"
              >
                Create Task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const linkedObjective = objectives.find(obj => obj.id === task.objectiveId);
                const linkedLifeArea = task.lifeAreaId ? lifeAreas.find(la => la.id === task.lifeAreaId) : null;

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 group hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onEdit('task', task.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="relative flex items-center shrink-0 mt-1" onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}>
                        <input 
                          type="checkbox" 
                          checked={task.completed}
                          readOnly
                          className="peer h-6 w-6 cursor-pointer appearance-none rounded-full border-2 border-gray-300 bg-transparent checked:border-primary checked:bg-primary transition-all hover:border-primary/50 focus:ring-0 focus:ring-offset-0" 
                        />
                        <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 text-[14px] font-bold pointer-events-none transition-opacity">check</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className={`text-base font-bold text-text-main flex-1 group-hover:text-primary transition-colors ${
                            task.completed ? 'line-through text-text-tertiary' : ''
                          }`}>
                            {task.title}
                          </h3>
                          {task.priority && (
                            <span className="material-symbols-outlined text-red-500 text-xl shrink-0" title="High Priority">flag</span>
                          )}
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {task.tag && (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                              task.priority ? 'bg-primary-light text-primary' : 'bg-gray-100 text-text-secondary'
                            }`}>
                              {task.tag}
                            </span>
                          )}
                          {task.time && (
                            <span className="text-xs text-text-tertiary flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              {task.time}
                            </span>
                          )}
                          {linkedObjective && (
                            <span className="text-xs text-text-tertiary flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">target</span>
                              {linkedObjective.title}
                            </span>
                          )}
                          {linkedLifeArea && (
                            <span className="text-xs text-text-tertiary flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">category</span>
                              {linkedLifeArea.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit('task', task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg shrink-0"
                      >
                        <span className="material-symbols-outlined text-text-tertiary text-xl">more_vert</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

