import React from 'react';
import {
  Badge,
  StatusDot,
  Text,
  type StatusDotPalette,
} from '../../atoms';
import { cn } from '../../utils';
import styles from './Table.module.css';

export interface TableHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly index?: string | number;
  readonly indicatorColor?: StatusDotPalette;
  readonly title?: React.ReactNode;
  readonly badge?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly size?: 'sm' | 'md';
  readonly children?: React.ReactNode;
  readonly className?: string;
}

/**
 * Flex table header for columns or table headers on the 32px blueprint grid.
 * Composes StatusDot, Text, and Badge atoms.
 */
export function TableHeader({
  index,
  indicatorColor,
  title,
  badge,
  actions,
  size = 'sm',
  children,
  className,
  ...restProps
}: TableHeaderProps): React.ReactElement {
  return (
    <div
      role="columnheader"
      className={cn(
        styles.header,
        size === 'md' ? styles.headerSizeMd : styles.headerSizeSm,
        className
      )}
      {...restProps}
    >
      {children !== undefined ? (
        children
      ) : (
        <>
          <div className={styles.headerTitleGroup}>
            {index !== undefined && (
              <Text as="span" variant="mono" weight="semibold" tone="accent" className={styles.headerIndex}>
                {index}
              </Text>
            )}
            {indicatorColor !== undefined && (
              <StatusDot
                palette={indicatorColor}
                size="md"
                className={styles.headerDot}
              />
            )}
            {title !== undefined && (
              <Text
                as="span"
                variant="mono-label"
                weight="semibold"
                tone="primary"
                truncate
                className={styles.headerTitle}
              >
                {title}
              </Text>
            )}
            {badge !== undefined && (
              <Badge variant="counter" size="xs" tone="neutral">
                {badge}
              </Badge>
            )}
          </div>
          {actions !== undefined && (
            <div className={styles.headerActions}>{actions}</div>
          )}
        </>
      )}
    </div>
  );
}
