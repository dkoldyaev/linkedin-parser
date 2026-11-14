export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | { readonly [key: string]: boolean | undefined | null };

/**
 * Combines class names cleanly without external dependencies.
 * Accepts strings, conditional booleans, arrays, and dictionary objects.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) {
      continue;
    }

    if (typeof input === 'string' || typeof input === 'number') {
      const trimmed = String(input).trim();
      if (trimmed.length > 0) {
        classes.push(trimmed);
      }
      continue;
    }

    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested.length > 0) {
        classes.push(nested);
      }
      continue;
    }

    if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (Boolean(value)) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}
