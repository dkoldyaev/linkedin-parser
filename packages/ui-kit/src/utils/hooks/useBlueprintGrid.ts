import { type RefObject, useLayoutEffect, useRef } from 'react';
import { BREAKPOINT_TOKENS } from '../../tokens';
import { GRID_CELL_PX } from '../grid';

export type UseBlueprintGridDepends = readonly unknown[];

export interface UseBlueprintGridOptions {
  readonly deps?: UseBlueprintGridDepends;
  readonly enabled?: boolean;
  /**
   * When true, observes DOM subtree mutations and scrollHeight changes
   * to re-snap height when nested collapsible elements expand or collapse.
   * @default false
   */
  readonly observeSubtree?: boolean;
}

function resolveGridCellPx(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return GRID_CELL_PX;
  }
  const styles = window.getComputedStyle(document.documentElement);
  const rawUiGrid =
    styles.getPropertyValue('--ui-grid-cell') || styles.getPropertyValue('--ui-grid');
  const parsed = Number.parseFloat(rawUiGrid);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : GRID_CELL_PX;
}

/**
 * Aligns a container's multi-column rows (`[data-ui-grid-row][data-cols]`, `.bp-grid-row[data-cols]`),
 * variable-height blocks (`[data-ui-snap]`, `[data-bp-snap]`, `.bp-snap`), top-aligned elements (`[data-grid-top]`),
 * and full-height areas (`[data-ui-fill-grid]`, `.bp-fill-grid`) to exact multiples of the 32px (`--ui-grid-cell`)
 * Blueprint drafting grid so every horizontal and vertical border coincides with the grid lines.
 *
 * @param depsOrOptions - Dependency array or options object triggering re-measurement
 */
