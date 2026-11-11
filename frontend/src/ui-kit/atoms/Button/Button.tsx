import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../utils';
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'mint'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly asChild?: boolean;
  readonly startIcon?: React.ReactNode;
  readonly endIcon?: React.ReactNode;
}

/**
 * Atomic Button component on the 32px Blueprint grid.
 * Supports polymorphic composition via `asChild` (Radix Slot), loading state, and 6 Blueprint variants.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    fullWidth = false,
    asChild = false,
    startIcon,
    endIcon,
    disabled,
    type = 'button',
    className,
    children,
    ...rest
  },
  ref
) {
  const isDisabled = Boolean(disabled) || loading;
  const Comp = asChild ? Slot : 'button';

  const composedClassName = cn(
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth && styles.fullWidth,
    className
  );

  if (asChild) {
    return (
      <Comp
        ref={ref}
        className={composedClassName}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...rest}
      >
        {children}
      </Comp>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={composedClassName}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        startIcon !== undefined && (
          <span className={styles.iconSlot} aria-hidden="true">
            {startIcon}
          </span>
        )
      )}
      {children}
      {!loading && endIcon !== undefined && (
        <span className={styles.iconSlot} aria-hidden="true">
          {endIcon}
        </span>
      )}
    </button>
  );
});
