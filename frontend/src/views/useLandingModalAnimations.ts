'use client';

import React, { useState, useEffect } from 'react';

function buildSalaryTypingSequence(vMin: string, vMax: string) {
  const minPart1 = vMin.slice(0, Math.max(1, Math.floor(vMin.length / 3)));
  const minPart2 = vMin.slice(0, Math.max(2, Math.floor((2 * vMin.length) / 3)));
  const maxPart1 = vMax.slice(0, Math.max(1, Math.floor(vMax.length / 3)));
  const maxPart2 = vMax.slice(0, Math.max(2, Math.floor((2 * vMax.length) / 3)));

  return [
    { delay: 0, min: '', max: '', step: 1 },
    { delay: 180, min: minPart1, max: '', step: 1 },
    { delay: 340, min: minPart2, max: '', step: 2 },
    { delay: 500, min: vMin, max: '', step: 3 },
    { delay: 700, min: vMin, max: maxPart1, step: 4 },
    { delay: 860, min: vMin, max: maxPart2, step: 5 },
    { delay: 1020, min: vMin, max: vMax, step: 6 },
    { delay: 1200, min: vMin, max: vMax, step: 10 },
  ];
}

function useSalaryTypingEffect(subScreenId: string, vMin: string, vMax: string) {
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryTypingStep, setSalaryTypingStep] = useState(0);

  useEffect(() => {
    if (subScreenId !== '2.1') {
      const resetTimer = setTimeout(() => {
        setSalaryMin(vMin);
        setSalaryMax(vMax);
        setSalaryTypingStep(10);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const sequence = buildSalaryTypingSequence(vMin, vMax);
    const timers = sequence.map((item) =>
      setTimeout(() => {
        setSalaryMin(item.min);
        setSalaryMax(item.max);
        setSalaryTypingStep(item.step);
      }, item.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [subScreenId, vMin, vMax]);

  return { salaryMin, salaryMax, salaryTypingStep };
}

function startSummaryTypingInterval(
  fullLen: number,
  setSummaryTypedChars: React.Dispatch<React.SetStateAction<number>>,
  intervalRef: { current: ReturnType<typeof setInterval> | null }
) {
  intervalRef.current = setInterval(() => {
    setSummaryTypedChars((prev) => {
      if (prev >= fullLen) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return fullLen;
      }
      return Math.min(fullLen, prev + 5);
    });
  }, 16);
}

function useSummaryTypingEffect(subScreenId: string, summaryText: string) {
  const [summaryTypedChars, setSummaryTypedChars] = useState(0);

  useEffect(() => {
    const fullLen = summaryText.length;
    if (subScreenId !== '2.3') {
      const isBefore23 = subScreenId === '2.1' || subScreenId === '2.2';
      const timer = setTimeout(() => {
        setSummaryTypedChars(isBefore23 ? 0 : fullLen);
      }, 0);
      return () => clearTimeout(timer);
    }

    const initTimer = setTimeout(() => {
      setSummaryTypedChars(0);
    }, 0);

    const intervalRef: { current: ReturnType<typeof setInterval> | null } = { current: null };
    const startTypingTimer = setTimeout(() => {
      startSummaryTypingInterval(fullLen, setSummaryTypedChars, intervalRef);
    }, 220);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(startTypingTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [subScreenId, summaryText]);

  return summaryTypedChars;
}

function useCompatPrintEffect(subScreenId: string, isReverse: boolean) {
  const [visibleMatchCount, setVisibleMatchCount] = useState(3);
  const [visibleMissingCount, setVisibleMissingCount] = useState(2);
  const [visibleCriticalCount, setVisibleCriticalCount] = useState(1);
  const [visibleRecsCount, setVisibleRecsCount] = useState(3);

  useEffect(() => {
    if (subScreenId === '3.1') {
      if (isReverse) {
        const keepTimer = setTimeout(() => {
          setVisibleMatchCount(3);
          setVisibleMissingCount(2);
          setVisibleCriticalCount(0);
          setVisibleRecsCount(0);
        }, 0);
        return () => clearTimeout(keepTimer);
      }

      const timers = [
        setTimeout(() => {
          setVisibleMatchCount(0);
          setVisibleMissingCount(0);
          setVisibleCriticalCount(0);
          setVisibleRecsCount(0);
        }, 0),
        setTimeout(() => setVisibleMatchCount(1), 140),
        setTimeout(() => setVisibleMatchCount(2), 320),
        setTimeout(() => setVisibleMatchCount(3), 500),
        setTimeout(() => setVisibleMissingCount(1), 720),
        setTimeout(() => setVisibleMissingCount(2), 920),
      ];
      return () => timers.forEach(clearTimeout);
    }

    if (subScreenId === '3.2') {
      const timers = [
        setTimeout(() => {
          setVisibleMatchCount(3);
          setVisibleMissingCount(2);
          setVisibleCriticalCount(0);
          setVisibleRecsCount(0);
        }, 0),
        setTimeout(() => setVisibleCriticalCount(1), 180),
        setTimeout(() => setVisibleRecsCount(1), 440),
        setTimeout(() => setVisibleRecsCount(2), 700),
        setTimeout(() => setVisibleRecsCount(3), 960),
      ];
      return () => timers.forEach(clearTimeout);
    }
    return undefined;
  }, [subScreenId, isReverse]);

  return { visibleMatchCount, visibleMissingCount, visibleCriticalCount, visibleRecsCount };
}

export function useLandingModalAnimations(args: {
  subScreenId: string;
  isReverse: boolean;
  vMin: string;
  vMax: string;
  summaryText: string;
  modalBodyRef: React.RefObject<HTMLDivElement | null>;
  bloatSectionRef: React.RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    const body = args.modalBodyRef.current;
    const bloatEl = args.bloatSectionRef.current;
    if (args.subScreenId === '2.2' && bloatEl) {
      bloatEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (body) {
        const targetTop = bloatEl.offsetTop - body.offsetTop;
        body.scrollTo({ top: Math.max(0, targetTop - 8), behavior: 'smooth' });
      }
    } else if (args.subScreenId === '2.1' && body) {
      body.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [args.subScreenId, args.modalBodyRef, args.bloatSectionRef]);

  const salaryAnim = useSalaryTypingEffect(args.subScreenId, args.vMin, args.vMax);
  const summaryTypedChars = useSummaryTypingEffect(args.subScreenId, args.summaryText);
  const compatAnim = useCompatPrintEffect(args.subScreenId, args.isReverse);

  return {
    ...salaryAnim,
    summaryTypedChars,
    ...compatAnim,
  };
}
