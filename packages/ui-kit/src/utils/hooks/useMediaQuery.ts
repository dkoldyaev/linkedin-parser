import { useEffect, useState } from 'react';

export interface UseMediaQueryBreakpoints<T> {
  readonly mobile?: T;
  readonly tablet?: T;
  readonly desktop: T;
  readonly wide?: T;
}

/**
 * Responsive media query hook on the Blueprint design system grid.
 *
 * @param config - Object defining values per breakpoint (`mobile`, `tablet`, `desktop`, `wide`).
 *                 `desktop` is required and serves as the baseline/fallback value.
 *
 * Breakpoints:
 * - mobile: < 768px
 * - tablet: 768px - 1023px
 * - desktop: 1024px+
 * - wide: 1440px+
 *
 * @example
 * ```tsx
 * const columns = useMediaQuery({ mobile: 1, tablet: 2, desktop: 4 });
 * ```
 */
export function useMediaQuery<T>(config: UseMediaQueryBreakpoints<T>): T {
  const getBreakpoint = (): 'mobile' | 'tablet' | 'wide' | 'desktop' => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return 'desktop';
    }

    if (config.mobile !== undefined && window.matchMedia('(max-width: 767px)').matches) {
      return 'mobile';
    }
    if (
      config.tablet !== undefined &&
      window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches
    ) {
      return 'tablet';
    }
    if (config.wide !== undefined && window.matchMedia('(min-width: 1440px)').matches) {
      return 'wide';
    }
    return 'desktop';
  };

  const [activeBreakpoint, setActiveBreakpoint] = useState<
    'mobile' | 'tablet' | 'wide' | 'desktop'
  >(() => getBreakpoint());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const queries: { name: 'mobile' | 'tablet' | 'wide'; mql: MediaQueryList }[] = [
      { name: 'mobile', mql: window.matchMedia('(max-width: 767px)') },
      { name: 'tablet', mql: window.matchMedia('(min-width: 768px) and (max-width: 1023px)') },
      { name: 'wide', mql: window.matchMedia('(min-width: 1440px)') },
    ];

    const updateMatches = () => {
      setActiveBreakpoint(getBreakpoint());
    };

    queries.forEach(({ mql }) => mql.addEventListener('change', updateMatches));
    updateMatches();

    return () => {
      queries.forEach(({ mql }) => mql.removeEventListener('change', updateMatches));
    };
  }, [config.mobile, config.tablet, config.desktop, config.wide]);

  if (activeBreakpoint === 'mobile' && config.mobile !== undefined) {
    return config.mobile;
  }
  if (activeBreakpoint === 'tablet' && config.tablet !== undefined) {
    return config.tablet;
  }
  if (activeBreakpoint === 'wide' && config.wide !== undefined) {
    return config.wide;
  }

  return config.desktop;
}
