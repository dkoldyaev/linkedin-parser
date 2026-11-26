import { useCallback, useEffect, useRef, useState } from 'react';

export type ContainerQueryRange<T> =
  | { readonly min?: number; readonly max: number; readonly value: T }
  | { readonly min: number; readonly max?: number; readonly value: T };

/**
 * Container query hook measuring element width via ResizeObserver.
 * Returns a callback ref to attach to the observed container and the matching value.
 *
 * @param defaultValue - Fallback value if no range matches or before layout measurement
 * @param ranges - Array of min/max ranges or a single range configuration
 *
 * @example
 * ```tsx
 * const [containerRef, columns] = useContainerQuery(1, [
 *   { min: 400, max: 799, value: 2 },
 *   { min: 800, value: 4 },
 * ]);
 *
 * return <div ref={containerRef}>...</div>;
 * ```
 */
export function useContainerQuery<T, E extends HTMLElement = HTMLDivElement>(
  defaultValue: T,
  ranges: readonly ContainerQueryRange<T>[] | ContainerQueryRange<T>,
): [React.RefCallback<E>, T] {
  const [currentValue, setCurrentValue] = useState<T>(defaultValue);
  const elementRef = useRef<E | null>(null);
  const rangesRef = useRef(ranges);
  rangesRef.current = ranges;
  const defaultValueRef = useRef(defaultValue);
  defaultValueRef.current = defaultValue;

  const matchRanges = useCallback((width: number): T => {
    const list = Array.isArray(rangesRef.current) ? rangesRef.current : [rangesRef.current];

    for (const range of list) {
      const minOk = range.min === undefined || width >= range.min;
      const maxOk = range.max === undefined || width <= range.max;
      if (minOk && maxOk) {
        return range.value;
      }
    }
    return defaultValueRef.current;
  }, []);

  const refCallback = useCallback<React.RefCallback<E>>(
    (node) => {
      elementRef.current = node;
      if (node) {
        const rect = node.getBoundingClientRect();
        if (rect.width > 0) {
          setCurrentValue(matchRanges(rect.width));
        }
      }
    },
    [matchRanges],
  );

  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width =
          entry.borderBoxSize?.[0]?.inlineSize ??
          entry.contentRect?.width ??
          (entry.target as HTMLElement).offsetWidth;
        if (typeof width === 'number') {
          setCurrentValue(matchRanges(width));
        }
      }
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [matchRanges]);

  return [refCallback, currentValue];
}
