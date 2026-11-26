import type { SemanticTone } from '../../tokens';
import React, { forwardRef } from 'react';
import { Button } from '../Button';
import { cn } from '../../utils';
import { Icon } from '../Icon';
import styles from './Badge.module.css';
import { Text } from '../Text';
import { X } from 'lucide-react';

export type BadgeTone = SemanticTone;

export type BadgeVariant = 'badge' | 'subtle' | 'solid' | 'outline' | 'chip' | 'counter' | 'ghost';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly icon?: React.ReactNode;
  readonly endIcon?: React.ReactNode;
  readonly tone?: BadgeTone;
  readonly variant?: BadgeVariant;
  readonly size?: BadgeSize;
  readonly interactive?: boolean;
  readonly active?: boolean;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly children?: React.ReactNode;
  readonly className?: string;
}

/**
 * Universal Atomic Badge component for status indicators, metrics, keyword tokens, and counters.
 * Composes `<Text>`, `<Button>`, and `<Icon>` instead of raw markup or domain-coupled wrappers.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    icon,
    endIcon,
    tone = 'neutral',
    variant = 'subtle',
    size = 'md',
    interactive = false,
    active = false,
    onRemove,
    removeLabel = 'Remove',
    className,
    children,
    onClick,
    ...rest
  },
  ref,
) {
  const normalizedVariant = variant === 'badge' ? 'subtle' : variant;
  const colorClass = styles[`tone-${tone}`];

  const isInteractive = interactive || onClick !== undefined;

  return (
    <span
      ref={ref}
      role={isInteractive ? 'button' : rest.role}
      tabIndex={isInteractive ? 0 : rest.tabIndex}
      aria-pressed={isInteractive && active ? true : undefined}
      onClick={onClick}
      className={cn(
        styles.badge,
        styles[`variant-${normalizedVariant}`],
        colorClass,
        styles[`size-${size}`],
        isInteractive && styles.interactive,
        active && styles.active,
        className,
      )}
      {...rest}
    >
      {icon !== undefined && (
        <span className={styles.iconSlot} aria-hidden="true">
          {icon}
        </span>
      )}
      {children !== undefined && (
        <Text as="span" variant="mono" className={styles.label}>
          {children}
        </Text>
      )}
      {endIcon !== undefined && (
        <span className={styles.iconSlot} aria-hidden="true">
          {endIcon}
        </span>
      )}
      {onRemove !== undefined && (
        <Button
          variant="ghost"
          size="icon-xs"
          className={styles.removeButton}
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <Icon icon={X} size="2xs" />
        </Button>
      )}
    </span>
  );
});
