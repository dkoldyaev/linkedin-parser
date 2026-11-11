import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './StatusDot.module.css';

export type StatusDotTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

export type StatusDotPalette =
  | 'slate'
  | 'blue'
  | 'purple'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'indigo';

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly tone?: StatusDotTone;
  readonly palette?: StatusDotPalette;
  readonly pulse?: boolean;
  readonly label?: string;
}

/**
 * Atomic StatusDot indicator for connection status, worker activity, and Kanban column colors.
 * Uses pure CSS token classes instead of inline styles.
 */
export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  function StatusDot(
    { tone = 'neutral', palette, pulse = false, label, className, ...rest },
    ref
  ) {
    const colorClass =
      palette !== undefined
        ? styles[`palette-${palette}`]
        : styles[`tone-${tone}`];

    return (
      <span
        ref={ref}
        role={label !== undefined ? 'status' : undefined}
        aria-label={label}
        aria-hidden={label === undefined ? 'true' : undefined}
        className={cn(
          styles.dot,
          colorClass,
          pulse && styles.pulse,
          className
        )}
        {...rest}
      />
    );
  }
);
