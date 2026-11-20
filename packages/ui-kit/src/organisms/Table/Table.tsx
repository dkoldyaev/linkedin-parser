import React from 'react';
import { useGridScroll } from '../../hooks';
import { cn } from '../../utils';
import { TableCol, type TableColProps, type TableColGridUnits } from './TableCol';
import { TableHeader, type TableHeaderProps } from './TableHeader';
import { TableBody, type TableBodyProps } from './TableBody';
import { TableCell, type TableCellProps } from './TableCell';
import { TableRow, type TableRowProps } from './TableRow';
import { TableFooter, type TableFooterProps, type TableFooterJustify } from './TableFooter';
import styles from './Table.module.css';

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly layout?: 'columns' | 'rows';
  /** When true with layout="columns", all direct TableCol child columns expand to take maximum available width. */
  readonly fluidColumns?: boolean;
  /**
   * When true with layout="columns", columns are quantized to equal maximum multiples of the 32px grid (--ui-grid-cell),
   * leaving remainder/extra space for a trailing rail (e.g. "Add column").
   */
  readonly quantizeColumns?: boolean;
  /** Minimum width in grid units for quantized columns (default: 8 units = 256px). */
  readonly minColGridUnits?: number;
  readonly snapScroll?: boolean;
  readonly fullHeight?: boolean;
  readonly bordered?: boolean;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly onScroll?: React.UIEventHandler<HTMLDivElement>;
}

/**
 * Flex-based Table organism implemented on div (display: flex).
 * Supports Kanban column boards (`layout="columns"`) or record tables (`layout="rows"`).
 */
export const Table = React.forwardRef<HTMLDivElement, TableProps>(function Table(
  {
    layout = 'columns',
    fluidColumns = false,
    quantizeColumns = false,
    minColGridUnits = 8,
    snapScroll = true,
    fullHeight = true,
    bordered = false,
    children,
    className,
    onScroll,
    ...restProps
  },
  forwardedRef
): React.ReactElement {
  const internalRef = React.useRef<HTMLDivElement | null>(null);
  const handleGridScroll = useGridScroll();

  React.useImperativeHandle(forwardedRef, () => internalRef.current as HTMLDivElement);

  React.useLayoutEffect(() => {
    if (!quantizeColumns || layout !== 'columns' || typeof window === 'undefined') {
      return undefined;
    }

    const tableEl = internalRef.current;
    if (!tableEl) return undefined;

    const update = () => {
      const docComputed = window.getComputedStyle(document.documentElement);
      const rawCell = docComputed.getPropertyValue('--ui-grid-cell') || docComputed.getPropertyValue('--ui-grid');
      const grid = Number.parseFloat(rawCell) || 32;

      const colEls = Array.from(tableEl.children).filter(
        (child) => (child.getAttribute('role') === 'region' || child.classList.contains(styles.col)) && !child.hasAttribute('data-fixed-rail')
      );
      const count = colEls.length;
      if (count === 0) return;

      const totalWidth = tableEl.clientWidth;
      const totalUnits = Math.floor(totalWidth / grid);
      // Reserve at least 1 unit for trailing add-column rail if present
      const hasRail = Boolean(tableEl.querySelector('[data-fixed-rail]'));
      const reservedRailUnits = hasRail ? 1 : 0;
      const availUnits = totalUnits - reservedRailUnits;

      if (availUnits >= count * minColGridUnits) {
        const unitsPerCol = Math.floor(availUnits / count);
        tableEl.style.setProperty('--col-grid-width', `${unitsPerCol * grid}px`);
        const usedUnits = unitsPerCol * count;
        const remainderPx = (totalUnits - usedUnits) * grid;
        tableEl.style.setProperty('--rail-extra-width', `${Math.max(0, remainderPx)}px`);
      } else {
        tableEl.style.setProperty('--col-grid-width', `${minColGridUnits * grid}px`);
        tableEl.style.setProperty('--rail-extra-width', `${grid}px`);
      }
    };

    const observer = new ResizeObserver(update);
    observer.observe(tableEl);
    window.addEventListener('resize', update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [quantizeColumns, layout, minColGridUnits, children]);

  const handleScrollCombined = (event: React.UIEvent<HTMLDivElement>) => {
    if (snapScroll && layout === 'columns') {
      handleGridScroll(event, 'x');
    }
    onScroll?.(event);
  };

  return (
    <div
      ref={internalRef}
      role="table"
      onScroll={handleScrollCombined}
      className={cn(
        styles.table,
        layout === 'columns' ? styles.tableLayoutColumns : styles.tableLayoutRows,
        fluidColumns && styles.tableFluidColumns,
        quantizeColumns && styles.tableQuantizedColumns,
        fullHeight && styles.tableFullHeight,
        bordered && styles.tableBordered,
        className
      )}
      {...restProps}
    >
      {children}
    </div>
  );
}) as React.ForwardRefExoticComponent<
  TableProps & React.RefAttributes<HTMLDivElement>
> & {
  Col: typeof TableCol;
  Header: typeof TableHeader;
  Body: typeof TableBody;
  Cell: typeof TableCell;
  Row: typeof TableRow;
  Footer: typeof TableFooter;
};

Table.Col = TableCol;
Table.Header = TableHeader;
Table.Body = TableBody;
Table.Cell = TableCell;
Table.Row = TableRow;
Table.Footer = TableFooter;

export {
  TableCol,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableFooter,
  type TableColProps,
  type TableColGridUnits,
  type TableHeaderProps,
  type TableBodyProps,
  type TableCellProps,
  type TableRowProps,
  type TableFooterProps,
  type TableFooterJustify,
};
