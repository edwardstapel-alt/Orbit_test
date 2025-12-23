import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { View, Review } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface MonthlyReviewProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const MonthlyReview: React.FC<MonthlyReviewProps> = ({ onBack, onNavigate, onMenuClick, onProfileClick }) => {
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

  // Calculate month dates
  const getMonthDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    return {
      start: monthStart.toISOString().split('T')[0],
      end: monthEnd.toISOString().split('T')[0],
      startDate: monthStart,
      endDate: monthEnd
    };
  };

  const monthDates = useMemo(() => getMonthDates(), []);
  
  // Check if review already exists
  const existingReview = useMemo(() => {
    return getLatestReview('monthly');
  }, [getLatestReview, reviews]);

  const [review, setReview] = useState<Partial<Review>>(() => {
    if (existingReview && existingReview.date === monthDates.start) {
      return existingReview;
    }
    return {
      id: uuidv4(),
      type: 'monthly',
      date: monthDates.start,
      endDate: monthDates.end,
      answers: {},
      biggestSuccesses: '',
      goalsNotMet: '',
      keyInsights: '',
      goalsToAdjust: [],
      nextMonthPriorities: '',
      actionItems: [],
      insights: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false
    };
  });

  // Get month data
  const monthData = useMemo(() => {
    const monthTasks = tasks.filter(t => {
      if (!t.scheduledDate) return false;
      const taskDate = new Date(t.scheduledDate);
      return taskDate >= monthDates.startDate && taskDate <= monthDates.endDate;
    });
    
    const completedTasks = monthTasks.filter(t => t.completed);
    const completionRate = monthTasks.length > 0 ? (completedTasks.length / monthTasks.length) * 100 : 0;

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
      streak: habit.streak || 0,
      longestStreak: habit.longestStreak || habit.streak || 0
    }));

    // Calculate time per life area
    const timePerLifeArea: { [lifeAreaId: string]: number } = {};
    monthTasks.forEach(task => {
      if (task.lifeAreaId) {
        timePerLifeArea[task.lifeAreaId] = (timePerLifeArea[task.lifeAreaId] || 0) + 1;
      }
    });

    return {
      tasks: monthTasks,
      completedTasks,
      completionRate,
      objectives: objectivesWithProgress,
      habits: habitsWithStreaks,
      totalTasks: monthTasks.length,
      completedTasksCount: completedTasks.length,
      timePerLifeArea
    };
  }, [tasks, habits, objectives, keyResults, monthDates]);

  // Get previous month review for comparison
  const previousMonthReview = useMemo(() => {
    const prevMonth = new Date(monthDates.startDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthStart = prevMonth.toISOString().split('T')[0];
    return reviews.find(r => r.type === 'monthly' && r.date === prevMonthStart);
  }, [reviews, monthDates]);

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
    return date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav
        title="Monthly Review"
        subtitle={formatDate(monthDates.start)}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onBack={onBack}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 pt-6">
        {/* Month Statistics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-xs font-bold text-text-tertiary uppercase mb-1">Tasks</div>
            <div className="text-2xl font-bold text-text-main">{monthData.completedTasksCount}/{monthData.totalTasks}</div>
            <div className="text-xs text-text-tertiary mt-1">{Math.round(monthData.completionRate)}%</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-xs font-bold text-text-tertiary uppercase mb-1">Objectives</div>
            <div className="text-2xl font-bold text-text-main">{monthData.objectives.length}</div>
            <div className="text-xs text-text-tertiary mt-1">active</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-xs font-bold text-text-tertiary uppercase mb-1">Habits</div>
            <div className="text-2xl font-bold text-text-main">
              {monthData.habits.filter(h => h.streak >= 7).length}
            </div>
            <div className="text-xs text-text-tertiary mt-1">7+ day streaks</div>
          </div>
        </div>

        {/* Top Objectives */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-text-main mb-4">Objectives Overview</h2>
          <div className="space-y-3">
            {monthData.objectives.slice(0, 5).map(obj => {
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
            <h2 className="text-lg font-bold text-text-main mb-3">What were the biggest successes this month?</h2>
            <textarea
              value={review.biggestSuccesses || ''}
              onChange={(e) => handleChange('biggestSuccesses', e.target.value)}
              placeholder="Celebrate your wins..."
              className="w-full min-h-[120px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-text-main mb-3">Which goals were not met and why?</h2>
            <textarea
              value={review.goalsNotMet || ''}
              onChange={(e) => handleChange('goalsNotMet', e.target.value)}
              placeholder="Be honest about what didn't work..."
              className="w-full min-h-[120px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-text-main mb-3">What are the key insights?</h2>
            <textarea
              value={review.keyInsights || ''}
              onChange={(e) => handleChange('keyInsights', e.target.value)}
              placeholder="What patterns did you notice?"
              className="w-full min-h-[120px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-text-main mb-3">Which goals should be adjusted?</h2>
            <div className="space-y-2">
              {monthData.objectives.map(obj => (
                <label key={obj.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={review.goalsToAdjust?.includes(obj.id) || false}
                    onChange={(e) => {
                      const current = review.goalsToAdjust || [];
                      handleChange('goalsToAdjust', e.target.checked
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
            <h2 className="text-lg font-bold text-text-main mb-3">What are the priorities for next month?</h2>
            <textarea
              value={review.nextMonthPriorities || ''}
              onChange={(e) => handleChange('nextMonthPriorities', e.target.value)}
              placeholder="Set your focus for the coming month..."
              className="w-full min-h-[120px] p-3 rounded-xl border border-gray-200 bg-gray-50 text-text-main placeholder-text-tertiary resize-none focus:outline-none focus:border-primary focus:bg-white"
            />
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

