import { ICON_SIZE_PX, type IconSize } from '../../tokens';
import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Icon.module.css';

export type { IconSize };

export type IconTone =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type IconComponentType = React.ComponentType<{
  readonly size?: number | string;
  readonly strokeWidth?: number | string;
  readonly className?: string;
  readonly 'aria-hidden'?: boolean;
}>;

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly icon: IconComponentType;
  readonly size?: IconSize;
  readonly tone?: IconTone;
  readonly label?: string;
}

/**
 * Atomic Icon wrapper around Lucide icons or custom SVG icon components.
 * Uses tokenized sizes from `ICON_SIZE_PX` (`2xs`..`xl`) and semantic tones.
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
  { icon: IconComponent, size = 'md', tone = 'inherit', label, className, ...rest },
  ref,
) {
  const pixelSize = ICON_SIZE_PX[size];

  return (
    <span
      ref={ref}
      role={label !== undefined ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label === undefined ? 'true' : undefined}
      className={cn(styles.icon, styles[`size-${size}`], styles[`tone-${tone}`], className)}
      {...rest}
    >
      <IconComponent size={pixelSize} strokeWidth={2} aria-hidden />
    </span>
  );
});
