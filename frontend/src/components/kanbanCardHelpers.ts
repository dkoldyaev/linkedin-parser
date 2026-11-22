import {
  STATUS_NOT_CONTACTED,
  STATUS_CONTACTED,
  STATUS_INTERVIEW,
  STATUS_ASSESSMENT,
  STATUS_OFFER,
  STATUS_REJECTED,
} from '../constants/columns';
import type { BoardColumn, Vacancy } from '../types/models';

export type ColumnLike = BoardColumn | string;

export const DEFAULT_CARD_COLUMNS: string[] = [
  STATUS_NOT_CONTACTED,
  STATUS_CONTACTED,
  STATUS_INTERVIEW,
  STATUS_ASSESSMENT,
  STATUS_OFFER,
];

export function extractColId(col: ColumnLike): string {
  return typeof col === 'string' ? col : col.id;
}

function matchesSystemRole(col: ColumnLike, role: string, fallbackId: string): boolean {
  if (typeof col === 'string') return false;
  if (col.system_role === role) return true;
  return Boolean(col.is_base && (col.id === fallbackId || col.role === role));
}

export function resolveRejectedStatusId(columns: ColumnLike[]): string {
  if (!Array.isArray(columns) || columns.length === 0) return STATUS_REJECTED;
  const byRole = columns.find((c) => matchesSystemRole(c, 'rejected', STATUS_REJECTED));
  if (byRole) return extractColId(byRole);
  const byId = columns.find((c) => extractColId(c) === STATUS_REJECTED);
  return byId ? extractColId(byId) : STATUS_REJECTED;
}

export function resolveInitialStatusId(columns: ColumnLike[]): string {
  if (!Array.isArray(columns) || columns.length === 0) return STATUS_NOT_CONTACTED;
  const byRole = columns.find((c) => matchesSystemRole(c, 'not_contacted', STATUS_NOT_CONTACTED));
  if (byRole) return extractColId(byRole);
  const byId = columns.find((c) => extractColId(c) === STATUS_NOT_CONTACTED);
  return byId ? extractColId(byId) : STATUS_NOT_CONTACTED;
}

export function resolveLinearColumns(columns: ColumnLike[], rejectedStatusId: string): string[] {
  if (!Array.isArray(columns) || columns.length === 0) return DEFAULT_CARD_COLUMNS;
  return columns.map(extractColId).filter((id) => id !== rejectedStatusId);
}

const LEGACY_STATUS_ALIAS: Record<string, string> = {
  interview: STATUS_INTERVIEW,
  not_contacted: STATUS_NOT_CONTACTED,
  contacted: STATUS_CONTACTED,
  assessment: STATUS_ASSESSMENT,
  offer: STATUS_OFFER,
};

function findColumnObject(colId: string, columns: ColumnLike[]): BoardColumn | null {
  if (!Array.isArray(columns)) return null;
  const found = columns.find((c) => extractColId(c) === colId);
  return found && typeof found === 'object' ? found : null;
}

function matchesColumnByRoleOrId(
  colId: string,
  statusLower: string,
  columns: ColumnLike[]
): boolean {
  if (String(colId).toLowerCase() === statusLower) return true;
  if (LEGACY_STATUS_ALIAS[statusLower] === colId) return true;

  const col = findColumnObject(colId, columns);
  if (!col) return false;
  return (
    col.system_role?.toLowerCase() === statusLower ||
    col.role?.toLowerCase() === statusLower
  );
}

export function resolveCurrentIndex(
  vacancyStatus: string | undefined,
  linearColumns: string[],
  columns: ColumnLike[]
): number {
  const statusStr = vacancyStatus || '';
  const directIdx = linearColumns.indexOf(statusStr);
  if (directIdx !== -1) return directIdx;

  const statusLower = String(statusStr).toLowerCase();
  return linearColumns.findIndex((colId) =>
    matchesColumnByRoleOrId(colId, statusLower, columns)
  );
}

function isInterviewStatus(status: string | undefined): boolean {
  if (!status) return false;
  if (status === 'interview' || status === STATUS_INTERVIEW) return true;
  return status.toLowerCase().includes('собесед');
}

function resolveAssessmentOrOfferLabel(
  status: string,
  columns: ColumnLike[],
  t: (path: string) => string
): string | undefined {
  const colObj = findColumnObject(status, columns);
  const colId = colObj ? colObj.id : status;
  if (colId !== STATUS_ASSESSMENT && colId !== STATUS_OFFER) return undefined;
  const label = t(`kanban.columns.${colId}`) || colObj?.name || colId;
  return label.toUpperCase();
}

export function resolveStageLabel(
  vacancy: Vacancy,
  columns: ColumnLike[],
  laneColumns: Set<string>,
  t: (path: string, params?: Record<string, string | number>) => string
): string | undefined {
  if (laneColumns.has(vacancy.status) && vacancy.lane != null) {
    return t('kanban.stage_badge', { n: (vacancy.lane || 0) + 1 });
  }
  if (isInterviewStatus(vacancy.status)) {
    return 'INTERVIEW';
  }
  return resolveAssessmentOrOfferLabel(vacancy.status, columns, t);
}

export function resolveScoreTone(
  matchScore: number | undefined
): 'neutral' | 'success' | 'warning' | 'danger' {
  if (matchScore === undefined) return 'neutral';
  if (matchScore >= 75) return 'success';
  if (matchScore >= 50) return 'warning';
  return 'danger';
}
