import type React from 'react';
import { useLayoutEffect, useRef } from 'react';

function resolveGridUnit(): number {
  const raw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid'));
  return Number.isNaN(raw) || raw <= 0 ? 32 : raw;
}

function computeResponsiveColumnCount(row: HTMLElement, vw: number): number {
  const maxCols = parseInt(row.getAttribute('data-cols') || '1', 10) || 1;
  if (vw <= 700) return 1;
  if (vw <= 1024) {
    const tabletCols = parseInt(row.getAttribute('data-tablet-cols') || '2', 10) || 2;
    return Math.min(maxCols, tabletCols);
  }
  return maxCols;
}

function quantizeGridRows(root: HTMLElement, grid: number, vw: number): void {
  const rows = Array.from(root.querySelectorAll<HTMLElement>('.bp-grid-row[data-cols]'));
  for (const row of rows) {
    const cols = computeResponsiveColumnCount(row, vw);
    if (cols <= 1) {
      row.style.gridTemplateColumns = 'minmax(0, 1fr)';
    } else {
      const totalW = row.clientWidth;
      const rawCol = totalW / cols;
      const colW = Math.max(grid * 6, Math.floor(rawCol / grid) * grid);
      row.style.gridTemplateColumns = `repeat(${cols - 1}, ${colW}px) minmax(0, 1fr)`;
    }
  }
}

function getDomDepthRelativeToRoot(el: HTMLElement, root: HTMLElement): number {
  let depth = 0;
  for (let node: HTMLElement | null = el; node && node !== root; node = node.parentElement) {
    depth += 1;
  }
  return depth;
}

function snapVariableHeightCells(root: HTMLElement, grid: number): void {
  const snaps = Array.from(root.querySelectorAll<HTMLElement>('.bp-snap, .column-header'));
  for (const el of snaps) {
    el.style.minHeight = '';
  }
  snaps.sort((a, b) => getDomDepthRelativeToRoot(b, root) - getDomDepthRelativeToRoot(a, root));
  for (const el of snaps) {
    const minGrids = parseInt(el.getAttribute('data-min-grids') || '1', 10) || 1;
    const h = el.offsetHeight;
    const height = Math.max(minGrids * grid, Math.ceil(h / grid) * grid);
    el.style.minHeight = `${height}px`;
  }
}

function alignTopEdgesToGrid(root: HTMLElement, grid: number): void {
  const topAligned = Array.from(root.querySelectorAll<HTMLElement>('[data-grid-top]'));
  for (const el of topAligned) {
    el.style.marginTop = '';
    const baseMargin = parseFloat(getComputedStyle(el).marginTop) || 0;
    const top = el.getBoundingClientRect().top;
    const remainder = ((top % grid) + grid) % grid;
    const offset = (grid - remainder) % grid;
    if (offset > 0.5) {
      el.style.marginTop = `${baseMargin + offset}px`;
    }
  }
}

function snapFillGridEditors(root: HTMLElement, grid: number): void {
  const fillEls = Array.from(root.querySelectorAll<HTMLElement>('.bp-fill-grid'));
  for (const el of fillEls) {
    const rect = el.getBoundingClientRect();
    const available = window.innerHeight - rect.top;
    const minRows = parseInt(el.getAttribute('data-min-grids') || '10', 10) || 10;
    const snappedH = Math.max(minRows * grid, Math.floor(available / grid) * grid);
    el.style.height = `${snappedH}px`;
  }
}

function updateScrollerTail(root: HTMLElement, scroller: HTMLElement | null, grid: number): void {
  if (!scroller) return;
  const previousTail = parseFloat(root.style.getPropertyValue('--bp-scroll-tail')) || 0;
  const overflow = scroller.scrollHeight - scroller.clientHeight - previousTail;
  const tail = overflow > 0 ? (grid - (overflow % grid)) % grid : 0;
  root.style.setProperty('--bp-scroll-tail', `${tail}px`);
}

/**
 * Aligns a page container's multi-column rows and variable-height blocks
 * to the 32px (--grid) drafting grid so every horizontal and vertical border
 * coincides with the fixed blueprint grid lines.
 */
export function useBlueprintGrid(deps?: React.DependencyList): React.RefObject<HTMLElement | null> {
  const containerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    let frame = 0;
    let applying = false;
    const scroller = root.closest<HTMLElement>('.app-shell-content');

    const align = () => {
      if (applying || !root.isConnected) return;
      applying = true;

      const grid = resolveGridUnit();
      const vw = window.innerWidth;

      quantizeGridRows(root, grid, vw);
      snapVariableHeightCells(root, grid);
      alignTopEdgesToGrid(root, grid);
      snapFillGridEditors(root, grid);
      updateScrollerTail(root, scroller, grid);

      applying = false;
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(align);
    };

    align();
    document.fonts?.ready?.then(schedule);

    let lastWidth = root.clientWidth;
    let lastHeight = root.clientHeight;
    let lastVh = window.innerHeight;
    const ro = new ResizeObserver(() => {
      const changed =
        root.clientWidth !== lastWidth ||
        root.clientHeight !== lastHeight ||
        window.innerHeight !== lastVh;
      if (changed) {
        lastWidth = root.clientWidth;
        lastHeight = root.clientHeight;
        lastVh = window.innerHeight;
        schedule();
      }
    });
    ro.observe(root);
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, deps || []);

  return containerRef;
}
