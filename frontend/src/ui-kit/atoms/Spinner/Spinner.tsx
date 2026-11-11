import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly size?: SpinnerSize;
  readonly label?: string;
}

/**
 * Accessible loading Spinner atom with screen-reader status announcement.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  function Spinner({ size = 'md', label = 'Loading...', className, ...rest }, ref) {
    return (
      <span
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(styles.spinner, styles[`size-${size}`], className)}
        {...rest}
      >
        <span className={styles.srOnly}>{label}</span>
      </span>
    );
  }
);
