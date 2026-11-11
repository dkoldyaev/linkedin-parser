import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Icon, Spinner, Text } from '../../atoms';
import { EmptyState } from '../../molecules';
import { useBlueprintGrid } from '../../hooks';
import { GRID_CELL_PX, cn } from '../../utils';
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
  /**
   * Column width in multiples of 32px Blueprint grid units (e.g. 5 = 160px).
   */
  readonly gridUnits?: number;
  /**
   * Explicit pixel width (will be quantized to multiples of 32px).
   */
  readonly width?: number;
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
  const [colWidths, setColWidths] = useState<readonly number[]>([]);
  const wrapperRef = useBlueprintGrid<HTMLDivElement>([columns, data.length]);

  useLayoutEffect(() => {
    const root = wrapperRef.current;
    if (!root || columns.length === 0) {
      return undefined;
    }

    const computeWidths = () => {
      const grid = GRID_CELL_PX;
      const totalWidth = root.clientWidth;
      const totalUnits = Math.max(columns.length * 3, Math.floor(totalWidth / grid));

      let allocatedUnits = 0;
      const unassignedIndices: number[] = [];
      const unitsPerCol = new Array<number>(columns.length).fill(0);

      columns.forEach((col, idx) => {
        if (col.gridUnits !== undefined && col.gridUnits > 0) {
          unitsPerCol[idx] = col.gridUnits;
          allocatedUnits += col.gridUnits;
        } else if (col.width !== undefined && col.width > 0) {
          const snapped = Math.max(3, Math.round(col.width / grid));
          unitsPerCol[idx] = snapped;
          allocatedUnits += snapped;
        } else {
          unassignedIndices.push(idx);
        }
      });

      if (unassignedIndices.length > 0) {
        const remainingUnits = Math.max(
          unassignedIndices.length * 3,
          totalUnits - allocatedUnits
        );
        const baseUnits = Math.floor(remainingUnits / unassignedIndices.length);
        const extraUnits = remainingUnits % unassignedIndices.length;

        unassignedIndices.forEach((colIdx, listIdx) => {
          const units = Math.max(3, baseUnits + (listIdx < extraUnits ? 1 : 0));
          unitsPerCol[colIdx] = units;
        });
      }

      const pixelWidths = unitsPerCol.map((u) => u * grid);
      setColWidths(pixelWidths);
    };

    computeWidths();
    window.addEventListener('resize', computeWidths);
    return () => window.removeEventListener('resize', computeWidths);
  }, [columns, wrapperRef]);

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
    <div ref={wrapperRef} className={cn(styles.wrapper, className)}>
      <table className={styles.table}>
        {colWidths.length === columns.length && (
          <colgroup>
            {colWidths.map((w, idx) => (
              <col key={columns[idx].id} width={w} />
            ))}
          </colgroup>
        )}
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
