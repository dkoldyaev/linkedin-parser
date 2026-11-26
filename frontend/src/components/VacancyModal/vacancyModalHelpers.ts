import type {
  BoardColumn,
  CompatibilityAnalysis,
  CriticalGap,
  MatchedRequirement,
  MissingRequirement,
  Vacancy,
  VacancyHistoryItem,
} from '../../types/models';
import { DEFAULT_COLUMNS, STATUS_REJECTED } from '../../constants/columns';
import type { FormatDateFn, TranslateFn } from '../../i18n/I18nContext';
import type { ReportSectionGroup, SemanticTone } from '@blueprint/ui-kit';

export function normalizeModalColumns(columns?: Array<BoardColumn | string>): BoardColumn[] {
  if (!Array.isArray(columns) || columns.length === 0) return DEFAULT_COLUMNS;
  return columns.map((c) => (typeof c === 'string' ? { id: c, name: c } : c));
}

function isRejectedRoleCol(c: BoardColumn): boolean {
  if (c.system_role === 'rejected') return true;
  return Boolean(c.is_base && (c.id === STATUS_REJECTED || c.role === 'rejected'));
}

export function resolveModalRejectedStatusId(modalColumns: BoardColumn[]): string {
  const found =
    modalColumns.find(isRejectedRoleCol) ||
    modalColumns.find((c) => c.id === STATUS_REJECTED) ||
    modalColumns.find((c) => Boolean(c.is_base && c.system_role !== 'not_contacted'));
  return found ? found.id : STATUS_REJECTED;
}

export function formatStageLabel(
  colId: string,
  lane: number | null | undefined,
  modalColumns: BoardColumn[],
  t: TranslateFn,
): string {
  const colName = t(`kanban.columns.${colId}`) || colId;
  const colObj = modalColumns.find((c) => c.id === colId);
  if (colObj?.has_lanes && lane != null) {
    return `${colName} · ${t('kanban.stage_badge', { n: lane + 1 })}`;
  }
  return colName;
}

export function buildHistoryItems(
  historyList: VacancyHistoryItem[] | undefined,
  modalColumns: BoardColumn[],
  t: TranslateFn,
  formatDate: FormatDateFn,
) {
  return (historyList || []).map((h, idx) => ({
    id: String(h.id || idx),
    label: formatStageLabel(h.to_status, h.to_lane, modalColumns, t),
    fromLabel: h.from_status
      ? formatStageLabel(h.from_status, h.from_lane, modalColumns, t)
      : undefined,
    timestamp: formatDate(h.created_at, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    tone: 'accent' as const,
    comment: h.comment || '',
  }));
}

function buildMatchedSection(matched: MatchedRequirement[], t: TranslateFn): ReportSectionGroup {
  return {
    id: 'matched',
    title: t('vacancyModal.compat_matched', { count: matched.length }),
    tone: 'mint',
    items: matched.map((m, idx) => ({
      id: `m_${idx}`,
      title: m.requirement,
      content: m.evidence || '',
      actionLabel: t('vacancyModal.compat_evidence'),
    })),
  };
}

function resolveSeverityLabel(severity: string | undefined, t: TranslateFn): string {
  const normalized = severity || 'medium';
  const key = `vacancyModal.compat_severity.${normalized}`;
  const translated = t(key);
  return translated !== key ? translated : normalized;
}

function buildMissingSection(missing: MissingRequirement[], t: TranslateFn): ReportSectionGroup {
  return {
    id: 'missing',
    title: t('vacancyModal.compat_missing', { count: missing.length }),
    tone: 'warning',
    items: missing.map((m, idx) => ({
      id: `missing_${idx}`,
      title: m.requirement,
      content: m.reason || '',
      actionLabel: resolveSeverityLabel(m.severity, t),
    })),
  };
}

function formatGapTitle(g: CriticalGap | string): string {
  if (typeof g === 'string') return g;
  return g.gap || g.requirement || '';
}

function formatGapContent(g: CriticalGap | string): string {
  if (typeof g === 'string') return '';
  return g.impact || g.reason || '';
}

function buildGapsSection(gaps: Array<CriticalGap | string>, t: TranslateFn): ReportSectionGroup {
  return {
    id: 'gaps',
    title: t('vacancyModal.compat_gaps'),
    tone: 'danger',
    defaultExpandedIds: gaps.map((_, idx) => `gap_${idx}`),
    items: gaps.map((g, idx) => ({
      id: `gap_${idx}`,
      title: formatGapTitle(g),
      content: formatGapContent(g),
      actionLabel: t('vacancyModal.compat_severity.critical'),
    })),
  };
}

function pushSectionIfPresent<T>(
  list: ReportSectionGroup[],
  items: T[] | undefined,
  buildFn: (arr: T[], t: TranslateFn) => ReportSectionGroup,
  t: TranslateFn,
) {
  if (items && items.length > 0) {
    list.push(buildFn(items, t));
  }
}

export function buildCompatibilitySections(
  compatibility: CompatibilityAnalysis | null | undefined,
  t: TranslateFn,
): ReportSectionGroup[] {
  if (!compatibility) return [];
  const sections: ReportSectionGroup[] = [];
  pushSectionIfPresent(sections, compatibility.matched_requirements, buildMatchedSection, t);
  pushSectionIfPresent(sections, compatibility.missing_requirements, buildMissingSection, t);
  pushSectionIfPresent(sections, compatibility.critical_gaps, buildGapsSection, t);
  return sections;
}

export function buildRecommendationsList(
  compatibility: CompatibilityAnalysis | null | undefined,
): string[] {
  return (compatibility?.recommendations || [])
    .map((r) => (typeof r === 'string' ? r : r.text || r.title || ''))
    .filter(Boolean);
}

export function resolveCompatScoreTone(displayScore: number | undefined | null): SemanticTone {
  if (displayScore == null) return 'neutral';
  if (displayScore >= 70) return 'success';
  if (displayScore >= 45) return 'warning';
  return 'danger';
}

const SENIORITY_TONE_MAP: Record<string, 'success' | 'warning' | 'danger'> = {
  matched: 'success',
  partially_matched: 'warning',
};

function resolveSeniorityStatusLabel(status: string | undefined, t: TranslateFn): string {
  if (!status) return '';
  return t(`vacancyModal.compat_seniority_status.${status}`) || status;
}

export function resolveSeniorityInfo(
  compatibility: CompatibilityAnalysis | null | undefined,
  t: TranslateFn,
): {
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'danger';
  comment?: string;
} {
  const assessment = compatibility?.seniority_assessment;
  const status = assessment?.status;
  const statusTone = status ? SENIORITY_TONE_MAP[status] || 'danger' : 'danger';
  return {
    statusLabel: resolveSeniorityStatusLabel(status, t),
    statusTone,
    comment: assessment?.comment,
  };
}

export function computeVacancyMatchScore(vacancy: Vacancy): number | undefined {
  const rawScore = vacancy.calculated_score ?? vacancy.match_score;
  return rawScore != null ? Math.round(rawScore) : undefined;
}
