import { useCallback, useRef, useState } from 'react';

export interface UseControllableStateParams<T> {
  readonly prop?: T;
  readonly defaultProp: T;
  readonly onChange?: (value: T) => void;
}

export type SetStateFn<T> = (prevState: T) => T;

/**
 * Manages state that can be either controlled (via `prop`) or uncontrolled (via `defaultProp`).
 * Calls `onChange` whenever the value transitions.
 */
export function useControllableState<T>(
  params: UseControllableStateParams<T>
): readonly [T, (next: T | SetStateFn<T>) => void] {
  const { prop, defaultProp, onChange } = params;
  const [uncontrolledState, setUncontrolledState] = useState<T>(defaultProp);
  const isControlled = prop !== undefined;
  const currentValue = isControlled ? (prop as T) : uncontrolledState;

  const valueRef = useRef<T>(currentValue);
  valueRef.current = currentValue;

  const onChangeRef = useRef<((value: T) => void) | undefined>(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T | SetStateFn<T>) => {
      const resolvedNext =
        typeof next === 'function'
          ? (next as SetStateFn<T>)(valueRef.current)
          : next;

      if (!Object.is(resolvedNext, valueRef.current)) {
        if (!isControlled) {
          setUncontrolledState(resolvedNext);
        }
        if (onChangeRef.current) {
          onChangeRef.current(resolvedNext);
        }
      }
    },
    [isControlled]
  );

  return [currentValue, setValue] as const;
}
