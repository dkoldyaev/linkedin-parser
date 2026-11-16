import { useCallback } from 'react';
import { useControllableState } from './useControllableState';

export interface UseDisclosureOptions {
  readonly isOpen?: boolean;
  readonly defaultIsOpen?: boolean;
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
  readonly onChange?: (isOpen: boolean) => void;
}

export interface UseDisclosureReturn {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
  readonly setIsOpen: (next: boolean) => void;
}

/**
 * Manages boolean open/close state for modals, drawers, popovers, and collapsible sections.
 * Supports both controlled (`isOpen`) and uncontrolled (`defaultIsOpen`) modes.
 */
export function useDisclosure(options?: UseDisclosureOptions): UseDisclosureReturn {
  const initialDefault =
    options !== undefined && typeof options.defaultIsOpen === 'boolean'
      ? options.defaultIsOpen
      : false;

  const handleStateChange = useCallback(
    (nextOpen: boolean) => {
      if (options?.onChange) {
        options.onChange(nextOpen);
      }
      if (nextOpen) {
        if (options?.onOpen) {
          options.onOpen();
        }
      } else {
        if (options?.onClose) {
          options.onClose();
        }
      }
    },
    [options]
  );

  const [isOpen, setIsOpenState] = useControllableState<boolean>({
    prop: options?.isOpen,
    defaultProp: initialDefault,
    onChange: handleStateChange,
  });

  const open = useCallback(() => {
    setIsOpenState(true);
  }, [setIsOpenState]);

  const close = useCallback(() => {
    setIsOpenState(false);
  }, [setIsOpenState]);

  const toggle = useCallback(() => {
    setIsOpenState((prev) => !prev);
  }, [setIsOpenState]);

  const setIsOpen = useCallback(
    (next: boolean) => {
      setIsOpenState(next);
    },
    [setIsOpenState]
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}
