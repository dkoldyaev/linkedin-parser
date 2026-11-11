import { type RefObject, useLayoutEffect, useRef } from 'react';
import { GRID_CELL_PX } from '../utils';

export interface UseBlueprintGridOptions {
  readonly deps?: readonly unknown[];
  readonly enabled?: boolean;
}

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
 * Aligns a container's multi-column rows (`.bp-grid-row[data-cols]`), variable-height blocks
 * (`.bp-snap`, `.column-header`, `[data-bp-snap]`), top-aligned elements (`[data-grid-top]`),
 * and full-height areas (`.bp-fill-grid`) to exact multiples of the 32px (`--ui-grid-cell`)
 * Blueprint drafting grid so every horizontal and vertical border coincides with the grid lines.
 *
 * @param depsOrOptions - Dependency array or options object triggering re-measurement
 */
export function useBlueprintGrid<T extends HTMLElement = HTMLDivElement>(
  depsOrOptions?: readonly unknown[] | UseBlueprintGridOptions
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);

  const isArray = Array.isArray(depsOrOptions);
  const deps: readonly unknown[] = isArray
    ? (depsOrOptions as readonly unknown[])
    : depsOrOptions !== undefined &&
        (depsOrOptions as UseBlueprintGridOptions).deps !== undefined
      ? ((depsOrOptions as UseBlueprintGridOptions).deps as readonly unknown[])
      : [];

  const isEnabled =
    !isArray &&
    depsOrOptions !== undefined &&
    typeof (depsOrOptions as UseBlueprintGridOptions).enabled === 'boolean'
      ? Boolean((depsOrOptions as UseBlueprintGridOptions).enabled)
      : true;

  useLayoutEffect(() => {
    if (!isEnabled || typeof window === 'undefined') {
      return undefined;
    }

    const root = containerRef.current;
    if (!root) {
      return undefined;
    }

    let frame = 0;
    let applying = false;
    const scroller = root.closest<HTMLElement>(
      '.app-shell-content, [data-bp-scroller]'
    );

    const align = () => {
      if (applying || !root.isConnected) {
        return;
      }
      applying = true;

      const grid = resolveGridCellPx();
      const vw = window.innerWidth;

      // 1. Quantize column widths on .bp-grid-row[data-cols] so vertical dividers land on 32px lines
      const rows = Array.from(
        root.querySelectorAll<HTMLElement>('.bp-grid-row[data-cols]')
      );
      for (const row of rows) {
        const rawMaxCols = Number.parseInt(
          row.getAttribute('data-cols') ?? '1',
          10
        );
        const maxCols =
          Number.isFinite(rawMaxCols) && rawMaxCols > 0 ? rawMaxCols : 1;
        let cols = maxCols;

        if (vw <= 700) {
          cols = 1;
        } else if (vw <= 1024) {
          const rawTabletCols = Number.parseInt(
            row.getAttribute('data-tablet-cols') ?? '2',
            10
          );
          const tabletCols =
            Number.isFinite(rawTabletCols) && rawTabletCols > 0
              ? rawTabletCols
              : 2;
          cols = Math.min(maxCols, tabletCols);
        }

        if (cols <= 1) {
          row.style.gridTemplateColumns = 'minmax(0, 1fr)';
        } else {
          const totalW = row.clientWidth;
          const rawCol = totalW / cols;
          const colW = Math.max(grid * 6, Math.floor(rawCol / grid) * grid);
          row.style.gridTemplateColumns = `repeat(${cols - 1}, ${colW}px) minmax(0, 1fr)`;
        }
      }

      // 2. Snap variable-height cells (.bp-snap, [data-bp-snap], .column-header) to exact multiples of 32px
      const snaps = Array.from(
        root.querySelectorAll<HTMLElement>(
          '.bp-snap, [data-bp-snap], .column-header'
        )
      );
      for (const el of snaps) {
        el.style.minHeight = '';
      }

      // Measure deepest nested children before parent containers
      snaps.sort((a, b) => {
        let depthA = 0;
        let depthB = 0;
        for (
          let node: HTMLElement | null = a;
          node && node !== root;
          node = node.parentElement
        ) {
          depthA += 1;
        }
        for (
          let node: HTMLElement | null = b;
          node && node !== root;
          node = node.parentElement
        ) {
          depthB += 1;
        }
        return depthB - depthA;
      });

      for (const el of snaps) {
        const rawMinGrids = Number.parseInt(
          el.getAttribute('data-min-grids') ?? '1',
          10
        );
        const minGrids =
          Number.isFinite(rawMinGrids) && rawMinGrids > 0 ? rawMinGrids : 1;
        const measuredHeight = el.offsetHeight;
        const snappedHeight = Math.max(
          minGrids * grid,
          Math.ceil(measuredHeight / grid) * grid
        );
        el.style.minHeight = `${snappedHeight}px`;
      }

      // 3. Align [data-grid-top] top edges to the fixed viewport 32px grid
      const topAligned = Array.from(
        root.querySelectorAll<HTMLElement>('[data-grid-top]')
      );
      for (const el of topAligned) {
        el.style.marginTop = '';
        const computedMargin = Number.parseFloat(
          window.getComputedStyle(el).marginTop
        );
        const baseMargin = Number.isFinite(computedMargin) ? computedMargin : 0;
        const top = el.getBoundingClientRect().top;
        const remainder = ((top % grid) + grid) % grid;
        const offset = (grid - remainder) % grid;
        if (offset > 0.5) {
          el.style.marginTop = `${baseMargin + offset}px`;
        }
      }

      // 4. Snap full-height editor areas (.bp-fill-grid) to remaining viewport grid rows
      const fillEls = Array.from(
        root.querySelectorAll<HTMLElement>('.bp-fill-grid')
      );
      for (const el of fillEls) {
        const rect = el.getBoundingClientRect();
        const available = window.innerHeight - rect.top;
        const rawMinRows = Number.parseInt(
          el.getAttribute('data-min-grids') ?? '10',
          10
        );
        const minRows =
          Number.isFinite(rawMinRows) && rawMinRows > 0 ? rawMinRows : 10;
        const snappedH = Math.max(
          minRows * grid,
          Math.floor(available / grid) * grid
        );
        el.style.height = `${snappedH}px`;
      }

      // 5. Preserve access to the end of scroll containers while keeping scroll tail grid-aligned
      if (scroller) {
        const rawPrevTail = Number.parseFloat(
          root.style.getPropertyValue('--bp-scroll-tail')
        );
        const previousTail = Number.isFinite(rawPrevTail) ? rawPrevTail : 0;
        const overflow =
          scroller.scrollHeight - scroller.clientHeight - previousTail;
        const tail = overflow > 0 ? (grid - (overflow % grid)) % grid : 0;
        root.style.setProperty('--bp-scroll-tail', `${tail}px`);
      }

      applying = false;
    };

    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(align);
    };

    align();

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(schedule);
    }

    let lastWidth = root.clientWidth;
    let lastHeight = root.clientHeight;
    let lastVh = window.innerHeight;

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (
              root.clientWidth !== lastWidth ||
              root.clientHeight !== lastHeight ||
              window.innerHeight !== lastVh
            ) {
              lastWidth = root.clientWidth;
              lastHeight = root.clientHeight;
              lastVh = window.innerHeight;
              schedule();
            }
          })
        : null;

    if (resizeObserver) {
      resizeObserver.observe(root);
    }
    window.addEventListener('resize', schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', schedule);
    };
  }, [isEnabled, ...deps]);

  return containerRef;
}
