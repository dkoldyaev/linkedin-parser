import type { BoardColumn } from '../types/models';

export interface ColumnCreatePayload {
  name: string;
  color?: string;
  has_lanes?: boolean;
  id?: string;
  role?: string;
}

export interface ColumnUpdatePayload {
  name?: string;
  color?: string;
  has_lanes?: boolean;
  role?: string;
}

export type { BoardColumn };
