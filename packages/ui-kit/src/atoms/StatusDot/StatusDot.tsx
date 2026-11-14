import React, { forwardRef } from 'react';
import type { PaletteTone, SemanticTone } from '../../tokens';
import { cn } from '../../utils';
import styles from './StatusDot.module.css';

export type StatusDotTone = SemanticTone;
export type StatusDotPalette = PaletteTone;
export type StatusDotSize = 'xs' | 'sm' | 'md' | 'lg';

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly tone?: StatusDotTone;
  readonly palette?: StatusDotPalette;
  readonly size?: StatusDotSize;
  readonly pulse?: boolean;
  readonly glow?: boolean;
  readonly label?: string;
}

/**
 * Atomic StatusDot indicator for connection status, activity indicators, and column palette markers.
 * Uses pure CSS token classes without inline styles.
 */
export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  function StatusDot(
    {
      tone = 'neutral',
      palette,
      size = 'md',
      pulse = false,
      glow = false,
      label,
      className,
      ...rest
    },
    ref
  ) {
    const resolvedTone = tone === 'accent' ? 'primary' : tone;
    const colorClass =
      palette !== undefined
        ? styles[`palette-${palette}`]
        : styles[`tone-${resolvedTone}`];

    return (
      <span
        ref={ref}
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
