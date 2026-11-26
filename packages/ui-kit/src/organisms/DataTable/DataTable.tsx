import type { DataTableColumn, TableSortDirection } from './types';
import React, { useMemo, useState } from 'react';
import { cn } from '../../utils';
import { DataTableLoading } from './DataTableLoading';
import { EmptyState } from '../../molecules';
import { SortButton } from '../../atoms';
import styles from './DataTable.module.css';
import { useBlueprintGrid } from '../../hooks';
import { useDataTableColumns } from './useDataTableColumns';

export { useDataTableColumns } from './useDataTableColumns';
export { DataTableLoading, type DataTableLoadingProps } from './DataTableLoading';
export type { DataTableColumn, TableSortDirection };

export interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  readonly columns: readonly DataTableColumn<T>[];
  readonly data: readonly T[];
  readonly getRowId: (row: T, index: number) => string;
  readonly onRowClick?: (row: T) => void;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly emptyTitle?: React.ReactNode;
  readonly emptyDescription?: React.ReactNode;
  readonly emptyAction?: React.ReactNode;
  readonly caption?: string;
  readonly className?: string;
}

/**
 * Typed DataTable organism on the Blueprint grid.
 * Supports sortable columns, loading state, EmptyState fallback, and data-* / aria-* attributes forwarding.
 */
function DataTableBase<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  loading = false,
  loadingLabel = 'Loading records...',
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  caption,
  className,
  ...rest
}: DataTableProps<T>): React.ReactElement {
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<TableSortDirection>('asc');
  const wrapperRef = useBlueprintGrid<HTMLDivElement>([columns, data.length]);
  const colWidths = useDataTableColumns(columns, wrapperRef);

  const handleSort = (columnId: string) => {
    if (sortColumnId === columnId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumnId(columnId);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (sortColumnId === null) {
      return data;
    }
    const activeColumn = columns.find((col) => col.id === sortColumnId);
    if (!activeColumn || !activeColumn.sortable) {
      return data;
    }

    const extractValue = (row: T): string | number => {
      if (activeColumn.sortValue) {
        return activeColumn.sortValue(row);
      }
      if (activeColumn.accessor !== undefined) {
        const raw = row[activeColumn.accessor];
        if (typeof raw === 'number' || typeof raw === 'string') {
          return raw;
        }
        return String(raw ?? '');
      }
      return '';
    };

    return [...data].sort((a, b) => {
      const valA = extractValue(a);
      const valB = extractValue(b);

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      const comparison = String(valA).localeCompare(String(valB));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [columns, data, sortColumnId, sortDirection]);

  if (loading) {
    return <DataTableLoading label={loadingLabel} className={className} {...rest} />;
  }

  if (sortedData.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
        {...rest}
      />
    );
  }

  return (
    <div ref={wrapperRef} className={cn(styles.wrapper, className)} {...rest}>
      <table className={styles.table}>
        {colWidths.length === columns.length && (
          <colgroup>
            {colWidths.map((w, idx) => (
              <col key={columns[idx].id} width={w} />
            ))}
          </colgroup>
        )}
        {caption !== undefined && <caption className={styles.caption}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => {
              const align = column.align !== undefined ? column.align : 'left';
              const isSorted = sortColumnId === column.id;
              const currentDirection = isSorted ? sortDirection : 'none';

              return (
                <th key={column.id} scope="col" className={cn(styles.th, styles[`align-${align}`])}>
                  {column.sortable ? (
                    <SortButton
                      direction={currentDirection}
                      onToggle={() => handleSort(column.id)}
                      size="sm"
                    >
                      {column.header}
                    </SortButton>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => {
            const rowKey = getRowId(row, rowIndex);
            const isClickable = onRowClick !== undefined;

            return (
              <tr
                key={rowKey}
                onClick={isClickable ? () => onRowClick(row) : undefined}
                className={cn(styles.tr, isClickable && styles.clickableRow)}
              >
                {columns.map((column) => {
                  const align = column.align !== undefined ? column.align : 'left';
                  const cellContent = column.cell
                    ? column.cell(row, rowIndex)
                    : column.accessor !== undefined
                      ? String(row[column.accessor] ?? '')
                      : null;

                  return (
                    <td key={column.id} className={cn(styles.td, styles[`align-${align}`])}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const DataTable = Object.assign(DataTableBase, {
  Loading: DataTableLoading,
});
