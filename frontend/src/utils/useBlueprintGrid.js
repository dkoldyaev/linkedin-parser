import { useLayoutEffect, useRef } from 'react';

/**
 * Aligns a page container's multi-column rows and variable-height blocks
 * to the 32px (--grid) drafting grid so every horizontal and vertical border
 * coincides with the fixed blueprint grid lines.
 */
export function useBlueprintGrid(deps = []) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let frame = 0;
    let applying = false;
    const scroller = root.closest('.app-shell-content');

    const align = () => {
      if (applying || !root.isConnected) return;
      applying = true;

      const grid =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
      const vw = window.innerWidth;

      // 1. Quantize column widths on .bp-grid-row[data-cols] so vertical dividers land on 32px lines
      const rows = Array.from(root.querySelectorAll('.bp-grid-row[data-cols]'));
      for (const row of rows) {
        const maxCols = parseInt(row.getAttribute('data-cols'), 10) || 1;
        let cols = maxCols;
        if (vw <= 700) {
          cols = 1;
        } else if (vw <= 1024) {
          const tabletCols = parseInt(row.getAttribute('data-tablet-cols'), 10);
          cols = Math.min(maxCols, tabletCols || 2);
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

      // 2. Snap variable-height cells (.bp-snap and .column-header) to exact multiples of 32px
      const snaps = Array.from(root.querySelectorAll('.bp-snap, .column-header'));
      for (const el of snaps) {
        el.style.minHeight = '';
      }
      // Size nested headers/copy before their containing cards, so a parent's
      // measured height includes the final grid-aligned dimensions of its children.
      snaps.sort((a, b) => {
        let depthA = 0;
        let depthB = 0;
        for (let node = a; node && node !== root; node = node.parentElement) depthA++;
        for (let node = b; node && node !== root; node = node.parentElement) depthB++;
        return depthB - depthA;
      });
      for (const el of snaps) {
        const minGrids = parseInt(el.getAttribute('data-min-grids'), 10) || 1;
        const h = el.offsetHeight;
        const height = Math.max(minGrids * grid, Math.ceil(h / grid) * grid);
        el.style.minHeight = `${height}px`;
      }

      // Align selected content edges (for example, hero actions) to the fixed
      // viewport grid without changing the dimensions of their controls.
      const topAligned = Array.from(root.querySelectorAll('[data-grid-top]'));
      for (const el of topAligned) {
        el.style.marginTop = '';
        const baseMargin = parseFloat(getComputedStyle(el).marginTop) || 0;
        const top = el.getBoundingClientRect().top;
        const remainder = ((top % grid) + grid) % grid;
        const offset = (grid - remainder) % grid;
        if (offset > 0.5) el.style.marginTop = `${baseMargin + offset}px`;
      }

      // 3. If there is a full-height editor area (.bp-fill-grid), snap its height to remaining viewport grid rows
      const fillEls = Array.from(root.querySelectorAll('.bp-fill-grid'));
      for (const el of fillEls) {
        const rect = el.getBoundingClientRect();
        const available = window.innerHeight - rect.top;
        const minRows = parseInt(el.getAttribute('data-min-grids'), 10) || 10;
        const snappedH = Math.max(minRows * grid, Math.floor(available / grid) * grid);
        el.style.height = `${snappedH}px`;
      }

      // Preserve access to the end while making it a grid-aligned scroll position.
      if (scroller) {
        const previousTail = parseFloat(root.style.getPropertyValue('--bp-scroll-tail')) || 0;
        const overflow = scroller.scrollHeight - scroller.clientHeight - previousTail;
        const tail = overflow > 0 ? (grid - (overflow % grid)) % grid : 0;
        root.style.setProperty('--bp-scroll-tail', `${tail}px`);
      }

      applying = false;
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(align);
    };

    align();
    // Web fonts can load after the first layout and change text wrapping.
    // Re-run the grid pass once their final metrics are available.
    document.fonts?.ready?.then(schedule);

    let lastWidth = root.clientWidth;
    let lastHeight = root.clientHeight;
    let lastVh = window.innerHeight;
    const ro = new ResizeObserver(() => {
      if (root.clientWidth !== lastWidth || root.clientHeight !== lastHeight || window.innerHeight !== lastVh) {
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
  }, deps);

  return containerRef;
}
