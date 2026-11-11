import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Badge.module.css';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
  readonly size?: BadgeSize;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
}

/**
 * Atomic Badge / Tag component for status indicators, column counts, and keyword tokens.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    tone = 'neutral',
    size = 'md',
    onRemove,
    removeLabel = 'Remove',
    className,
    children,
    ...rest
  },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        styles.badge,
        styles[`tone-${tone}`],
        styles[`size-${size}`],
        className
      )}
      {...rest}
    >
      <span>{children}</span>
      {onRemove !== undefined && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={onRemove}
          aria-label={removeLabel}
        >
          ×
        </button>
      )}
    </span>
  );
});
