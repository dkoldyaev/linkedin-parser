import type React from 'react';
import {
  STATUS_REJECTED,
  DEFAULT_COLUMNS as DEFAULT_BOARD_COLUMNS,
} from '../constants/columns';
import type { BoardColumn, Vacancy } from '../types/models';

export const REJECTED_STATUS = STATUS_REJECTED;

export function sortByManualOrder(list: Vacancy[]): Vacancy[] {
  const unordered = list.filter((v) => v.sort_order == null);
  const ordered = list
    .filter((v) => v.sort_order != null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return [...unordered, ...ordered];
}

function isRejectedRoleColumn(c: BoardColumn): boolean {
  if (c.system_role === 'rejected') return true;
  return Boolean(c.is_base && (c.id === STATUS_REJECTED || c.role === 'rejected'));
}

export function resolveBoardColumnsConfig(columns?: BoardColumn[]) {
  const boardColumns =
    Array.isArray(columns) && columns.length > 0 ? columns : DEFAULT_BOARD_COLUMNS;
  const rejectedColumn =
    boardColumns.find(isRejectedRoleColumn) ||
    boardColumns.find((c) => c.id === STATUS_REJECTED) ||
    boardColumns.find((c) => Boolean(c.is_base && c.system_role !== 'not_contacted'));

  const rejectedStatusId = rejectedColumn ? rejectedColumn.id : REJECTED_STATUS;
  const funnelColumns = boardColumns.filter((c) => c.id !== rejectedStatusId);
  const laneColumnIds = new Set(boardColumns.filter((c) => c.has_lanes).map((c) => c.id));

  return {
    boardColumns,
    rejectedColumn,
    rejectedStatusId,
    funnelColumns,
    laneColumnIds,
  };
}

export function computeDropIndex(e: React.DragEvent<HTMLElement>): number {
  const cards = Array.from(
    e.currentTarget.querySelectorAll('.kanban-card:not(.is-dragging), article:not(.is-dragging)')
  );
  let index = 0;
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (e.clientY > rect.top + rect.height / 2) {
      index += 1;
    }
  }
  return index;
}

export function computeLaneOptions(columnVacancies: Vacancy[]): {
  laneCount: number;
  laneOptions: number[];
} {
  const maxLaneInCol = columnVacancies.reduce((m, v) => Math.max(m, v.lane || 0), 0);
  const laneCount = Math.max(1, maxLaneInCol + 1);
  const laneOptions = Array.from({ length: laneCount }, (_, i) => i);
  laneOptions.push(laneCount);
  return { laneCount, laneOptions };
}

export function buildReorderedIds(
  vacancies: Vacancy[],
  columnId: string,
  vid: number,
  targetIndex: number | null
): number[] {
  const ids = sortByManualOrder(vacancies.filter((v) => v.status === columnId))
    .map((v) => v.id)
    .filter((id) => id !== vid);
  if (targetIndex !== null) {
    ids.splice(Math.min(targetIndex, ids.length), 0, vid);
  } else {
    ids.push(vid);
  }
  return ids;
}
