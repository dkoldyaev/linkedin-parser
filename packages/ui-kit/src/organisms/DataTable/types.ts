import React from 'react';
export type TableSortDirection = 'asc' | 'desc';

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

