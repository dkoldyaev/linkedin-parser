import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import { Slot } from '@radix-ui/react-slot';
import { Spinner } from '../Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'mint' | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'm' | 'lg' | 'icon' | 'icon-sm' | 'icon-xs';
export type ButtonTone = 'default' | 'danger' | 'accent' | 'success' | 'muted';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly tone?: ButtonTone;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly asChild?: boolean;
  readonly startIcon?: React.ReactNode;
  readonly endIcon?: React.ReactNode;
}

/**
 * Atomic Button component on the 32px Blueprint grid.
 * Composes `<Spinner>` for loading state and supports polymorphic composition via `asChild` (Radix Slot).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    tone = 'default',
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
  ref,
) {
  const isDisabled = Boolean(disabled) || loading;
  const Comp = asChild ? Slot : 'button';
  const normalizedSize = size === 'm' ? 'md' : size;

  const composedClassName = cn(
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${normalizedSize}`],
    tone !== 'default' && styles[`tone-${tone}`],
    fullWidth && styles.fullWidth,
    className,
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
        <Spinner size="sm" />
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
