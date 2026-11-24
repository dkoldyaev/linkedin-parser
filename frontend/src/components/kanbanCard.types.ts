import type { Vacancy } from '../types/models';

export interface ColumnLike {
  id: string;
  name?: string;
  is_base?: boolean;
  system_role?: string;
  role?: string;
  has_lanes?: boolean;
}

export interface KanbanCardProps {
  vacancy: Vacancy;
  onClick: (vacancy: Vacancy) => void;
  onStatusChange: (vacancyId: number, newStatus: string, lane?: number) => void;
  isSelected?: boolean;
  onToggleSelect?: (vacancyId: number) => void;
  columns?: ColumnLike[];
  laneColumns?: Set<string>;
  compact?: boolean;
  isHidden?: boolean;
}

export interface CardHandlerOptions {
  vacancy: Vacancy;
  currentIndex: number;
  linearColumns: string[];
  rejectedStatusId: string;
  initialStatusId: string;
  onClick: (v: Vacancy) => void;
  onStatusChange: (id: number, to: string) => void;
}
