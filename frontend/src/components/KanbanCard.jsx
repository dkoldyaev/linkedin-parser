import React from 'react';
import { VacancyCard } from '@blueprint/ui-kit';
import { getSalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import {
  STATUS_NOT_CONTACTED,
  STATUS_CONTACTED,
  STATUS_INTERVIEW,
  STATUS_ASSESSMENT,
  STATUS_OFFER,
  STATUS_REJECTED,
} from '../constants/columns';

const DEFAULT_COLUMNS = [
  STATUS_NOT_CONTACTED,
  STATUS_CONTACTED,
  STATUS_INTERVIEW,
  STATUS_ASSESSMENT,
  STATUS_OFFER,
];

export default function KanbanCard({
  vacancy,
  onClick,
  onStatusChange,
  isSelected,
  onToggleSelect,
  columns = DEFAULT_COLUMNS,
  laneColumns = new Set([STATUS_INTERVIEW, STATUS_ASSESSMENT])
}) {
  const { t, formatDate, salaryDisplayFormat, salaryTargetCurrency, exchangeRates } = useTranslation();

  const rejectedColumn = Array.isArray(columns)
    ? columns.find(c => c.system_role === 'rejected' || (c.is_base && (c.id === STATUS_REJECTED || c.role === 'rejected'))) || columns.find(c => c.id === STATUS_REJECTED)
    : null;
  const rejectedStatusId = rejectedColumn ? (typeof rejectedColumn === 'string' ? rejectedColumn : rejectedColumn.id) : STATUS_REJECTED;

  const initialColumn = Array.isArray(columns)
    ? columns.find(c => c.system_role === 'not_contacted' || (c.is_base && (c.id === STATUS_NOT_CONTACTED || c.role === 'not_contacted'))) || columns.find(c => c.id === STATUS_NOT_CONTACTED)
    : null;
  const initialStatusId = initialColumn ? (typeof initialColumn === 'string' ? initialColumn : initialColumn.id) : STATUS_NOT_CONTACTED;

  const isRejected = vacancy.status === rejectedStatusId || vacancy.status === 'rejected' || vacancy.status === STATUS_REJECTED;
  const linearColumns = (Array.isArray(columns) && columns.length > 0)
    ? columns.map(c => typeof c === 'string' ? c : c.id).filter(id => id !== rejectedStatusId)
    : DEFAULT_COLUMNS;

  const resolveCurrentIndex = () => {
    let idx = linearColumns.indexOf(vacancy.status);
    if (idx !== -1) return idx;
    const statusLower = String(vacancy.status || '').toLowerCase();
    return linearColumns.findIndex(colId => {
      const col = Array.isArray(columns) && columns.find(c => (typeof c === 'string' ? c : c.id) === colId);
      if (col && typeof col === 'object') {
        if (col.system_role && col.system_role.toLowerCase() === statusLower) return true;
        if (col.role && col.role.toLowerCase() === statusLower) return true;
      }
      if (String(colId).toLowerCase() === statusLower) return true;
      if (statusLower === 'interview' && colId === STATUS_INTERVIEW) return true;
      if (statusLower === 'not_contacted' && colId === STATUS_NOT_CONTACTED) return true;
      if (statusLower === 'contacted' && colId === STATUS_CONTACTED) return true;
      if (statusLower === 'assessment' && colId === STATUS_ASSESSMENT) return true;
      if (statusLower === 'offer' && colId === STATUS_OFFER) return true;
      return false;
    });
  };
  const currentIndex = resolveCurrentIndex();
  const salaryInfo = getSalaryDisplay(vacancy, t, salaryDisplayFormat, salaryTargetCurrency, exchangeRates);
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);

  const matchScore = vacancy.match_score != null ? Math.round(vacancy.match_score) : undefined;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', vacancy.id.toString());
    e.currentTarget.classList.add('is-dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('is-dragging');
  };

  const handleMoveLeft = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      const targetStatus = linearColumns[currentIndex - 1];
      trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
        vacancy_id: vacancy.id,
        company: vacancy.company,
        from_status: vacancy.status,
        to_status: targetStatus,
        method: 'quick_arrow'
      });
      onStatusChange(vacancy.id, targetStatus);
    }
  };

  const handleMoveRight = (e) => {
    e.stopPropagation();
    if (currentIndex < linearColumns.length - 1) {
      const targetStatus = linearColumns[currentIndex + 1];
      trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
        vacancy_id: vacancy.id,
        company: vacancy.company,
        from_status: vacancy.status,
        to_status: targetStatus,
        method: 'quick_arrow'
      });
      onStatusChange(vacancy.id, targetStatus);
    }
  };

  const handleMoveRejected = (e) => {
    e.stopPropagation();
    trackEvent(EVENTS.VACANCY_MOVE_REJECTED, {
      vacancy_id: vacancy.id,
      company: vacancy.company,
      from_status: vacancy.status,
      method: 'quick_reject_btn'
    });
    onStatusChange(vacancy.id, rejectedStatusId);
  };

  const handleRestoreRejected = (e) => {
    e.stopPropagation();
    trackEvent(EVENTS.VACANCY_RESTORE_REJECTED, {
      vacancy_id: vacancy.id,
      company: vacancy.company,
      to_status: initialStatusId,
      method: 'quick_restore_btn'
    });
    onStatusChange(vacancy.id, initialStatusId);
  };

  const handleCardClick = () => {
    trackEvent(EVENTS.VACANCY_CARD_CLICK, {
      vacancy_id: vacancy.id,
      company: vacancy.company,
      status: vacancy.status,
      is_closed: Boolean(vacancy.is_closed),
      has_salary: salaryInfo.hasSalary
    });
    onClick(vacancy);
  };

  const hasHistory = vacancy.history && vacancy.history.length > 0;
  const hasHistoryComments = hasHistory && vacancy.history.some(h => h.comment);

  const isInterview =
    vacancy.status === 'interview' ||
    vacancy.status === STATUS_INTERVIEW ||
    (typeof vacancy.status === 'string' && vacancy.status.toLowerCase().includes('собесед'));

  const stageLabel = laneColumns.has(vacancy.status) && vacancy.lane != null
    ? t('kanban.stage_badge', { n: (vacancy.lane || 0) + 1 })
    : isInterview
      ? 'INTERVIEW'
      : (() => {
          const col = Array.isArray(columns) && columns.find(c => (typeof c === 'string' ? c : c.id) === vacancy.status);
          const colId = col ? (typeof col === 'string' ? col : col.id) : vacancy.status;
          if (colId === STATUS_ASSESSMENT || colId === STATUS_OFFER) {
            const label = t(`kanban.columns.${colId}`) || (typeof col === 'object' ? col.name : colId);
            return label ? label.toUpperCase() : undefined;
          }
          return undefined;
        })();

  return (
    <VacancyCard
      title={vacancy.title}
      company={vacancy.company}
      sourceUrl={vacancy.url}
      matchScore={matchScore}
      workplace={workplaceInfo?.key || 'remote'}
      workplaceLabel={workplaceInfo?.key === 'remote' ? 'Remote' : (workplaceInfo?.label || 'Remote')}
      location={vacancy.location}
      salary={salaryInfo.hasSalary ? salaryInfo.formatted : undefined}
      summary={vacancy.ai_summary}
      aiPending={!vacancy.ai_summary}
      techStack={vacancy.tech_stack || []}
      tags={vacancy.tags || []}
      date={formatDate(vacancy.created_at)}
      historyCount={hasHistory ? vacancy.history.length : undefined}
      hasHistoryComment={hasHistoryComments}
      isClosed={Boolean(vacancy.is_closed)}
      isRejected={isRejected}
      stageLabel={stageLabel}
      selected={isSelected}
      selectable
      onToggleSelect={() => onToggleSelect && onToggleSelect(vacancy.id)}
      onClick={handleCardClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      canMoveLeft={currentIndex > 0}
      canMoveRight={currentIndex < linearColumns.length - 1}
      onMoveLeft={handleMoveLeft}
      onMoveRight={handleMoveRight}
      onMoveRejected={handleMoveRejected}
      onRestoreRejected={handleRestoreRejected}
      leftLabel={t('kanban.move_left')}
      rightLabel={t('kanban.move_right')}
      rejectLabel={t('kanban.move_to_rejected')}
      restoreLabel={t('kanban.rejected_restore')}
      closedLabel={t('kanban.closed')}
      pendingAiLabel={t('kanban.ai_pending')}
      checkboxAriaLabel={t('kanban.select_card')}
    />
  );
}
