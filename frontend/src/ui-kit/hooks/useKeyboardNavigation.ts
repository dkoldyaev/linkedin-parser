import { type KeyboardEvent, useCallback, useState } from 'react';

export interface UseKeyboardNavigationOptions<T> {
  readonly items: readonly T[];
  readonly initialIndex?: number;
  readonly loop?: boolean;
  readonly orientation?: 'vertical' | 'horizontal' | 'both';
  readonly onSelect?: (item: T, index: number) => void;
  readonly onEscape?: () => void;
}

export interface UseKeyboardNavigationReturn {
  readonly activeIndex: number;
  readonly setActiveIndex: (index: number) => void;
  readonly handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Provides roving/arrow-key keyboard navigation for lists, menus, palettes, and Kanban columns.
 */
export function useKeyboardNavigation<T>(
  options: UseKeyboardNavigationOptions<T>
): UseKeyboardNavigationReturn {
  const { items, initialIndex, loop, orientation, onSelect, onEscape } = options;
  const resolvedInitial = initialIndex !== undefined ? initialIndex : 0;
  const shouldLoop = loop !== undefined ? loop : true;
  const resolvedOrientation =
    orientation !== undefined ? orientation : 'vertical';

  const [activeIndex, setActiveIndex] = useState<number>(resolvedInitial);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const count = items.length;
      if (count === 0) {
        return;
      }

      const isNextKey =
        (resolvedOrientation !== 'horizontal' && event.key === 'ArrowDown') ||
        (resolvedOrientation !== 'vertical' && event.key === 'ArrowRight');

      const isPrevKey =
        (resolvedOrientation !== 'horizontal' && event.key === 'ArrowUp') ||
        (resolvedOrientation !== 'vertical' && event.key === 'ArrowLeft');

      if (isNextKey) {
        event.preventDefault();
        setActiveIndex((prev) => {
          if (prev + 1 < count) {
            return prev + 1;
          }
          return shouldLoop ? 0 : prev;
        });
        return;
      }

      if (isPrevKey) {
        event.preventDefault();
        setActiveIndex((prev) => {
          if (prev - 1 >= 0) {
            return prev - 1;
          }
          return shouldLoop ? count - 1 : prev;
        });
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        setActiveIndex(0);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        setActiveIndex(count - 1);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        if (
          onSelect &&
          activeIndex >= 0 &&
          activeIndex < count &&
          items[activeIndex] !== undefined
        ) {
          event.preventDefault();
          onSelect(items[activeIndex], activeIndex);
        }
        return;
      }

      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
      }
    },
    [items, shouldLoop, resolvedOrientation, onSelect, onEscape, activeIndex]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
}
