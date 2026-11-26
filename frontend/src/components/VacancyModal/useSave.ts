import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'saving' | 'error' | 'success' | null;

export interface UseSaveOptions {
  resetDelay?: number;
}

export function useSave<TData>(
  promiseFn?: (data: TData) => Promise<void>,
  options?: UseSaveOptions,
): [(data: TData) => Promise<void>, SaveStatus] {
  const { resetDelay = 1500 } = options || {};
  const [status, setStatus] = useState<SaveStatus>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setStatus(null);
      }, resetDelay);
    }
  }, [status, resetDelay]);

  const execute = useCallback(
    async (data: TData) => {
      if (!promiseFn) return;
      setStatus('saving');
      try {
        await promiseFn(data);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        throw err;
      }
    },
    [promiseFn],
  );

  return [execute, status];
}
