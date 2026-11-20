import React from 'react';
import { cn } from '../../utils';
import styles from './Table.module.css';

export type TableColGridUnits = 6 | 8 | 10 | 12 | 14 | 16;

export interface TableColProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column width in grid units (32px cells). If number is passed, calculates width dynamically based on --ui-grid-cell. */
  readonly gridUnits?: TableColGridUnits | number;
  /** When true, column expands to take maximum available space (flex: 1 1 0). */
  readonly fluid?: boolean;
  readonly isDragOver?: boolean;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

const KNOWN_UNITS = new Set([6, 8, 10, 12, 14, 16]);

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
      style,
      ...restProps
    },
    ref
  ): React.ReactElement {
    const isKnownUnit = !fluid && typeof gridUnits === 'number' && KNOWN_UNITS.has(gridUnits);
    const knownUnitsClass = isKnownUnit
      ? styles[`colUnits${gridUnits}`]
      : undefined;

    const customGridStyle: React.CSSProperties | undefined =
      !fluid && typeof gridUnits === 'number' && !isKnownUnit
        ? {
            flex: `0 0 calc(${gridUnits} * var(--ui-grid-cell))`,
            width: `calc(${gridUnits} * var(--ui-grid-cell))`,
            minWidth: `calc(${gridUnits} * var(--ui-grid-cell))`,
            maxWidth: `calc(${gridUnits} * var(--ui-grid-cell))`,
            ...style,
          }
        : style;

    return (
      <div
        ref={ref}
        role="region"
        style={customGridStyle}
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
