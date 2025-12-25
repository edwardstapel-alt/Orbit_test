import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (e: React.TouchEvent | React.MouseEvent) => void;
  delay?: number;
  threshold?: number; // Maximum movement allowed (in pixels)
}

export const useLongPress = ({
  onLongPress,
  onClick,
  delay = 500,
  threshold = 10
}: UseLongPressOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressRef = useRef(false);
  const hasMovedRef = useRef(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Get initial position
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startPosRef.current = { x: clientX, y: clientY };
    hasMovedRef.current = false;
    isLongPressRef.current = false;

    // Trigger haptic feedback on mobile (if available)
    if ('touches' in e && 'vibrate' in navigator) {
      try {
        (navigator as any).vibrate(10);
      } catch (err) {
        // Ignore vibration errors
      }
    }

    timeoutRef.current = setTimeout(() => {
      if (!hasMovedRef.current && startPosRef.current) {
        isLongPressRef.current = true;
        onLongPress(e);
        
        // Haptic feedback on long press
        if ('touches' in e && 'vibrate' in navigator) {
          try {
            (navigator as any).vibrate(50);
          } catch (err) {
            // Ignore vibration errors
          }
        }
      }
    }, delay);
  }, [onLongPress, delay]);

  const move = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!startPosRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = Math.abs(clientX - startPosRef.current.x);
    const deltaY = Math.abs(clientY - startPosRef.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > threshold) {
      hasMovedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [threshold]);

  const end = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If it was a long press, prevent default click behavior
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressRef.current = false;
      return;
    }

    // If it wasn't a long press and didn't move too much, trigger onClick
    if (!hasMovedRef.current && onClick) {
      onClick(e);
    }

    // Reset
    startPosRef.current = null;
    hasMovedRef.current = false;
  }, [onClick]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    startPosRef.current = null;
    hasMovedRef.current = false;
    isLongPressRef.current = false;
  }, []);

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onMouseLeave: cancel,
  };
};