export function useBlueprintGrid<T extends HTMLElement>(
  depsOrOptions?: UseBlueprintGridDepends | UseBlueprintGridOptions,
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);

  const isArray = Array.isArray(depsOrOptions);
  const deps: readonly unknown[] = isArray
    ? (depsOrOptions as readonly unknown[])
    : depsOrOptions !== undefined && (depsOrOptions as UseBlueprintGridOptions).deps !== undefined
      ? ((depsOrOptions as UseBlueprintGridOptions).deps as readonly unknown[])
      : [];

  const isEnabled =
    !isArray &&
    depsOrOptions !== undefined &&
    typeof (depsOrOptions as UseBlueprintGridOptions).enabled === 'boolean'
      ? Boolean((depsOrOptions as UseBlueprintGridOptions).enabled)
      : true;

  const observeSubtree =
    !isArray &&
    depsOrOptions !== undefined &&
    typeof (depsOrOptions as UseBlueprintGridOptions).observeSubtree === 'boolean'
      ? Boolean((depsOrOptions as UseBlueprintGridOptions).observeSubtree)
      : false;

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
    const scroller = root.closest<HTMLElement>('[data-ui-scroller], [data-bp-scroller]');

    const align = () => {
      if (applying || !root.isConnected) {
        return;
      }
      applying = true;

      const grid = resolveGridCellPx();
      const vw = window.innerWidth;

      // 1. Quantize column widths on grid rows so vertical dividers land on 32px lines
      const rows = Array.from(
        root.querySelectorAll<HTMLElement>(
          '[data-ui-grid-row][data-cols], .bp-grid-row[data-cols]',
        ),
      );
      for (const row of rows) {
        const rawMaxCols = Number.parseInt(row.getAttribute('data-cols') ?? '1', 10);
        const maxCols = Number.isFinite(rawMaxCols) && rawMaxCols > 0 ? rawMaxCols : 1;
        let cols = maxCols;

        if (vw <= BREAKPOINT_TOKENS.boardCompact) {
          cols = 1;
        } else if (vw <= BREAKPOINT_TOKENS.desktopSm) {
          const rawTabletCols = Number.parseInt(row.getAttribute('data-tablet-cols') ?? '2', 10);
          const tabletCols =
            Number.isFinite(rawTabletCols) && rawTabletCols > 0 ? rawTabletCols : 2;
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

      // 2. Snap variable-height cells ([data-ui-snap], [data-bp-snap], .bp-snap) to exact multiples of 32px
      const snapSelector = '[data-ui-snap], [data-bp-snap], .bp-snap';
      const snaps = Array.from(root.querySelectorAll<HTMLElement>(snapSelector));
      if (root.matches(snapSelector)) {
        snaps.push(root);
      }
      for (const el of snaps) {
        el.style.minHeight = '';
        if (el.hasAttribute('data-bp-snap-height')) {
          el.style.height = '';
        }
      }

      snaps.sort((a, b) => {
        let depthA = 0;
        let depthB = 0;
        for (let node: HTMLElement | null = a; node && node !== root; node = node.parentElement) {
          depthA += 1;
        }
        for (let node: HTMLElement | null = b; node && node !== root; node = node.parentElement) {
          depthB += 1;
        }
        return depthB - depthA;
      });

      for (const el of snaps) {
        const rawMinGrids = Number.parseInt(el.getAttribute('data-min-grids') ?? '1', 10);
        const minGrids = Number.isFinite(rawMinGrids) && rawMinGrids > 0 ? rawMinGrids : 1;
        const measuredHeight = el.offsetHeight;
        let snappedHeight = Math.max(minGrids * grid, Math.ceil(measuredHeight / grid) * grid);
        const maxHeightStr = window.getComputedStyle(el).maxHeight;
        const maxHeightPx = Number.parseFloat(maxHeightStr);
        if (Number.isFinite(maxHeightPx) && maxHeightPx > 0) {
          const quantizedMax = Math.floor(maxHeightPx / grid) * grid;
          if (quantizedMax > 0 && snappedHeight > quantizedMax) {
            snappedHeight = quantizedMax;
          }
        }
        el.style.minHeight = `${snappedHeight}px`;
        if (el.hasAttribute('data-bp-snap-height')) {
          el.style.height = `${snappedHeight}px`;
        }
      }

      // 2b. Snap horizontal control widths ([data-ui-snap-width], [data-bp-snap-width], .bp-snap-width) to multiples of 32px
      const widthSnapSelector = '[data-ui-snap-width], [data-bp-snap-width], .bp-snap-width';
      const widthSnaps = Array.from(root.querySelectorAll<HTMLElement>(widthSnapSelector));
      if (root.matches(widthSnapSelector)) {
        widthSnaps.push(root);
      }
      for (const el of widthSnaps) {
        el.style.width = '';
        const measuredWidth = el.offsetWidth;
        if (measuredWidth > 0) {
          const snappedWidth = Math.ceil((measuredWidth - 0.01) / grid) * grid;
          el.style.width = `${snappedWidth}px`;
        }
      }

      // 3. Align [data-grid-top] top edges to the fixed viewport 32px grid
      const topAligned = Array.from(root.querySelectorAll<HTMLElement>('[data-grid-top]'));
      if (root.matches('[data-grid-top]')) {
        topAligned.push(root);
      }
      for (const el of topAligned) {
        el.style.marginTop = '';
        const computedMargin = Number.parseFloat(window.getComputedStyle(el).marginTop);
        const baseMargin = Number.isFinite(computedMargin) ? computedMargin : 0;
        const top = el.getBoundingClientRect().top;
        const remainder = ((top % grid) + grid) % grid;
        const offset = (grid - remainder) % grid;
        if (offset > 0.5) {
          el.style.marginTop = `${baseMargin + offset}px`;
        }
      }

      // 3b. Align [data-grid-left] left edges to the fixed viewport 32px grid
      const leftAligned = Array.from(root.querySelectorAll<HTMLElement>('[data-grid-left]'));
      if (root.matches('[data-grid-left]')) {
        leftAligned.push(root);
      }
      for (const el of leftAligned) {
        el.style.marginLeft = '';
        const computedMargin = Number.parseFloat(window.getComputedStyle(el).marginLeft);
        const baseMargin = Number.isFinite(computedMargin) ? computedMargin : 0;
        const left = el.getBoundingClientRect().left;
        const remainder = ((left % grid) + grid) % grid;
        const offset = (grid - remainder) % grid;
        if (offset > 0.5) {
          el.style.marginLeft = `${baseMargin + offset}px`;
        }
      }

      // 4. Snap full-height editor areas ([data-ui-fill-grid], .bp-fill-grid) to remaining viewport grid rows
      const fillEls = Array.from(
        root.querySelectorAll<HTMLElement>('[data-ui-fill-grid], .bp-fill-grid'),
      );
      for (const el of fillEls) {
        const rect = el.getBoundingClientRect();
        const available = window.innerHeight - rect.top;
        const rawMinRows = Number.parseInt(el.getAttribute('data-min-grids') ?? '10', 10);
        const minRows = Number.isFinite(rawMinRows) && rawMinRows > 0 ? rawMinRows : 10;
        const snappedH = Math.max(minRows * grid, Math.floor(available / grid) * grid);
        el.style.height = `${snappedH}px`;
      }

      // 5. Preserve access to the end of scroll containers while keeping scroll tail grid-aligned
      if (scroller) {
        const rawPrevTail = Number.parseFloat(root.style.getPropertyValue('--bp-scroll-tail'));
        const previousTail = Number.isFinite(rawPrevTail) ? rawPrevTail : 0;
        const overflow = scroller.scrollHeight - scroller.clientHeight - previousTail;
        const tail = overflow > 0 ? (grid - (overflow % grid)) % grid : 0;
        root.style.setProperty('--bp-scroll-tail', `${tail}px`);
      }

      applying = false;
    };

    let lastWidth = root.clientWidth;
    let lastHeight = root.clientHeight;
    let lastScrollHeight = root.scrollHeight;
    let lastVh = window.innerHeight;

    const updateSnapshots = () => {
      lastWidth = root.clientWidth;
      lastHeight = root.clientHeight;
      lastScrollHeight = root.scrollHeight;
      lastVh = window.innerHeight;
    };

    const runAlign = () => {
      align();
      updateSnapshots();
    };

    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(runAlign);
    };

    runAlign();

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(schedule);
    }

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (applying) return;
            if (
              root.clientWidth !== lastWidth ||
              root.clientHeight !== lastHeight ||
              (observeSubtree && root.scrollHeight !== lastScrollHeight) ||
              window.innerHeight !== lastVh
            ) {
              updateSnapshots();
              schedule();
            }
          })
        : null;

    if (resizeObserver) {
      resizeObserver.observe(root);
    }

    const mutationObserver =
      observeSubtree && typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            if (!applying) {
              schedule();
            }
          })
        : null;

    if (mutationObserver) {
      mutationObserver.observe(root, {
        childList: true,
        subtree: true,
      });
    }

    window.addEventListener('resize', schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      window.removeEventListener('resize', schedule);
    };
  }, [isEnabled, observeSubtree, ...deps]);

  return containerRef;
}
