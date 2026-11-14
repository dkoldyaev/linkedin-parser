import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  readonly size?: InputSize;
  readonly invalid?: boolean;
  readonly mono?: boolean;
  readonly startAdornment?: React.ReactNode;
  readonly endAdornment?: React.ReactNode;
  readonly wrapperClassName?: string;
}

/**
 * Atomic text Input component aligned to the 32px Blueprint grid.
 * Supports validation states (`invalid`), monospace mode, and optional start/end adornments.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    invalid = false,
    mono = false,
    startAdornment,
    endAdornment,
    className,
    wrapperClassName,
    type = 'text',
    ...rest
  },
  ref
) {
  const inputElement = (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || rest['aria-invalid'] || undefined}
      className={cn(
        styles.input,
        styles[`size-${size}`],
        mono && styles.mono,
        invalid && styles.invalid,
        startAdornment !== undefined && styles.hasStartAdornment,
        endAdornment !== undefined && styles.hasEndAdornment,
        className
      )}
      {...rest}
    />
  );

  if (startAdornment === undefined && endAdornment === undefined) {
    return inputElement;
  }

  return (
    <div className={cn(styles.wrapper, wrapperClassName)}>
      {startAdornment !== undefined && (
        <span className={styles.startAdornment} aria-hidden="true">
          {startAdornment}
        </span>
      )}
      {inputElement}
      {endAdornment !== undefined && (
        <span className={styles.endAdornment} aria-hidden="true">
          {endAdornment}
        </span>
      )}
    </div>
  );
});
