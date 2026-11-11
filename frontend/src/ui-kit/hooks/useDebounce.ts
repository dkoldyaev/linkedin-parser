import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly changing value (such as search input in HomePage or AdminPage)
 * by delaying updates until `delayMs` milliseconds have elapsed without changes.
 *
 * @param value - The value to debounce
 * @param delayMs - Delay in milliseconds
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (delayMs <= 0) {
      setDebouncedValue(value);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
