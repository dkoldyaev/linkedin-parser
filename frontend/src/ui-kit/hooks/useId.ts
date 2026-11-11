import { useId as useReactId } from 'react';

/**
 * Generates a deterministic, accessible DOM identifier with an optional prefix.
 * Wraps React 19's `useId` so components can link `htmlFor`, `aria-describedby`, and `aria-labelledby`.
 *
 * @param prefixOrExplicitId - Optional prefix string or explicit ID override
 */
export function useId(prefixOrExplicitId?: string, explicitId?: string): string {
  const reactId = useReactId();

  if (typeof explicitId === 'string' && explicitId.trim().length > 0) {
    return explicitId.trim();
  }

  const sanitizedReactId = reactId.replace(/:/g, '');
  if (typeof prefixOrExplicitId === 'string' && prefixOrExplicitId.trim().length > 0) {
    return `${prefixOrExplicitId.trim()}-${sanitizedReactId}`;
  }

  return `ui-${sanitizedReactId}`;
}
