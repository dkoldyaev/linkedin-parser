import React from 'react';
import { Plus } from 'lucide-react';
import { Table, Icon, Text } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import KanbanFunnelColumn from './KanbanFunnelColumn';
import type { BoardColumn, Vacancy } from '../types/models';
import type { useKanbanDragAndDrop } from './useKanbanDragAndDrop';
import styles from './KanbanBoard.module.css';

export interface KanbanFunnelSectionProps {
  boardRef: React.RefObject<HTMLDivElement | null>;
  boardHeight: number | null;
  funnelColumns: BoardColumn[];
  boardColumns: BoardColumn[];
  laneColumnIds: Set<string>;
  vacancies: Vacancy[];
  selectedIds: number[];
  dnd: ReturnType<typeof useKanbanDragAndDrop>;
  activeMenuColId: string | null;
  onToggleMenu: (colId: string) => void;
  onEditColumn: (col: BoardColumn) => void;
  onDeleteColumn: (col: BoardColumn) => void;
  onCardClick: (vacancy: Vacancy) => void;
  onStatusChange: (vacancyId: number, newStatus: string, lane?: number) => void;
  onToggleSelect?: (vacancyId: number) => void;
  onOpenCreate: () => void;
  snapScroll: (event: React.UIEvent<HTMLElement>, axis?: 'x' | 'y') => void;
  hiddenVacancyIds?: Set<number>;
}

const PLUS_ICON = <Icon icon={Plus} size="xs" />;

export default function KanbanFunnelSection({
  boardRef,
  boardHeight,
  funnelColumns,
  boardColumns,
  laneColumnIds,
  vacancies,
  selectedIds,
  dnd,
  activeMenuColId,
  onToggleMenu,
  onEditColumn,
  onDeleteColumn,
  onCardClick,
  onStatusChange,
  onToggleSelect,
  onOpenCreate,
  snapScroll,
  hiddenVacancyIds,
}: KanbanFunnelSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const addColLabel = t('kanban.add_column');

  return (
    <Table
      ref={boardRef}
      layout="columns"
      bordered
      snapScroll
      fullHeight={!boardHeight}
      quantizeColumns
      style={boardHeight ? { height: boardHeight, flex: 'none' } : undefined}
      onScroll={(event) => snapScroll(event, 'x')}
      onDragStart={(e) => dnd.setDraggingId(Number(e.dataTransfer.getData('text/plain')) || null)}
      onDragEnd={dnd.resetDragState}
    >
      {funnelColumns.map((col, colIndex) => (
        <KanbanFunnelColumn
          key={col.id}
          col={col}
          colIndex={colIndex}
          vacancies={vacancies}
          boardColumns={boardColumns}
          laneColumnIds={laneColumnIds}
          selectedIds={selectedIds}
          draggingId={dnd.draggingId}
          dragOverColumn={dnd.dragOverColumn}
          dropIndex={dnd.dropIndex}
          dragOverLane={dnd.dragOverLane}
          activeMenuColId={activeMenuColId}
          onToggleMenu={onToggleMenu}
          onEditColumn={onEditColumn}
          onDeleteColumn={onDeleteColumn}
          onCardClick={onCardClick}
          onStatusChange={onStatusChange}
          onToggleSelect={onToggleSelect}
          onDragOver={dnd.handleDragOver}
          onDragLeave={dnd.handleDragLeave}
          onDrop={dnd.handleDrop}
          onLaneDragOver={dnd.handleLaneDragOver}
          snapScroll={snapScroll}
          hiddenVacancyIds={hiddenVacancyIds}
        />
      ))}

      <div data-fixed-rail className={styles.addColumnCol}>
        <button
          type="button"
          className={styles.addColumnBtn}
          onClick={onOpenCreate}
          aria-label={addColLabel}
        >
          <span className={styles.addColumnText}>
            {PLUS_ICON}
            <Text variant="mono">
              {addColLabel.toUpperCase()}
            </Text>
          </span>
        </button>
      </div>
    </Table>
  );
}
