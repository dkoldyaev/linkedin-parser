import React, { useRef } from 'react';
import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  useClickOutside,
  useControllableState,
  useCopyToClipboard,
  useDebounce,
  useDisclosure,
  useFocusTrap,
  useForm,
  useId,
  useKeyboardNavigation,
  useMediaQuery,
} from '../index';

describe('ui-kit hooks', () => {
  describe('useId', () => {
    it('returns explicit id when provided and generates prefixed id otherwise', () => {
      const { result: explicitResult } = renderHook(() =>
        useId('field', 'custom-id')
      );
      expect(explicitResult.current).toBe('custom-id');

      const { result: prefixedResult } = renderHook(() => useId('blueprint'));
      expect(prefixedResult.current.startsWith('blueprint-')).toBe(true);
    });
  });

  describe('useControllableState', () => {
    it('supports uncontrolled and controlled state transitions', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState<number>({
          defaultProp: 10,
          onChange,
        })
      );

      expect(result.current[0]).toBe(10);
      act(() => {
        result.current[1](25);
      });
      expect(result.current[0]).toBe(25);
      expect(onChange).toHaveBeenCalledWith(25);
    });
  });

  describe('useDisclosure', () => {
    it('opens, closes, and toggles state while firing callbacks', () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      const { result } = renderHook(() =>
        useDisclosure({
          defaultIsOpen: false,
          onOpen,
          onClose,
        })
      );

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);
      expect(onOpen).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('useDebounce', () => {
    it('delays updating the value until the timeout elapses', () => {
      vi.useFakeTimers();
      const { result, rerender } = renderHook(
        ({ val }) => useDebounce(val, 250),
        { initialProps: { val: 'initial' } }
      );

      expect(result.current).toBe('initial');
      rerender({ val: 'updated' });
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(result.current).toBe('updated');
      vi.useRealTimers();
    });
  });

  describe('useMediaQuery', () => {
    it('reads matchMedia state and updates on change event', () => {
      let changeListener: ((ev: MediaQueryListEvent) => void) | null = null;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('768px'),
        media: query,
        addEventListener: (
          _type: string,
          cb: (ev: MediaQueryListEvent) => void
        ) => {
          changeListener = cb;
        },
        removeEventListener: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
      expect(result.current).toBe(true);

      act(() => {
        if (changeListener) {
          changeListener({ matches: false } as MediaQueryListEvent);
        }
      });
      expect(result.current).toBe(false);
    });
  });

  describe('useClickOutside', () => {
    it('calls handler only when clicking outside the target element', () => {
      const onOutside = vi.fn();

      function TestHarness(): React.ReactElement {
        const boxRef = useRef<HTMLDivElement | null>(null);
        useClickOutside(boxRef, onOutside, true);
        return (
          <div>
            <div ref={boxRef} data-testid="inside">
              Inside
            </div>
            <button type="button" data-testid="outside">
              Outside
            </button>
          </div>
        );
      }

      const { getByTestId } = render(<TestHarness />);
      fireEvent.mouseDown(getByTestId('inside'));
      expect(onOutside).not.toHaveBeenCalled();

      fireEvent.mouseDown(getByTestId('outside'));
      expect(onOutside).toHaveBeenCalledTimes(1);
    });
  });

  describe('useFocusTrap', () => {
    it('focuses first focusable element and wraps Tab / Shift+Tab', () => {
      function TrapHarness(): React.ReactElement {
        const ref = useRef<HTMLDivElement | null>(null);
        useFocusTrap(ref, true);
        return (
          <div ref={ref} data-testid="trap">
            <button type="button" data-testid="first">
              First
            </button>
            <button type="button" data-testid="last">
              Last
            </button>
          </div>
        );
      }

      const { getByTestId } = render(<TrapHarness />);
      const first = getByTestId('first');
      const last = getByTestId('last');
      const trap = getByTestId('trap');

      expect(document.activeElement).toBe(first);

      last.focus();
      fireEvent.keyDown(trap, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(first);

      first.focus();
      fireEvent.keyDown(trap, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(last);
    });
  });

  describe('useKeyboardNavigation', () => {
    it('navigates items with arrow keys and selects on Enter', () => {
      const onSelect = vi.fn();
      const items = ['Alpha', 'Beta', 'Gamma'] as const;

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          items,
          initialIndex: 0,
          loop: true,
          orientation: 'vertical',
          onSelect,
        })
      );

      const makeKeyEvent = (key: string) =>
        ({
          key,
          preventDefault: vi.fn(),
        }) as unknown as React.KeyboardEvent<HTMLElement>;

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('ArrowDown'));
      });
      expect(result.current.activeIndex).toBe(1);

      act(() => {
        result.current.handleKeyDown(makeKeyEvent('Enter'));
      });
      expect(onSelect).toHaveBeenCalledWith('Beta', 1);
    });
  });

  describe('useForm', () => {
    it('validates fields and submits when valid', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm({
          initialValues: { title: '' },
          validate: (vals) =>
            vals.title.trim().length === 0 ? { title: 'Required' } : {},
          onSubmit,
        })
      );

      let success = false;
      await act(async () => {
        success = await result.current.handleSubmit();
      });
      expect(success).toBe(false);
      expect(result.current.errors.title).toBe('Required');
      expect(onSubmit).not.toHaveBeenCalled();

      act(() => {
        result.current.setFieldValue('title', 'Applied');
      });

      await act(async () => {
        success = await result.current.handleSubmit();
      });
      expect(success).toBe(true);
      expect(onSubmit).toHaveBeenCalledWith({ title: 'Applied' });
    });
  });

  describe('useCopyToClipboard', () => {
    it('copies text via navigator.clipboard and sets isCopied', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      const { result } = renderHook(() => useCopyToClipboard(1000));
      await act(async () => {
        await result.current.copy('--ui-color-accent-primary');
      });

      expect(writeText).toHaveBeenCalledWith('--ui-color-accent-primary');
      expect(result.current.isCopied).toBe(true);
      expect(result.current.copiedValue).toBe('--ui-color-accent-primary');
    });
  });
});
