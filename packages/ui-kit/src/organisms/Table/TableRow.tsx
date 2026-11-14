import React from 'react';
import { cn } from '../../utils';
import styles from './Table.module.css';

export interface TableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly bordered?: boolean;
  readonly interactive?: boolean;
  readonly selected?: boolean;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Horizontal flex row for record-based flex tables.
 */
export const TableRow = React.forwardRef<HTMLDivElement, TableRowProps>(
  function TableRow(
    {
      bordered = true,
      interactive = false,
      selected = false,
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    return (
      <div
        ref={ref}
        role="row"
        className={cn(
          styles.row,
          bordered && styles.rowBordered,
          interactive && styles.rowInteractive,
          selected && styles.rowSelected,
          className
        )}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);
