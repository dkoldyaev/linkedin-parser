import React, { useRef, useState } from 'react';
import { resolveBoardColumnsConfig, sortByManualOrder } from './kanbanBoardHelpers';
import ColumnCreateModal from './ColumnCreateModal';
import ColumnDeleteModal from './ColumnDeleteModal';
import ColumnEditModal from './ColumnEditModal';
import { DEFAULT_COLUMNS as DEFAULT_BOARD_COLUMNS } from '../constants/columns';
import type { KanbanBoardProps } from './kanban.types';
import KanbanFunnelSection from './KanbanFunnelSection';
import KanbanRejectedSection from './KanbanRejectedSection';
import { useBoardHeight } from './useBoardHeight';
import { useColumnCrudModals } from './useColumnCrudModals';
import { useGridScroll } from '../utils/useGridScroll';
import { useKanbanDragAndDrop } from './useKanbanDragAndDrop';

export type { KanbanBoardProps };

const WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

export default function KanbanBoard(props: KanbanBoardProps): React.ReactElement {
  const {
    vacancies,
    columns = DEFAULT_BOARD_COLUMNS,
    onColumnsChange,
    selectedIds = [],
    hiddenVacancyIds = new Set<number>(),
  } = props;
  const snapScroll = useGridScroll();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const rejectedRef = useRef<HTMLDivElement | null>(null);
  const [isRejectedCollapsed, setIsRejectedCollapsed] = useState(true);

  const boardHeight = useBoardHeight(wrapperRef, rejectedRef);
  const colCfg = resolveBoardColumnsConfig(columns);
  const dnd = useKanbanDragAndDrop(props, colCfg.rejectedStatusId, colCfg.laneColumnIds);
  const modals = useColumnCrudModals(onColumnsChange);
  const rejectedVacancies = sortByManualOrder(
    vacancies.filter((v) => v.status === colCfg.rejectedStatusId),
  );
  const deletingVacanciesCount = modals.deletingColumn
    ? vacancies.filter((v) => v.status === modals.deletingColumn?.id).length
    : 0;

  return (
    <div className="kanban-wrapper" ref={wrapperRef} style={WRAPPER_STYLE}>
      <KanbanFunnelSection
        boardRef={boardRef}
        boardHeight={boardHeight}
        funnelColumns={colCfg.funnelColumns}
        boardColumns={colCfg.boardColumns}
        laneColumnIds={colCfg.laneColumnIds}
        vacancies={vacancies}
        selectedIds={selectedIds}
        dnd={dnd}
        activeMenuColId={modals.activeMenuColId}
        onToggleMenu={modals.handleToggleMenu}
        onEditColumn={modals.handleEditCol}
        onDeleteColumn={modals.handleDeleteCol}
        onCardClick={props.onCardClick}
        onStatusChange={props.onStatusChange}
        onToggleSelect={props.onToggleSelect}
        onOpenCreate={() => modals.setIsCreateOpen(true)}
        snapScroll={snapScroll}
        hiddenVacancyIds={hiddenVacancyIds}
      />

      <KanbanRejectedSection
        ref={rejectedRef}
        rejectedColumn={colCfg.rejectedColumn}
        rejectedStatusId={colCfg.rejectedStatusId}
        rejectedVacancies={rejectedVacancies}
        boardColumns={colCfg.boardColumns}
        laneColumnIds={colCfg.laneColumnIds}
        selectedIds={selectedIds}
        isRejectedCollapsed={isRejectedCollapsed}
        onToggleCollapse={() => setIsRejectedCollapsed((prev) => !prev)}
        onCardClick={props.onCardClick}
        onStatusChange={props.onStatusChange}
        onDragOver={dnd.handleDragOver}
        onDragLeave={dnd.handleDragLeave}
        onDrop={dnd.handleDrop}
        hiddenVacancyIds={hiddenVacancyIds}
      />

      <ColumnCreateModal
        isOpen={modals.isCreateOpen}
        onClose={() => modals.setIsCreateOpen(false)}
        onCreate={modals.handleCreateColumn}
      />
      <ColumnEditModal
        isOpen={Boolean(modals.editingColumn)}
        column={modals.editingColumn}
        onClose={() => modals.setEditingColumn(null)}
        onSave={modals.handleSaveColumn}
      />
      <ColumnDeleteModal
        isOpen={Boolean(modals.deletingColumn)}
        column={modals.deletingColumn}
        availableColumns={colCfg.funnelColumns}
        vacanciesCount={deletingVacanciesCount}
        onClose={() => modals.setDeletingColumn(null)}
        onDelete={modals.handleDeleteColumn}
      />
    </div>
  );
}
