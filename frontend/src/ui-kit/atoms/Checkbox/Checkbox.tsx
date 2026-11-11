import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Checkbox.module.css';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly label?: React.ReactNode;
}

/**
 * Atomic Checkbox control styled for the Blueprint grid.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, disabled = false, className, ...rest }, ref) {
    const inputElement = (
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled}
        className={cn(styles.input, className)}
        {...rest}
      />
    );

    if (label === undefined) {
      return inputElement;
    }

    return (
      <label className={cn(styles.labelWrapper, disabled && styles.disabled)}>
        {inputElement}
        <span>{label}</span>
      </label>
    );
  }
);
