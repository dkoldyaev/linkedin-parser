import React, { forwardRef, useEffect, useRef } from 'react';
import type { PaletteTone, SemanticTone } from '../../tokens';
import { cn } from '../../utils';
import styles from './StatusDot.module.css';

export type StatusDotTone = SemanticTone;
export type StatusDotPalette = PaletteTone;
export type StatusDotSize = 'xs' | 'sm' | 'md' | 'lg';

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly tone?: StatusDotTone;
  readonly palette?: StatusDotPalette;
  /** Arbitrary hex/rgb/hsl color code override */
  readonly color?: string;
  readonly size?: StatusDotSize;
  readonly pulse?: boolean;
  readonly glow?: boolean;
  readonly label?: string;
}

/**
 * Atomic StatusDot indicator for connection status, activity indicators, column palette markers,
 * and arbitrary custom hexadecimal status colors.
 */
export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  function StatusDot(
    {
      tone = 'neutral',
      palette,
      color,
      size = 'md',
      pulse = false,
      glow = false,
      label,
      className,
      ...rest
    },
    ref
  ) {
    const internalRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      if (color !== undefined) {
        el.style.setProperty('--bp-dot-color', color);
      } else {
        el.style.removeProperty('--bp-dot-color');
      }
    }, [color]);

    const setRefs = (node: HTMLSpanElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node;
      }
    };

    const resolvedTone = tone === 'accent' ? 'primary' : tone;
    const colorClass =
      color !== undefined
        ? styles.customColor
        : palette !== undefined
          ? styles[`palette-${palette}`]
          : styles[`tone-${resolvedTone}`];

    return (
      <span
        ref={setRefs}
        role={label !== undefined ? 'status' : undefined}
        aria-label={label}
        aria-hidden={label === undefined ? 'true' : undefined}
        className={cn(
          styles.dot,
          styles[`size-${size}`],
          colorClass,
          pulse && styles.pulse,
          glow && styles.glow,
          className
        )}
        {...rest}
      />
    );
  }
);
