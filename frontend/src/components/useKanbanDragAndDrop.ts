import { useState } from 'react';
import type React from 'react';
import { trackEvent, EVENTS } from '../utils/analytics';
import { buildReorderedIds, computeDropIndex } from './kanbanBoardHelpers';
import type { DropDispatchArgs, KanbanBoardProps } from './kanban.types';

function handleMultiCardDrop(args: DropDispatchArgs): boolean {
  if (!args.onStatusChangeMulti) return false;
  if (args.selectedIds.length <= 1 || !args.selectedIds.includes(args.vid)) return false;

  args.selectedIds.forEach((id) => {
    trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
      vacancy_id: id,
      to_status: args.columnId,
      method: 'drag_and_drop_multi',
    });
  });
  args.onStatusChangeMulti(args.selectedIds, args.columnId, args.lane);
  return true;
}

function handleReorderCardDrop(args: DropDispatchArgs, draggedStatus: string): boolean {
  if (!args.onReorder || args.laneColumnIds.has(args.columnId)) return false;
  const ids = buildReorderedIds(args.vacancies, args.columnId, args.vid, args.targetIndex);
  const method = draggedStatus === args.columnId ? 'drag_reorder' : 'drag_and_drop';
  trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
    vacancy_id: args.vid,
    to_status: args.columnId,
    method,
  });
  args.onReorder(args.columnId, ids, args.lane, args.vid);
  return true;
}

function dispatchCardDrop(args: DropDispatchArgs): void {
  const dragged = args.vacancies.find((v) => v.id === args.vid);
  if (!dragged) return;
  if (handleMultiCardDrop(args)) return;
  if (handleReorderCardDrop(args, dragged.status)) return;

  trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
    vacancy_id: args.vid,
    to_status: args.columnId,
    method: 'drag_and_drop',
  });
  args.onStatusChange(args.vid, args.columnId, args.lane);
}

function resolveTargetLane(
  forcedLane: number | null | undefined,
  columnId: string,
  laneColumnIds: Set<string>,
  dragOverLane: number
): number {
  if (forcedLane !== null && forcedLane !== undefined) return forcedLane;
  return laneColumnIds.has(columnId) ? dragOverLane : 0;
}

function resolveTargetDropIndex(
  e: React.DragEvent<HTMLElement>,
  columnId: string,
  rejectedStatusId: string,
  laneColumnIds: Set<string>
): number | null {
  if (columnId === rejectedStatusId || laneColumnIds.has(columnId)) return null;
  return computeDropIndex(e);
}

export function parseDraggedVacancyId(e: React.DragEvent<HTMLElement>): number | null {
  const raw = e.dataTransfer.getData('text/plain');
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function useKanbanDragAndDrop(
  props: KanbanBoardProps,
  rejectedStatusId: string,
  laneColumnIds: Set<string>
) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragOverLane, setDragOverLane] = useState<number>(0);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const resetDragState = () => {
    setDraggingId(null);
    setDragOverColumn(null);
    setDropIndex(null);
    setDragOverLane(0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
    const idx = resolveTargetDropIndex(e, columnId, rejectedStatusId, laneColumnIds);
    if (idx !== null) {
      setDropIndex((prev) => (prev === idx ? prev : idx));
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>, columnId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
      setDropIndex(null);
      setDragOverLane(0);
    }
  };

  const handleLaneDragOver = (e: React.DragEvent<HTMLElement>, columnId: string, lane: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(columnId);
    setDragOverLane(lane);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLElement>,
    columnId: string,
    forcedLane?: number | null
  ) => {
    e.preventDefault();
    const lane = resolveTargetLane(forcedLane, columnId, laneColumnIds, dragOverLane);
    const targetIndex = resolveTargetDropIndex(e, columnId, rejectedStatusId, laneColumnIds);

    setDragOverColumn(null);
    setDropIndex(null);
    setDragOverLane(0);

    const vid = parseDraggedVacancyId(e);
    if (vid === null) return;

    dispatchCardDrop({
      vid,
      columnId,
      lane,
      targetIndex,
      vacancies: props.vacancies,
      selectedIds: props.selectedIds || [],
      laneColumnIds,
      onStatusChange: props.onStatusChange,
      onStatusChangeMulti: props.onStatusChangeMulti,
      onReorder: props.onReorder,
    });
  };

  return {
    dragOverColumn,
    dropIndex,
    dragOverLane,
    draggingId,
    setDraggingId,
    resetDragState,
    handleDragOver,
    handleDragLeave,
    handleLaneDragOver,
    handleDrop,
  };
}
