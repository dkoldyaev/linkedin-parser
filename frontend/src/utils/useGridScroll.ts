import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

function isInteractiveChildFocused(element: HTMLElement): boolean {
  if (document.querySelector('.kanban-card.is-dragging')) return true;
  const focused = document.activeElement;
  if (!focused || !element.contains(focused)) return false;
  return focused.matches('input, textarea, select, [contenteditable="true"]');
}

function getScrollMetrics(
  element: HTMLElement,
  horizontal: boolean,
): { position: number; maximum: number } {
  if (horizontal) {
    return {
      position: element.scrollLeft,
      maximum: element.scrollWidth - element.clientWidth,
    };
  }
  return {
    position: element.scrollTop,
    maximum: element.scrollHeight - element.clientHeight,
  };
}

function resolveGridUnitPx(): number {
  const rawGrid = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid'));
  return Number.isNaN(rawGrid) || rawGrid <= 0 ? 32 : rawGrid;
}

function resolveScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
}

function snapElementToGrid(element: HTMLElement, horizontal: boolean): void {
  const { position, maximum } = getScrollMetrics(element, horizontal);
  if (position <= 0 || position >= maximum - 1) return;

  const grid = resolveGridUnitPx();
  const target = Math.min(maximum, Math.max(0, Math.round(position / grid) * grid));
  if (Math.abs(position - target) <= 0.5) return;

  const behavior = resolveScrollBehavior();
  element.scrollTo(horizontal ? { left: target, behavior } : { top: target, behavior });
}

/** Snap after a user finishes scrolling, without preventing access to either edge. */
export function useGridScroll(): (event: React.UIEvent<HTMLElement>, axis?: 'x' | 'y') => void {
  const timers = useRef<Map<HTMLElement, ReturnType<typeof setTimeout>>>(new Map());
  const pointerDown = useRef<boolean>(false);

  useEffect(() => {
    const down = () => {
      pointerDown.current = true;
    };
    const up = () => {
      pointerDown.current = false;
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    const pending = timers.current;
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  return useCallback((event: React.UIEvent<HTMLElement>, axis?: 'x' | 'y') => {
    const element = event.currentTarget;
    const pending = timers.current;
    const existingTimer = pending.get(element);
    if (existingTimer) clearTimeout(existingTimer);

    const settle = () => {
      if (pointerDown.current) {
        pending.set(element, setTimeout(settle, 180));
        return;
      }
      pending.delete(element);
      if (isInteractiveChildFocused(element)) return;
      snapElementToGrid(element, axis === 'x');
    };
    pending.set(element, setTimeout(settle, 180));
  }, []);
}
