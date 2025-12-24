import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { View, Review } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface WeeklyReviewProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const WeeklyReview: React.FC<WeeklyReviewProps> = ({ onBack, onNavigate, onMenuClick, onProfileClick }) => {
  const { 
    tasks, 
    habits, 
    objectives, 
    keyResults, 
    lifeAreas,
    reviews,
    addReview,
    updateReview,
    getLatestReview
  } = useData();

  // Calculate week dates
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = today.getDate() - dayOfWeek; // Get to Sunday
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      startDate: weekStart,
      endDate: weekEnd
    };
  };

  const weekDates = useMemo(() => getWeekDates(), []);
  
  // Check if review already exists
  const existingReview = useMemo(() => {
    return getLatestReview('weekly');
  }, [getLatestReview, reviews]);

  const [review, setReview] = useState<Partial<Review>>(() => {
    if (existingReview && existingReview.date === weekDates.start) {
      return existingReview;
    }
    return {
      id: uuidv4(),
      type: 'weekly',
      date: weekDates.start,
      endDate: weekDates.end,
      answers: {},
      achievements: '',
      goalsOnTrack: [],
      goalsNeedingAttention: [],
      lessons: '',
      nextWeekChanges: '',
      actionItems: [],
      insights: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false
    };
  });

  // Get week data
  const weekData = useMemo(() => {
    const weekTasks = tasks.filter(t => {
      if (!t.scheduledDate) return false;
      const taskDate = new Date(t.scheduledDate);
      return taskDate >= weekDates.startDate && taskDate <= weekDates.endDate;
    });
    
    const completedTasks = weekTasks.filter(t => t.completed);
    const completionRate = weekTasks.length > 0 ? (completedTasks.length / weekTasks.length) * 100 : 0;

    // Get objectives with progress
    const objectivesWithProgress = objectives.map(obj => {
      const linkedKRs = keyResults.filter(kr => kr.objectiveId === obj.id);
      const avgProgress = linkedKRs.length > 0
        ? Math.round(linkedKRs.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / linkedKRs.length)
        : obj.progress;
      
      return {
        ...obj,
        progress: avgProgress,
        keyResults: linkedKRs
      };
    });

    // Get habits with streaks
    const habitsWithStreaks = habits.map(habit => ({
      ...habit,
      streak: habit.streak || 0
    }));

    return {
      tasks: weekTasks,
      completedTasks,
      completionRate,
      objectives: objectivesWithProgress,
      habits: habitsWithStreaks,
      totalTasks: weekTasks.length,
      completedTasksCount: completedTasks.length
    };
  }, [tasks, habits, objectives, keyResults, weekDates]);

  const handleSave = () => {
    const reviewToSave: Review = {
      ...review,
      updatedAt: new Date().toISOString(),
      completed: true
    } as Review;

    if (existingReview && existingReview.id === review.id) {
      updateReview(reviewToSave);
    } else {
      addReview(reviewToSave);
    }
    onBack();
  };

  const handleChange = (field: string, value: any) => {
    setReview(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav
        title="Weekly Review"
        subtitle={`${formatDate(weekDates.start)} - ${formatDate(weekDates.end)}`}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onBack={onBack}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-8 px-6 lg:px-8 xl:px-12 pt-6">
        <div className="max-w-5xl mx-auto">
        {/* Week Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-xs font-bold text-text-tertiary uppercase mb-1">Tasks</div>
            <div className="text-2xl font-bold text-text-main">{weekData.completedTasksCount}/{weekData.totalTasks}</div>
            <div className="text-xs text-text-tertiary mt-1">{Math.round(weekData.completionRate)}% completed</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-xs font-bold text-text-tertiary uppercase mb-1">Habits</div>
            <div className="text-2xl font-bold text-text-main">
              {weekData.habits.filter(h => h.streak > 0).length}
            </div>
            <div className="text-xs text-text-tertiary mt-1">active streaks</div>
          </div>
        </div>

        {/* Objectives Progress */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-text-main mb-4">Objectives Progress</h2>
          <div className="space-y-3">
            {weekData.objectives.slice(0, 5).map(obj => {
              const lifeArea = lifeAreas.find(la => la.id === obj.lifeAreaId);
              return (
                <div key={obj.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-main">{obj.title}</span>
                      <span className="text-xs font-bold text-text-tertiary">{obj.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${obj.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reflection Questions */}
        <div className="space-y-6 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-text-main mb-3">What did I achieve this week?</h2>
            <textarea
              value={review.achievements || ''}
              onChange={(e) => handleChange('achievements', e.target.value)}
              placeholder="List your key achievements..."
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-text-main mb-3">Which goals are on track?</h2>
            <div className="space-y-2">
              {weekData.objectives.map(obj => (
                <label key={obj.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={review.goalsOnTrack?.includes(obj.id) || false}
                    onChange={(e) => {
                      const current = review.goalsOnTrack || [];
                      handleChange('goalsOnTrack', e.target.checked
                        ? [...current, obj.id]
                        : current.filter(id => id !== obj.id)
                      );
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-main flex-1">{obj.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-text-main mb-3">Which goals need attention?</h2>
            <div className="space-y-2">
              {weekData.objectives.map(obj => (
                <label key={obj.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={review.goalsNeedingAttention?.includes(obj.id) || false}
                    onChange={(e) => {
                      const current = review.goalsNeedingAttention || [];
                      handleChange('goalsNeedingAttention', e.target.checked
                        ? [...current, obj.id]
                        : current.filter(id => id !== obj.id)
                      );
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-main flex-1">{obj.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-text-main mb-3">What were the key lessons?</h2>
            <textarea
              value={review.lessons || ''}
              onChange={(e) => handleChange('lessons', e.target.value)}
              placeholder="What did you learn this week?"
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-text-main mb-3">What will I do differently next week?</h2>
            <textarea
              value={review.nextWeekChanges || ''}
              onChange={(e) => handleChange('nextWeekChanges', e.target.value)}
              placeholder="What changes will you make?"
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
            />
          </div>
        </div>
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 px-6 py-4 flex gap-3 z-[80]">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-white border-2 border-gray-200 text-text-main font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-soft transition-colors"
        >
          Save Review
        </button>
      </div>
    </div>
  );
};

