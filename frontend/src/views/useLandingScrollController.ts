
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  SUB_SCREENS,
  SUB_SCROLL_TARGETS,
  getSubScreenIdxFromRatio,
  getImportStageFromRatio,
  getFunnelStageFromRatio,
} from './landingConstants';

export interface LandingScrollState {
  idx: number;
  prevIdx: number;
  importStage: number;
  funnelStage: number;
  prevFunnelStage: number;
  targetFunnelStage: number;
}

function computeNextFunnelStep(
  prev: LandingScrollState,
  nextIdx: number,
  nextTargetFunnel: number
): { nextFunnel: number; nextPrevFunnel: number } {
  if (nextIdx === 0) {
    return { nextFunnel: 0, nextPrevFunnel: 0 };
  }
  if (nextTargetFunnel !== prev.funnelStage) {
    const diff = nextTargetFunnel - prev.funnelStage;
    const nextFunnel =
      Math.abs(diff) <= 1 ? nextTargetFunnel : prev.funnelStage + Math.sign(diff);
    return { nextFunnel, nextPrevFunnel: prev.funnelStage };
  }
  return { nextFunnel: prev.funnelStage, nextPrevFunnel: prev.prevFunnelStage };
}

function computeNextScrollState(
  prev: LandingScrollState,
  nextIdx: number,
  nextImportStage: number,
  nextTargetFunnel: number
): LandingScrollState {
  const unchanged =
    prev.idx === nextIdx &&
    prev.importStage === nextImportStage &&
    prev.targetFunnelStage === nextTargetFunnel;
  if (unchanged) return prev;

  const { nextFunnel, nextPrevFunnel } = computeNextFunnelStep(
    prev,
    nextIdx,
    nextTargetFunnel
  );

  return {
    idx: nextIdx,
    prevIdx: prev.idx !== nextIdx ? prev.idx : prev.prevIdx,
    importStage: nextImportStage,
    funnelStage: nextFunnel,
    prevFunnelStage: nextPrevFunnel,
    targetFunnelStage: nextTargetFunnel,
  };
}

function applyExitProgressStyles(
  root: HTMLElement,
  ratio: number,
  transitionedRef: React.MutableRefObject<boolean>,
  finishToBoard: () => void
) {
  const exitProgress =
    ratio <= 7.25 ? 0 : Math.min(1, Math.max(0, (ratio - 7.25) / 0.9));

  root.style.setProperty('--exit-progress', exitProgress.toFixed(3));

  if (exitProgress > 0) {
    root.classList.add('is-exiting');
    const baseLeftWidth = parseFloat(root.dataset.baseLeftWidth || '0');
    const curLeftPx = Math.max(0, Math.round(baseLeftWidth * (1 - exitProgress)));
    root.style.setProperty('--landing-left-current-width', `${curLeftPx}px`);

    if (exitProgress >= 0.98 && !transitionedRef.current) {
      transitionedRef.current = true;
      finishToBoard();
    }
  } else {
    root.classList.remove('is-exiting');
    root.style.removeProperty('--landing-left-current-width');
    if (ratio < 7.0) {
      transitionedRef.current = false;
    }
  }
}

function getCssGridSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
}

function updateElementGridWidths(root: HTMLElement) {
  if (window.innerWidth <= 1024) {
    root.dataset.baseLeftWidth = '0';
    root.style.removeProperty('--landing-left-width');
    root.style.removeProperty('--landing-col-width');
    return;
  }
  const grid = getCssGridSize();
  const totalWidth = root.clientWidth;
  const totalUnits = Math.max(28, Math.floor(totalWidth / grid));
  const idealLeft = totalWidth <= 1360 ? 13 : 15;
  const candidates = [idealLeft, idealLeft - 1, idealLeft + 1, idealLeft - 2, idealLeft + 2];
  const leftUnits =
    candidates.find((L) => (totalUnits - L) % 4 === 0) ?? idealLeft;
  const colUnits = Math.max(5, Math.floor((totalUnits - leftUnits) / 4));
  const leftPx = leftUnits * grid;

  root.dataset.baseLeftWidth = String(leftPx);
  root.style.setProperty('--landing-left-width', `${leftPx}px`);
  root.style.setProperty('--landing-col-width', `${colUnits * grid}px`);
}

