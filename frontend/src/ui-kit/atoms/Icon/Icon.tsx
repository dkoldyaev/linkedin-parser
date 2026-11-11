import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Icon.module.css';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg';
export type IconTone =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly icon: React.ComponentType<{
    readonly size?: number;
    readonly strokeWidth?: number;
    readonly 'aria-hidden'?: boolean;
  }>;
  readonly size?: IconSize;
  readonly tone?: IconTone;
  readonly label?: string;
}

const SIZE_MAP: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
};

/**
 * Atomic Icon wrapper around Lucide icons or custom SVG icon components.
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
  {
    icon: IconComponent,
    size = 'md',
    tone = 'inherit',
    label,
    className,
    ...rest
  },
  ref
) {
  const pixelSize = SIZE_MAP[size];

  return (
    <span
      ref={ref}
      role={label !== undefined ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label === undefined ? 'true' : undefined}
      className={cn(
        styles.icon,
        styles[`size-${size}`],
        styles[`tone-${tone}`],
        className
      )}
      {...rest}
    >
      <IconComponent size={pixelSize} strokeWidth={2} aria-hidden={true} />
    </span>
  );
});
