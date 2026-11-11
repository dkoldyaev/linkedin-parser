import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCopyToClipboardReturn {
  readonly copiedValue: string | null;
  readonly isCopied: boolean;
  readonly copy: (text: string) => Promise<boolean>;
}

/**
 * Copies text to the clipboard and resets `isCopied` after `resetDelayMs` milliseconds.
 * Used in VacancyModal, ExtensionPromptModal, and Storybook token swatches.
 */
export function useCopyToClipboard(
  resetDelayMs?: number
): UseCopyToClipboardReturn {
  const delay = resetDelayMs !== undefined ? resetDelayMs : 2000;
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== 'function'
      ) {
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopiedValue(text);

        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }

        if (delay > 0) {
          timerRef.current = window.setTimeout(() => {
            setCopiedValue(null);
          }, delay);
        }

        return true;
      } catch {
        setCopiedValue(null);
        return false;
      }
    },
    [delay]
  );

  return {
    copiedValue,
    isCopied: copiedValue !== null,
    copy,
  };
}
