import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Label.module.css';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  readonly required?: boolean;
  readonly disabled?: boolean;
}

/**
 * Atomic monospace Label component in Blueprint technical style.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required = false, disabled = false, className, children, ...rest },
  ref
) {
  return (
    <label
      ref={ref}
      className={cn(styles.label, disabled && styles.disabled, className)}
      {...rest}
    >
      <span>{children}</span>
      {required && (
        <span className={styles.requiredIndicator} aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
});
