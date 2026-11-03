import { useCallback, useEffect, useRef } from 'react';

/** Snap after a user finishes scrolling, without preventing access to either edge. */
export function useGridScroll() {
  const timers = useRef(new Map());
  const pointerDown = useRef(false);

  useEffect(() => {
    const down = () => { pointerDown.current = true; };
    const up = () => { pointerDown.current = false; };
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

  return useCallback((event, axis = 'y') => {
    const element = event.currentTarget;
    const pending = timers.current;
    clearTimeout(pending.get(element));
    const settle = () => {
      if (pointerDown.current) {
        pending.set(element, setTimeout(settle, 180));
        return;
      }
      pending.delete(element);
      const focused = document.activeElement;
      if (document.querySelector('.kanban-card.is-dragging') ||
          (element.contains(focused) && focused.matches('input, textarea, select, [contenteditable="true"]'))) return;
      const horizontal = axis === 'x';
      const position = horizontal ? element.scrollLeft : element.scrollTop;
      const maximum = horizontal ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight;
      if (position <= 0 || position >= maximum - 1) return;
      const grid = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
      const target = Math.min(maximum, Math.max(0, Math.round(position / grid) * grid));
      if (Math.abs(position - target) > 0.5) element.scrollTo(horizontal ? { left: target, behavior: 'instant' } : { top: target, behavior: 'instant' });
    };
    pending.set(element, setTimeout(settle, 180));
  }, []);
}
