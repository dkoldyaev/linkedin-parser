import { type UIEvent, useCallback, useEffect, useRef } from 'react';
import { GRID_CELL_PX } from '../utils';

export type GridScrollAxis = 'x' | 'y';

export type GridScrollHandler = (
  event: UIEvent<HTMLElement> | { readonly currentTarget: HTMLElement },
  axis?: GridScrollAxis
) => void;

function resolveGridCellPx(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return GRID_CELL_PX;
  }
  const styles = window.getComputedStyle(document.documentElement);
  const rawUiGrid =
    styles.getPropertyValue('--ui-grid-cell') ||
    styles.getPropertyValue('--ui-grid') ||
    styles.getPropertyValue('--grid');
  const parsed = Number.parseFloat(rawUiGrid);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : GRID_CELL_PX;
}

/**
 * Returns an `onScroll` callback that snaps a scrollable container's scroll offset
 * to the nearest 32px (`--ui-grid-cell`) Blueprint grid line 180ms after scrolling settles,
 * without preventing access to the start (`0`) or end (`maximum`) edge.
 */
export function useGridScroll(): GridScrollHandler {
  const timers = useRef<Map<HTMLElement, number>>(new Map());
  const pointerDown = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePointerDown = () => {
      pointerDown.current = true;
    };
    const handlePointerUp = () => {
      pointerDown.current = false;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    const pendingTimers = timers.current;
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      pendingTimers.forEach((timerId) => window.clearTimeout(timerId));
      pendingTimers.clear();
    };
  }, []);

  return useCallback(
    (
      event: UIEvent<HTMLElement> | { readonly currentTarget: HTMLElement },
      axis?: GridScrollAxis
    ) => {
      const element = event.currentTarget;
      if (!element || typeof window === 'undefined') {
        return;
      }

      const resolvedAxis: GridScrollAxis = axis !== undefined ? axis : 'y';
      const pendingTimers = timers.current;
      const existingTimer = pendingTimers.get(element);
      if (existingTimer !== undefined) {
        window.clearTimeout(existingTimer);
      }

      const settle = () => {
        if (pointerDown.current) {
          pendingTimers.set(element, window.setTimeout(settle, 180));
          return;
        }
        pendingTimers.delete(element);

        if (typeof document !== 'undefined') {
          const focused = document.activeElement;
          const isDraggingCard = Boolean(
            document.querySelector('.kanban-card.is-dragging')
          );
          const isEditingControl = Boolean(
            focused &&
              element.contains(focused) &&
              typeof focused.matches === 'function' &&
              focused.matches(
                'input, textarea, select, [contenteditable="true"]'
              )
          );
          if (isDraggingCard || isEditingControl) {
            return;
          }
        }

        const horizontal = resolvedAxis === 'x';
        const position = horizontal ? element.scrollLeft : element.scrollTop;
        const maximum = horizontal
          ? element.scrollWidth - element.clientWidth
          : element.scrollHeight - element.clientHeight;

        if (position <= 0 || position >= maximum - 1) {
          return;
        }

        const grid = resolveGridCellPx();
        const target = Math.min(
          maximum,
          Math.max(0, Math.round(position / grid) * grid)
        );

        if (Math.abs(position - target) > 0.5) {
          const prefersReducedMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const behavior: ScrollBehavior = prefersReducedMotion
            ? 'instant'
            : 'smooth';

          if (typeof element.scrollTo === 'function') {
            element.scrollTo(
              horizontal ? { left: target, behavior } : { top: target, behavior }
            );
          }
        }
      };

      pendingTimers.set(element, window.setTimeout(settle, 180));
    },
    []
  );
}
