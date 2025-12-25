import React, { useState } from 'react';
import { Task } from '../types';
import { useSwipe } from '../hooks/useSwipe';
import { useLongPress } from '../hooks/useLongPress';

interface SwipeableTaskProps {
  task: Task;
  onDelete: () => void;
  onArchive: () => void;
  onToggle: () => void;
  onEdit: () => void;
  children: React.ReactNode;
  isRemoving?: boolean;
  onLongPress?: () => void;
}

export const SwipeableTask: React.FC<SwipeableTaskProps> = ({
  task,
  onDelete,
  onArchive,
  onToggle,
  onEdit,
  children,
  isRemoving = false,
  onLongPress
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const { swipeState, handlers, getTransform, getBackgroundColor, shouldAutoComplete } = useSwipe({
    onSwipeLeft: () => {
      setIsAnimating(true);
      setTimeout(() => {
        onDelete();
        setIsAnimating(false);
      }, 200);
    },
    onSwipeRight: () => {
      setIsAnimating(true);
      setTimeout(() => {
        onArchive();
        setIsAnimating(false);
      }, 200);
    },
    threshold: 50,
    autoCompleteThreshold: 100
  });

  const longPressHandlers = onLongPress ? useLongPress({
    onLongPress: () => {
      onLongPress();
    },
    onClick: () => {
      // onClick is handled by the div's onClick handler below
    }
  }) : {};
  
  // Merge handlers - long-press takes priority for start events, swipe for move/end
  const mergedHandlers = onLongPress ? {
    onTouchStart: (e: React.TouchEvent) => {
      longPressHandlers.onTouchStart?.(e);
      handlers.onTouchStart?.(e);
    },
    onTouchMove: (e: React.TouchEvent) => {
      longPressHandlers.onTouchMove?.(e);
      handlers.onTouchMove?.(e);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      longPressHandlers.onTouchEnd?.(e);
      handlers.onTouchEnd?.(e);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      longPressHandlers.onTouchCancel?.(e);
      handlers.onTouchCancel?.(e);
    },
    onMouseDown: (e: React.MouseEvent) => {
      longPressHandlers.onMouseDown?.(e);
      handlers.onMouseDown?.(e);
    },
    onMouseMove: (e: React.MouseEvent) => {
      longPressHandlers.onMouseMove?.(e);
      handlers.onMouseMove?.(e);
    },
    onMouseUp: (e: React.MouseEvent) => {
      longPressHandlers.onMouseUp?.(e);
      handlers.onMouseUp?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      longPressHandlers.onMouseLeave?.(e);
      handlers.onMouseLeave?.(e);
    }
  } : handlers;

  const bgColor = getBackgroundColor();
  const transform = getTransform();
  const showAction = Math.abs(swipeState.deltaX) > 30;
  const isLeftSwipe = swipeState.direction === 'left';
  const isRightSwipe = swipeState.direction === 'right';

  return (
    <div className="relative overflow-hidden">
      {/* Action Background */}
      {showAction && (
        <div className={`absolute inset-0 flex items-center justify-between px-5 z-0 ${bgColor} transition-colors`}>
          {isLeftSwipe && (
            <div className="flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-2xl">delete</span>
              <span className="font-bold text-sm">Delete</span>
            </div>
          )}
          {isRightSwipe && (
            <div className="flex items-center gap-2 text-white ml-auto">
              <span className="font-bold text-sm">Archive</span>
              <span className="material-symbols-outlined text-2xl">archive</span>
            </div>
          )}
        </div>
      )}

      {/* Task Content */}
      <div
        className={`relative z-10 transition-transform duration-200 ${isAnimating || isRemoving ? 'opacity-0' : ''}`}
        style={{
          transform: transform,
          transition: isAnimating ? 'transform 0.2s ease-out, opacity 0.2s' : 'transform 0.1s ease-out'
        }}
        {...mergedHandlers}
        onClick={(e) => {
          // Only trigger edit if not swiping
          if (!swipeState.isSwiping && Math.abs(swipeState.deltaX) < 10) {
            onEdit();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
};

