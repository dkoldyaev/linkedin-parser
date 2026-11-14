import React from 'react';
import { cn } from '../../utils';
import styles from './Table.module.css';

export interface TableHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly index?: string | number;
  readonly indicatorColor?: string;
  readonly title?: React.ReactNode;
  readonly badge?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly size?: 'sm' | 'md';
  readonly children?: React.ReactNode;
  readonly className?: string;
}

/**
 * Flex table header for columns or table headers on the 32px blueprint grid.
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
  const isPresetColor =
    indicatorColor === 'slate' ||
    indicatorColor === 'blue' ||
    indicatorColor === 'emerald' ||
    indicatorColor === 'amber' ||
    indicatorColor === 'rose' ||
    indicatorColor === 'cyan' ||
    indicatorColor === 'indigo' ||
    indicatorColor === 'purple';

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
              <span className={styles.headerIndex}>{index}</span>
            )}
            {indicatorColor !== undefined && (
              <span
                className={cn(
                  styles.headerDot,
                  isPresetColor && styles[`headerDot${capitalize(indicatorColor)}`]
                )}
                aria-hidden="true"
              />
            )}
            {title !== undefined && (
              <span className={styles.headerTitle}>{title}</span>
            )}
            {badge !== undefined && (
              <span className={styles.headerBadge}>{badge}</span>
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

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
