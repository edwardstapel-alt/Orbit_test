import { useRef, useCallback, useState } from 'react';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance for swipe (default: 50px)
  autoCompleteThreshold?: number; // Distance for auto-complete (default: 100px)
}

interface SwipeState {
  isSwiping: boolean;
  deltaX: number;
  direction: 'left' | 'right' | null;
}

export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  autoCompleteThreshold = 100
}: UseSwipeOptions) => {
  const startXRef = useRef<number | null>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    deltaX: 0,
    direction: null
  });

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    setSwipeState({
      isSwiping: true,
      deltaX: 0,
      direction: null
    });
  }, []);

  const move = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (startXRef.current === null) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startXRef.current;
    const direction = deltaX > 0 ? 'right' : 'left';

    setSwipeState({
      isSwiping: true,
      deltaX,
      direction: Math.abs(deltaX) > 10 ? direction : null
    });
  }, []);

  const end = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (startXRef.current === null) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
    const deltaX = clientX - startXRef.current;
    const absDeltaX = Math.abs(deltaX);

    // Check if swipe meets threshold
    if (absDeltaX >= threshold) {
      if (deltaX < 0 && onSwipeLeft) {
        // Swipe left (delete)
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        // Swipe right (archive)
        onSwipeRight();
      }
    }

    // Reset
    startXRef.current = null;
    setSwipeState({
      isSwiping: false,
      deltaX: 0,
      direction: null
    });
  }, [threshold, onSwipeLeft, onSwipeRight]);

  const cancel = useCallback(() => {
    startXRef.current = null;
    setSwipeState({
      isSwiping: false,
      deltaX: 0,
      direction: null
    });
  }, []);

  return {
    swipeState,
    handlers: {
      onTouchStart: start,
      onTouchMove: move,
      onTouchEnd: end,
      onTouchCancel: cancel,
      onMouseDown: start,
      onMouseMove: move,
      onMouseUp: end,
      onMouseLeave: cancel,
    },
    // Helper to get transform style
    getTransform: () => {
      if (!swipeState.isSwiping || swipeState.deltaX === 0) {
        return 'translateX(0)';
      }
      return `translateX(${swipeState.deltaX}px)`;
    },
    // Helper to get background color based on direction
    getBackgroundColor: () => {
      if (!swipeState.isSwiping || !swipeState.direction) {
        return 'transparent';
      }
      if (swipeState.direction === 'left') {
        return 'bg-red-500';
      }
      return 'bg-yellow-500';
    },
    // Check if auto-complete threshold is met
    shouldAutoComplete: () => {
      return Math.abs(swipeState.deltaX) >= autoCompleteThreshold;
    }
  };
};

