import { useEffect, useState } from 'react';

/**
 * Subscribes to a CSS media query string and returns whether it currently matches.
 * Safe for SSR and test environments where `window.matchMedia` may be absent.
 *
 * @param query - Media query string, e.g. `(max-width: 768px)`
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = (mediaQuery: string): boolean => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return false;
    }
    return window.matchMedia(mediaQuery).matches;
  };

  const [matches, setMatches] = useState<boolean>(() => getMatches(query));

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener('change', handleChange);
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