function computeStageHeightPx(): number {
  const grid = getCssGridSize();
  if (window.innerWidth <= 1024) {
    return Math.max(240, window.innerHeight - 285 - 48);
  }
  return Math.max(grid * 12, window.innerHeight - grid * 2);
}

function resolveSubScreenIndex(subIdOrIdx: string | number): number {
  if (typeof subIdOrIdx === 'number') return subIdOrIdx;
  return SUB_SCREENS.findIndex((s) => s.id === subIdOrIdx);
}

function computeSnappedScrollTop(idx: number): number {
  const targetRatio = SUB_SCROLL_TARGETS[idx] ?? 0;
  if (targetRatio <= 0) return 0;
  const grid = getCssGridSize();
  const stageH = computeStageHeightPx();
  return Math.max(0, Math.round((targetRatio * stageH) / grid) * grid);
}

function useSequentialFunnelStepper(
  scrollState: LandingScrollState,
  setScrollState: React.Dispatch<React.SetStateAction<LandingScrollState>>
) {
  useEffect(() => {
    if (scrollState.funnelStage === scrollState.targetFunnelStage) return undefined;
    const timer = setTimeout(() => {
      setScrollState((prev) => {
        if (prev.funnelStage === prev.targetFunnelStage) return prev;
        const step = Math.sign(prev.targetFunnelStage - prev.funnelStage);
        return {
          ...prev,
          prevFunnelStage: prev.funnelStage,
          funnelStage: prev.funnelStage + step,
        };
      });
    }, 260);
    return () => clearTimeout(timer);
  }, [scrollState.funnelStage, scrollState.targetFunnelStage, setScrollState]);
}

export function useLandingScrollController(finishToBoard: () => void) {
  const pageRef = useRef<HTMLElement | null>(null);
  const transitionedRef = useRef(false);

  const [scrollState, setScrollState] = useState<LandingScrollState>({
    idx: 0,
    prevIdx: 0,
    importStage: 0,
    funnelStage: 0,
    prevFunnelStage: 0,
    targetFunnelStage: 0,
  });

  useLayoutEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const handleResize = () => updateElementGridWidths(root);
    const observer = new ResizeObserver(handleResize);
    observer.observe(root);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const scroller = root.closest('.app-shell-content') || window;

    const handleScroll = () => {
      const scrollTop =
        scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop;
      const ratio = scrollTop / computeStageHeightPx();
      const nextIdx = getSubScreenIdxFromRatio(ratio);
      const nextImportStage = getImportStageFromRatio(ratio);
      const nextTargetFunnel = getFunnelStageFromRatio(ratio);
      root.dataset.subScreen = SUB_SCREENS[nextIdx]?.id || '1.1';

      applyExitProgressStyles(root, ratio, transitionedRef, finishToBoard);
      setScrollState((prev) =>
        computeNextScrollState(prev, nextIdx, nextImportStage, nextTargetFunnel)
      );
    };

    handleScroll();
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [finishToBoard]);

  useSequentialFunnelStepper(scrollState, setScrollState);

  const scrollToSubScreen = useCallback((subIdOrIdx: string | number) => {
    const idx = resolveSubScreenIndex(subIdOrIdx);
    if (idx < 0) return;
    const scroller = pageRef.current?.closest('.app-shell-content') || window;
    scroller.scrollTo({ top: computeSnappedScrollTop(idx), behavior: 'smooth' });
  }, []);

  return { pageRef, scrollState, scrollToSubScreen };
}
