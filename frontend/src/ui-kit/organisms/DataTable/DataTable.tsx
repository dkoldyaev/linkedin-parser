import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Icon, Spinner, Text } from '../../atoms';
import { EmptyState } from '../../molecules';
import { cn } from '../../utils';
import styles from './DataTable.module.css';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<T> {
  readonly id: string;
  readonly header: React.ReactNode;
  readonly accessor?: keyof T;
  readonly cell?: (row: T, rowIndex: number) => React.ReactNode;
  readonly sortable?: boolean;
  readonly sortValue?: (row: T) => string | number;
  readonly align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
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
 * Typed DataTable organism replacing the 3 duplicated data tables (UsersTable, VacanciesTable, QueueModal).
 * Supports sortable columns, loading state, and EmptyState molecule fallback.
 */
export function DataTable<T>({
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
}: DataTableProps<T>): React.ReactElement {
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
    return (
      <div className={cn(styles.wrapper, className)}>
        <div className={styles.loadingState}>
          <Spinner size="md" label={loadingLabel} />
          <Text variant="mono" tone="secondary">
            {loadingLabel}
          </Text>
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <div className={cn(styles.wrapper, className)}>
      <table className={styles.table}>
        {caption !== undefined && (
          <caption className="sr-only">{caption}</caption>
        )}
        <thead>
          <tr>
            {columns.map((column) => {
              const align = column.align !== undefined ? column.align : 'left';
              const isSorted = sortColumnId === column.id;
              const ariaSort = isSorted
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : column.sortable
                  ? 'none'
                  : undefined;

              const SortIconComponent = !isSorted
                ? ArrowUpDown
                : sortDirection === 'asc'
                  ? ArrowUp
                  : ArrowDown;

              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cn(styles.th, styles[`align-${align}`])}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSort(column.id)}
                    >
                      <span>{column.header}</span>
                      <Icon
                        icon={SortIconComponent}
                        size="xs"
                        tone={isSorted ? 'accent' : 'muted'}
                      />
                    </button>
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
                  const align =
                    column.align !== undefined ? column.align : 'left';
                  const cellContent = column.cell
                    ? column.cell(row, rowIndex)
                    : column.accessor !== undefined
                      ? String(row[column.accessor] ?? '')
                      : null;

                  return (
                    <td
                      key={column.id}
                      className={cn(styles.td, styles[`align-${align}`])}
                    >
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
