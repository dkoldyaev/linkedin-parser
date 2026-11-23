'use client';

import React from 'react';
import { Card } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { getWorkplaceInfo } from '../utils/workplace';
import KanbanCardTokens from './KanbanCardTokens';
import KanbanCardMetaRow from './KanbanCardMetaRow';
import KanbanCardFooterContent from './KanbanCardFooterContent';
import KanbanCardStatusIndicators from './KanbanCardStatusIndicators';
import KanbanCardSummary from './KanbanCardSummary';
import {
  resolveRejectedStatusId,
  resolveInitialStatusId,
  resolveLinearColumns,
  resolveCurrentIndex,
  resolveStageLabel,
} from './kanbanCardHelpers';
import type { KanbanCardProps, CardHandlerOptions, ColumnLike } from './kanbanCard.types';
import type { Vacancy } from '../types/models';

export type { KanbanCardProps };

const DEFAULT_CARD_COLUMNS: ColumnLike[] = [];
const DEFAULT_LANE_COLUMNS: Set<string> = new Set<string>();

function isVacancyRejected(status?: string, rejectedId?: string): boolean {
  return status === rejectedId || status === 'rejected';
}

function createCardHandlers(opts: CardHandlerOptions) {
  const {
    vacancy,
    currentIndex,
    linearColumns,
    rejectedStatusId,
    initialStatusId,
    onClick,
    onStatusChange,
  } = opts;

  return {
    handleMoveLeft: () => {
      if (currentIndex > 0) onStatusChange?.(vacancy.id, linearColumns[currentIndex - 1]);
    },
    handleMoveRight: () => {
      if (currentIndex < linearColumns.length - 1) onStatusChange?.(vacancy.id, linearColumns[currentIndex + 1]);
    },
    handleMoveRejected: () => {
      if (rejectedStatusId) onStatusChange?.(vacancy.id, rejectedStatusId);
    },
    handleRestoreRejected: () => {
      if (initialStatusId) onStatusChange?.(vacancy.id, initialStatusId);
    },
    handleCardClick: () => {
      onClick?.(vacancy);
    },
    handleDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', String(vacancy.id));
      e.dataTransfer.setData('application/json', JSON.stringify({
        id: vacancy.id,
        currentStatus: vacancy.status,
        // hasSalary,
      }));
      e.dataTransfer.effectAllowed = 'move';
    },
    handleDragEnd: (e: React.DragEvent) => {
      e.dataTransfer.clearData();
    },
  };
}

function computeMatchScore(vacancy: Vacancy): number | undefined {
  const rawScore = vacancy.calculated_score ?? vacancy.match_score;
  return rawScore != null ? Math.round(rawScore) : undefined;
}

function resolveMovementLimits(index: number, total: number) {
  return {
    canMoveLeft: index > 0,
    canMoveRight: index < total - 1,
  };
}

function deriveCardState(
  vacancy: Vacancy,
  columns: ColumnLike[],
  laneColumns: Set<string>,
  t: (path: string, params?: Record<string, string | number>) => string
) {
  const rejectedStatusId = resolveRejectedStatusId(columns);
  const initialStatusId = resolveInitialStatusId(columns);
  const isRejected = isVacancyRejected(vacancy.status, rejectedStatusId);
  const linearColumns = resolveLinearColumns(columns, rejectedStatusId);
  const currentIndex = resolveCurrentIndex(vacancy.status, linearColumns, columns);
  const stageLabel = resolveStageLabel(vacancy, columns, laneColumns, t);
  const movement = resolveMovementLimits(currentIndex, linearColumns.length);

  return {
    rejectedStatusId,
    initialStatusId,
    isRejected,
    linearColumns,
    currentIndex,
    stageLabel,
    movement,
  };
}

export default function KanbanCard({
  vacancy,
  onClick,
  onStatusChange,
  isSelected = false,
  onToggleSelect,
  columns = DEFAULT_CARD_COLUMNS,
  laneColumns = DEFAULT_LANE_COLUMNS,
  compact: propCompact,
}: KanbanCardProps): React.ReactElement {
  const { t } = useTranslation();
  const cardState = deriveCardState(vacancy, columns, laneColumns, t);
  const isCompact = propCompact ?? cardState.isRejected;
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);
  const matchScore = computeMatchScore(vacancy);

  const handlers = createCardHandlers({
    vacancy,
    currentIndex: cardState.currentIndex,
    linearColumns: cardState.linearColumns,
    rejectedStatusId: cardState.rejectedStatusId,
    initialStatusId: cardState.initialStatusId,
    onClick,
    onStatusChange,
  });

  return (
    <Card
      compact={isCompact}
      matchScore={matchScore}
      selected={isSelected}
      interactive
      onClick={handlers.handleCardClick}
      draggable
      onDragStart={handlers.handleDragStart}
      onDragEnd={handlers.handleDragEnd}
      data-bp-card="true"
      data-id={vacancy.id}
      title={vacancy.title}
      overline={vacancy.company}
      overlineHref={vacancy.url}
      selectable
      checked={isSelected}
      onCheckedChange={() => onToggleSelect?.(vacancy.id)}
      checkboxAriaLabel={t('kanban.select_card')}
      statusIndicators={
        <KanbanCardStatusIndicators
          stageLabel={cardState.stageLabel}
          isClosed={Boolean(vacancy.is_closed)}
        />
      }
      footer={
        <KanbanCardFooterContent
          vacancy={vacancy}
          isRejected={cardState.isRejected}
          canMoveLeft={cardState.movement.canMoveLeft}
          canMoveRight={cardState.movement.canMoveRight}
          onMoveLeft={handlers.handleMoveLeft}
          onMoveRight={handlers.handleMoveRight}
          onMoveRejected={handlers.handleMoveRejected}
          onRestoreRejected={handlers.handleRestoreRejected}
        />
      }
    >
      <KanbanCardMetaRow
        matchScore={matchScore}
        workplaceType={vacancy.workplace_type}
        location={vacancy.location}
        salaryMin={vacancy.salary_min}
        salaryMax={vacancy.salary_max}
        salaryCurrency={vacancy.salary_currency}
        salaryPeriod={vacancy.salary_period}
      />
      <KanbanCardSummary summary={vacancy.ai_summary} />
      <KanbanCardTokens techStack={vacancy.tech_stack} tags={vacancy.tags} />
    </Card>
  );
}
