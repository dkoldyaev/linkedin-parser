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
    snapScroll = true,
    fullHeight = true,
    bordered = false,
    children,
    className,
    onScroll,
    ...restProps
  },
  ref
): React.ReactElement {
  const handleGridScroll = useGridScroll();

  const handleScrollCombined = (event: React.UIEvent<HTMLDivElement>) => {
    if (snapScroll && layout === 'columns') {
      handleGridScroll(event, 'x');
    }
    onScroll?.(event);
  };

  return (
    <div
      ref={ref}
      role="table"
      onScroll={handleScrollCombined}
      className={cn(
        styles.table,
        layout === 'columns' ? styles.tableLayoutColumns : styles.tableLayoutRows,
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
