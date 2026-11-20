import React from 'react';
import { cn } from '../../utils';
import styles from './Table.module.css';

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly actions?: React.ReactNode;
  readonly size?: 'sm' | 'md';
  readonly children?: React.ReactNode;
  readonly className?: string;
}

/**
 * Flex table header for columns or table rows on the 32px blueprint grid.
 * Accepts `children` (left side: index, indicator/dot, title, badge, etc.) and `actions` (right side: buttons, menus).
 */
export function TableHeader({
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
      <div className={styles.headerTitleGroup}>{children}</div>
      {actions !== undefined && (
        <div className={styles.headerActions}>{actions}</div>
      )}
    </div>
  );
}
