import React from 'react';
import { cn } from '../../utils';
import styles from './Table.module.css';

export type TableColGridUnits = 6 | 8 | 10 | 12 | 14 | 16;

export interface TableColProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly gridUnits?: TableColGridUnits | number;
  readonly fluid?: boolean;
  readonly isDragOver?: boolean;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Vertical column container for flex Table.
 * Aligns width to 32px blueprint grid multiples (default: 10 units = 320px).
 */
export const TableCol = React.forwardRef<HTMLDivElement, TableColProps>(
  function TableCol(
    {
      gridUnits = 10,
      fluid = false,
      isDragOver = false,
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    const knownUnitsClass =
      gridUnits === 6
        ? styles.colUnits6
        : gridUnits === 8
          ? styles.colUnits8
          : gridUnits === 10
            ? styles.colUnits10
            : gridUnits === 12
              ? styles.colUnits12
              : gridUnits === 14
                ? styles.colUnits14
                : gridUnits === 16
                  ? styles.colUnits16
                  : styles.colUnits10;

    return (
      <div
        ref={ref}
        role="region"
        className={cn(
          styles.col,
          fluid ? styles.colFluid : knownUnitsClass,
          isDragOver && styles.colDragOver,
          className
        )}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);
