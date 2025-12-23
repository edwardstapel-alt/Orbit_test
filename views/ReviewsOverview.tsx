import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';
import { View, Review, Retrospective } from '../types';

interface ReviewsOverviewProps {
  onBack: () => void;
  onNavigate: (view: View, objectiveId?: string) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

type FilterType = 'all' | 'weekly' | 'monthly' | 'retrospective';

export const ReviewsOverview: React.FC<ReviewsOverviewProps> = ({ 
  onBack, 
  onNavigate, 
  onMenuClick, 
  onProfileClick 
}) => {
  const { 
    reviews,
    retrospectives,
    objectives,
    keyResults
  } = useData();

  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'date' | 'recent'>('recent');

  const filteredItems = useMemo(() => {
    let items: Array<Review | Retrospective> = [];
    
    if (filter === 'all' || filter === 'weekly' || filter === 'monthly') {
      const filteredReviews = reviews.filter(r => 
        filter === 'all' || r.type === filter
      );
      items = [...items, ...filteredReviews];
    }
    
    if (filter === 'all' || filter === 'retrospective') {
      items = [...items, ...retrospectives];
    }

    // Sort
    if (sortBy === 'recent') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      items.sort((a, b) => {
        const dateA = 'date' in a ? a.date : a.createdAt;
        const dateB = 'date' in b ? b.date : b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    }

    return items;
  }, [reviews, retrospectives, filter, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getReviewSummary = (review: Review) => {
    const achievements = review.achievements ? review.achievements.substring(0, 100) : '';
    const lessons = review.lessons ? review.lessons.substring(0, 100) : '';
    return achievements || lessons || 'No summary available';
  };

  const getRetrospectiveSummary = (retrospective: Retrospective) => {
    const startCount = retrospective.start?.length || 0;
    const stopCount = retrospective.stop?.length || 0;
    const continueCount = retrospective.continue?.length || 0;
    return `${startCount} start, ${stopCount} stop, ${continueCount} continue`;
  };

  const getEntityTitle = (item: Review | Retrospective) => {
    if ('type' in item) {
      // It's a Review
      return `${item.type === 'weekly' ? 'Weekly' : 'Monthly'} Review`;
    } else {
      // It's a Retrospective
      if (item.objectiveId) {
        const objective = objectives.find(o => o.id === item.objectiveId);
        return `Retrospective: ${objective?.title || 'Objective'}`;
      }
      if (item.keyResultId) {
        const keyResult = keyResults.find(kr => kr.id === item.keyResultId);
        return `Retrospective: ${keyResult?.title || 'Key Result'}`;
      }
      return 'Retrospective';
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <TopNav
        title="Reviews & Retrospectives"
        subtitle={`${filteredItems.length} items`}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        onBack={onBack}
      />

      {/* Filters */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-text-secondary hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'weekly'
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-text-secondary hover:bg-gray-50'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setFilter('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'monthly'
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-text-secondary hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFilter('retrospective')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'retrospective'
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-text-secondary hover:bg-gray-50'
            }`}
          >
            Retrospectives
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Sort by:</span>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              sortBy === 'recent'
                ? 'bg-gray-100 text-text-main'
                : 'bg-white border border-gray-200 text-text-secondary hover:bg-gray-50'
            }`}
          >
            Most Recent
          </button>
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              sortBy === 'date'
                ? 'bg-gray-100 text-text-main'
                : 'bg-white border border-gray-200 text-text-secondary hover:bg-gray-50'
            }`}
          >
            Date
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6 pt-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-text-tertiary mb-3 block">description</span>
            <p className="text-text-tertiary text-sm">No reviews or retrospectives yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isReview = 'type' in item;
              const date = isReview ? item.date : item.createdAt;
              
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
                  onClick={() => {
                    if (isReview) {
                      onNavigate(item.type === 'weekly' ? View.WEEKLY_REVIEW : View.MONTHLY_REVIEW);
                    } else {
                      if (item.objectiveId) {
                        onNavigate(View.OBJECTIVE_DETAIL, item.objectiveId);
                      } else {
                        onNavigate(View.RETROSPECTIVE);
                      }
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-text-main mb-1">
                        {getEntityTitle(item)}
                      </h3>
                      <p className="text-xs text-text-tertiary">
                        {formatDate(date)}
                      </p>
                    </div>
                    {item.completed && (
                      <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                    {isReview ? getReviewSummary(item) : getRetrospectiveSummary(item)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Quick Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 px-6 py-4 flex gap-3 z-[80]">
        <button
          onClick={() => onNavigate(View.WEEKLY_REVIEW)}
          className="flex-1 py-3 bg-white border-2 border-gray-200 text-text-main font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          Weekly Review
        </button>
        <button
          onClick={() => onNavigate(View.MONTHLY_REVIEW)}
          className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-soft transition-colors text-sm"
        >
          Monthly Review
        </button>
      </div>
    </div>
  );
};

