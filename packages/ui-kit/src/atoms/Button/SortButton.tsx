import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import React, { forwardRef } from 'react';
import { Button } from './Button';
import { cn } from '../../utils';
import { Icon } from '../Icon';
import styles from './Button.module.css';
import { Text } from '../Text';

export type SortDirection = 'asc' | 'desc' | 'none';
export type SortButtonSize = 'sm' | 'md';
export type SortButtonTone = 'default' | 'accent' | 'muted';

export interface SortButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onToggle'
> {
  readonly direction?: SortDirection;
  readonly active?: boolean;
  readonly onToggle?: (nextDirection: 'asc' | 'desc') => void;
  readonly size?: SortButtonSize;
  readonly tone?: SortButtonTone;
  readonly iconPosition?: 'start' | 'end';
  readonly children?: React.ReactNode;
}

/**
 * SortButton atom built on top of `<Button variant="ghost">`, `<Text>`, and `<Icon>`.
 * Provides accessible `aria-sort` / `aria-pressed` attributes and directional indicators.
 */
export const SortButton = forwardRef<HTMLButtonElement, SortButtonProps>(function SortButton(
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
  ref,
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

  const SortIconComponent = !isSorted ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown;

  const ariaSortValue = isSorted ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';

  const iconElement = (
    <Icon
      icon={SortIconComponent}
      size={size === 'sm' ? 'xs' : 'sm'}
      tone={isActive ? 'accent' : tone === 'muted' ? 'muted' : 'secondary'}
    />
  );

  const buttonTone = isActive ? 'accent' : tone;

  return (
    <Button
      ref={ref}
      type={type}
      variant="ghost"
      size={size}
      tone={buttonTone}
      disabled={disabled}
      aria-sort={ariaSortValue}
      aria-pressed={isActive}
      onClick={handleButtonClick}
      startIcon={iconPosition === 'start' ? iconElement : undefined}
      endIcon={iconPosition === 'end' ? iconElement : undefined}
      className={cn(
        styles.sortButton,
        size === 'sm' && styles.sortSizeSm,
        isActive && styles.sortActive,
        className,
      )}
      {...rest}
    >
      {children !== undefined && (
        <Text
          as="span"
          variant="mono"
          size="xs"
          tone={isActive ? 'accent' : tone === 'muted' ? 'muted' : 'secondary'}
          truncate
        >
          {children}
        </Text>
      )}
    </Button>
  );
});
