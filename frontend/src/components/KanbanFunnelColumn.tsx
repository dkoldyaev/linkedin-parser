import {
  Badge,
  EmptyState,
  Icon,
  StatusDot,
  TableBody,
  TableCol,
  TableHeader,
  Text,
} from '@blueprint/ui-kit';
import type { BoardColumn, Vacancy } from '../types/models';
import { BASE_STATUSES } from '../constants/columns';
import { Inbox } from 'lucide-react';
import KanbanCard from './KanbanCard';
import KanbanColumnMenu from './KanbanColumnMenu';
import type { KanbanFunnelColumnProps } from './kanban.types';
import KanbanLanesDropOverlay from './KanbanLanesDropOverlay';
import React from 'react';
import { sortByManualOrder } from './kanbanBoardHelpers';
import { useTranslation } from '../i18n/I18nContext';

export type { KanbanFunnelColumnProps };

const INBOX_ICON = <Icon icon={Inbox} size="md" />;

function prepareColumnVacancies(
  vacancies: Vacancy[],
  colId: string,
  isLaneColumn: boolean,
): Vacancy[] {
  const filtered = sortByManualOrder(vacancies.filter((v) => v.status === colId));
  if (isLaneColumn) {
    filtered.sort((a, b) => (b.lane ?? 0) - (a.lane ?? 0));
  }
  return filtered;
}

function buildCardsWithIndicator(
  columnVacancies: Vacancy[],
  showIndicator: boolean,
  props: KanbanFunnelColumnProps,
): React.ReactNode[] {
  const cardsWithIndicator: React.ReactNode[] = [];
  const hiddenVacancyIds = props.hiddenVacancyIds || new Set<number>();
  let visibleIndex = 0;
  const pushIndicator = () =>
    cardsWithIndicator.push(<div key="drop-indicator" className="drop-indicator" />);

  columnVacancies.forEach((vacancy) => {
    const isDragged = vacancy.id === props.draggingId;
    const isHidden = hiddenVacancyIds.has(vacancy.id);
    if (showIndicator && !isDragged && !isHidden && props.dropIndex === visibleIndex) {
      pushIndicator();
    }
    cardsWithIndicator.push(
      <KanbanCard
        key={vacancy.id}
        vacancy={vacancy}
        onClick={props.onCardClick}
        onStatusChange={props.onStatusChange}
        isSelected={props.selectedIds.includes(vacancy.id)}
        onToggleSelect={props.onToggleSelect}
        columns={props.boardColumns}
        laneColumns={props.laneColumnIds}
        isHidden={isHidden}
      />,
    );
    if (!isDragged && !isHidden) visibleIndex += 1;
  });

  if (showIndicator && (props.dropIndex ?? 0) >= visibleIndex) {
    pushIndicator();
  }
  return cardsWithIndicator;
}

function computeFunnelColumnVisibility(
  isLaneColumn: boolean,
  isDragOverThis: boolean,
  dropIndex: number | null,
  draggingId: number | null,
) {
  const showIndicator = !isLaneColumn && isDragOverThis && dropIndex !== null;
  const showLanesOverlay = isLaneColumn && draggingId !== null && isDragOverThis;
  return { showIndicator, showLanesOverlay };
}

function resolveColumnName(col: BoardColumn, t: (path: string) => string): string {
  if (col.is_base) {
    const key = `kanban.columns.${col.id}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return col.name || col.id;
}

export default function KanbanFunnelColumn(props: KanbanFunnelColumnProps): React.ReactElement {
  const { t } = useTranslation();
  const { col, laneColumnIds, dragOverColumn, draggingId, dropIndex } = props;

  const isLaneColumn = laneColumnIds.has(col.id);
  const columnVacancies = prepareColumnVacancies(props.vacancies, col.id, isLaneColumn);
  const isDragOverThis = dragOverColumn === col.id;
  const hiddenVacancyIds = props.hiddenVacancyIds || new Set<number>();
  const visibleColumnCount = columnVacancies.reduce(
    (acc, v) => acc + (hiddenVacancyIds.has(v.id) ? 0 : 1),
    0,
  );
  const { showIndicator, showLanesOverlay } = computeFunnelColumnVisibility(
    isLaneColumn,
    isDragOverThis,
    dropIndex,
    draggingId,
  );
  const showEmptyState = columnVacancies.length === 0 && !showIndicator;
  const cardsWithIndicator = buildCardsWithIndicator(columnVacancies, showIndicator, props);
  const columnName = resolveColumnName(col, t);

  const menuSlot = (
    <KanbanColumnMenu
      col={col}
      isBase={BASE_STATUSES.includes(col.id)}
      isMenuOpen={props.activeMenuColId === col.id}
      onToggleMenu={props.onToggleMenu}
      onEdit={props.onEditColumn}
      onDelete={props.onDeleteColumn}
    />
  );

  return (
    <TableCol
      className="kanban-column"
      onDragOver={(e) => props.onDragOver(e, col.id)}
      onDragLeave={(e) => props.onDragLeave(e, col.id)}
      onDrop={(e) => props.onDrop(e, col.id)}
    >
      <TableHeader size="sm" actions={menuSlot}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
          <StatusDot color={col.color || '#2563eb'} size="sm" />
          <Text variant="mono" weight="bold">
            {columnName}
          </Text>
          <Badge variant="subtle" size="sm">
            {visibleColumnCount}
          </Badge>
        </div>
      </TableHeader>

      <TableBody
        snapScroll
        onScroll={(event) => props.snapScroll(event, 'y')}
        className="kanban-cards-lane"
      >
        {showEmptyState ? (
          <EmptyState icon={INBOX_ICON} title={t('kanban.no_vacancies')} />
        ) : (
          cardsWithIndicator
        )}

        {showLanesOverlay && (
          <KanbanLanesDropOverlay
            colId={col.id}
            columnVacancies={columnVacancies}
            dragOverLane={props.dragOverLane}
            onLaneDragOver={(e, lane) => props.onLaneDragOver(e, col.id, lane)}
            onDrop={props.onDrop}
          />
        )}
      </TableBody>
    </TableCol>
  );
}
