import { useCallback, useRef, useState } from 'react';

export interface UseControllableStateParams<T> {
  readonly prop?: T;
  readonly defaultProp?: T;
  readonly value?: T;
  readonly defaultValue?: T;
  readonly onChange?: (value: T) => void;
}

export type SetStateFn<T> = (prevState: T) => T;

/**
 * Manages state that can be either controlled (via `prop` or `value`) or uncontrolled (via `defaultProp` or `defaultValue`).
 * Calls `onChange` whenever the value transitions.
 */
export function useControllableState<T>(
  params: UseControllableStateParams<T>
): readonly [T, (next: T | SetStateFn<T>) => void] {
  const controlledProp = params.prop !== undefined ? params.prop : params.value;
  const initialDefault = (
    params.defaultProp !== undefined ? params.defaultProp : params.defaultValue
  ) as T;
  const { onChange } = params;

  const [uncontrolledState, setUncontrolledState] = useState<T>(initialDefault);
  const isControlled = controlledProp !== undefined;
  const currentValue = isControlled ? (controlledProp as T) : uncontrolledState;

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
