import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import type { SemanticTone } from '../../tokens';
import styles from './StatusDot.module.css';

export type StatusDotTone = SemanticTone;
export type StatusDotSize = 'xs' | 'sm' | 'md' | 'lg';

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly tone?: StatusDotTone;
  readonly size?: StatusDotSize;
  readonly pulse?: boolean;
  readonly glow?: boolean;
  readonly label?: string;
}

/**
 * Atomic StatusDot indicator for connection status, activity indicators, and semantic status markers.
 */
export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(function StatusDot(
  { tone = 'neutral', size = 'md', pulse = false, glow = false, label, className, ...rest },
  ref,
) {
  const colorClass = styles[`tone-${tone}`];

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
        className,
      )}
      {...rest}
    />
  );
});
