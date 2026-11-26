import { computeLaneOptions } from './kanbanBoardHelpers';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';
import type { Vacancy } from '../types/models';

export interface KanbanLanesDropOverlayProps {
  colId: string;
  columnVacancies: Vacancy[];
  dragOverLane: number | null;
  onLaneDragOver: (e: React.DragEvent<HTMLElement>, laneIndex: number) => void;
  onDrop: (e: React.DragEvent<HTMLElement>, colId: string, lane?: number) => void;
}

export default function KanbanLanesDropOverlay({
  colId,
  columnVacancies,
  dragOverLane,
  onLaneDragOver,
  onDrop,
}: KanbanLanesDropOverlayProps): React.ReactElement {
  const { t } = useTranslation();
  const { laneCount, laneOptions } = computeLaneOptions(columnVacancies);

  return (
    <div className="lanes-overlay">
      {laneOptions.map((l) => {
        const isPlus = l === laneCount;
        const isActive = dragOverLane === l;
        const zoneClass = `lane-dropzone ${isPlus ? 'is-new-lane' : ''} ${isActive ? 'drag-over' : ''}`;
        const label = isPlus ? t('kanban.new_stage') : t('kanban.stage_n', { n: l + 1 });

        return (
          <div
            key={l}
            className={zoneClass}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLaneDragOver(e, l);
            }}
            onDrop={(e) => {
              e.stopPropagation();
              onDrop(e, colId, l);
            }}
          >
            <span className="lane-dropzone-badge">{isPlus ? '+' : l + 1}</span>
            <span className="lane-dropzone-text">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
