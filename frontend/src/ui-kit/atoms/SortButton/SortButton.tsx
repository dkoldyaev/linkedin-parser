import React, { forwardRef } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../Icon';
import styles from './SortButton.module.css';

export type SortDirection = 'asc' | 'desc' | 'none';
export type SortButtonSize = 'sm' | 'md';
export type SortButtonTone = 'default' | 'accent' | 'muted';

export interface SortButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onToggle'> {
  readonly direction?: SortDirection;
  readonly active?: boolean;
  readonly onToggle?: (nextDirection: 'asc' | 'desc') => void;
  readonly size?: SortButtonSize;
  readonly tone?: SortButtonTone;
  readonly iconPosition?: 'start' | 'end';
  readonly children?: React.ReactNode;
}

/**
 * SortButton atom for interactive column headers, list sorters, and toolbars.
 * Provides accessible aria-sort / aria-pressed attributes, direction indicator icons,
 * and snaps to Blueprint 24px (sm) or 32px (md) grid slots.
 */
export const SortButton = forwardRef<HTMLButtonElement, SortButtonProps>(
  function SortButton(
    {
      direction = 'none',
      active,
      onToggle,
      onClick,
      size = 'sm',
      tone = 'default',
      iconPosition = 'end',
      type = 'button',
      className,
      children,
      disabled,
      ...rest
    },
    ref
  ) {
    const isSorted = direction === 'asc' || direction === 'desc';
    const isActive = active !== undefined ? active : isSorted;

    const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (onClick) {
        onClick(event);
      }
      if (onToggle) {
        const nextDirection: 'asc' | 'desc' = direction === 'asc' ? 'desc' : 'asc';
        onToggle(nextDirection);
      }
    };

    const SortIconComponent = !isSorted
      ? ArrowUpDown
      : direction === 'asc'
        ? ArrowUp
        : ArrowDown;

    const ariaSortValue = isSorted
      ? direction === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none';

    const iconElement = (
      <Icon
        icon={SortIconComponent}
        size={size === 'sm' ? 'xs' : 'sm'}
        tone={isActive ? 'accent' : tone === 'muted' ? 'muted' : 'secondary'}
        aria-hidden
        className={styles.icon}
      />
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-sort={ariaSortValue}
        aria-pressed={isActive}
        onClick={handleButtonClick}
        className={cn(
          styles.sortButton,
          size === 'sm' && styles.sizeSm,
          size === 'md' && styles.sizeMd,
          isActive && styles.active,
          tone === 'accent' && styles.toneAccent,
          tone === 'muted' && styles.toneMuted,
          className
        )}
        {...rest}
      >
        {iconPosition === 'start' && iconElement}
        {children !== undefined && <span className={styles.label}>{children}</span>}
        {iconPosition === 'end' && iconElement}
      </button>
    );
  }
);
