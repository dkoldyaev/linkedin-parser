import type { BoardColumn, Vacancy } from '../types/models';
import type React from 'react';

export interface KanbanBoardProps {
  vacancies: Vacancy[];
  columns?: BoardColumn[];
  onColumnsChange?: (columns: BoardColumn[]) => void;
  onCardClick: (vacancy: Vacancy) => void;
  onStatusChange: (vacancyId: number, newStatus: string, lane?: number) => void;
  selectedIds?: number[];
  onToggleSelect?: (vacancyId: number) => void;
  onStatusChangeMulti?: (vacancyIds: number[], newStatus: string, lane?: number) => void;
  onReorder?: (columnId: string, ids: number[], lane: number, movedId: number | null) => void;
  hiddenVacancyIds?: Set<number>;
}

export interface KanbanDragState {
  dragOverColumn: string | null;
  dropIndex: number | null;
  dragOverLane: number | null;
  draggingId: number | null;
}

export interface DropDispatchArgs {
  vid: number;
  columnId: string;
  lane: number;
  targetIndex: number | null;
  vacancies: Vacancy[];
  selectedIds: number[];
  laneColumnIds: Set<string>;
  onStatusChange: (vacancyId: number, newStatus: string, lane?: number) => void;
  onStatusChangeMulti?: (vacancyIds: number[], newStatus: string, lane?: number) => void;
  onReorder?: (colId: string, ids: number[], lane: number, movedId: number | null) => void;
}

export interface KanbanFunnelColumnProps {
  col: BoardColumn;
  colIndex: number;
  vacancies: Vacancy[];
  boardColumns: BoardColumn[];
  laneColumnIds: Set<string>;
  selectedIds: number[];
  draggingId: number | null;
  dragOverColumn: string | null;
  dropIndex: number | null;
  dragOverLane: number | null;
  activeMenuColId: string | null;
  onToggleMenu: (colId: string) => void;
  onEditColumn: (col: BoardColumn) => void;
  onDeleteColumn: (col: BoardColumn) => void;
  onCardClick: (v: Vacancy) => void;
  onStatusChange: (vid: number, status: string, lane?: number) => void;
  onToggleSelect?: (vid: number) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>, colId: string, lane?: number) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>, colId: string) => void;
  onDrop: (e: React.DragEvent<HTMLElement>, colId: string, lane?: number) => void;
  onLaneDragOver: (e: React.DragEvent<HTMLElement>, colId: string, lane: number) => void;
  snapScroll: (event: React.UIEvent<HTMLElement>, axis?: 'x' | 'y') => void;
  hiddenVacancyIds?: Set<number>;
}

export interface KanbanRejectedSectionProps {
  rejectedColumn?: BoardColumn;
  rejectedStatusId: string;
  rejectedVacancies: Vacancy[];
  boardColumns: BoardColumn[];
  laneColumnIds: Set<string>;
  selectedIds: number[];
  isRejectedCollapsed: boolean;
  onToggleCollapse: () => void;
  onCardClick: (v: Vacancy) => void;
  onStatusChange: (id: number, status: string, lane?: number) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>, colId: string, lane?: number) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>, colId: string) => void;
  onDrop: (e: React.DragEvent<HTMLElement>, colId: string, lane?: number) => void;
  hiddenVacancyIds?: Set<number>;
}
