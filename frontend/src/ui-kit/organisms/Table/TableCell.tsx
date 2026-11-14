import React from 'react';
import { cn } from '../../utils';
import styles from './Table.module.css';

export interface TableCellProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly padding?: 'none' | 'sm' | 'md';
  readonly bordered?: boolean;
  readonly interactive?: boolean;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Atomic flex cell organism inside a flex Table row or column.
 */
export const TableCell = React.forwardRef<HTMLDivElement, TableCellProps>(
  function TableCell(
    {
      padding = 'sm',
      bordered = false,
      interactive = false,
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    return (
      <div
        ref={ref}
        role="cell"
        className={cn(
          styles.cell,
          styles[`cellPadding${capitalize(padding)}`],
          bordered && styles.cellBordered,
          interactive && styles.cellInteractive,
          className
        )}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
