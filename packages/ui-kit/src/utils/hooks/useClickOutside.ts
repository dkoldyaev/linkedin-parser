import { type RefObject, useEffect, useRef } from 'react';

/**
 * Invokes `handler` when a pointer or touch event occurs outside the referenced DOM element.
 *
 * @param ref - React RefObject pointing to the container element
 * @param handler - Callback triggered on outside interaction
 * @param enabled - Optional flag to enable/disable the listener
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled?: boolean
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const isEnabled = enabled !== undefined ? enabled : true;

  useEffect(() => {
    if (!isEnabled || typeof document === 'undefined') {
      return undefined;
    }

    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      const target = event.target as Node | null;
      if (!element || !target || element.contains(target)) {
        return;
      }
      handlerRef.current(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, isEnabled]);
}
