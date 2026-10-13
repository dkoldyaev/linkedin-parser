import React, { useState } from 'react';
import KanbanCard from './KanbanCard';
import { useTranslation } from '../i18n/I18nContext';
import { ChevronDown, ChevronUp, Ban } from 'lucide-react';
import { trackEvent, EVENTS } from '../utils/analytics';

const COLUMNS = [
  { id: "Еще не написан", color: "#6366f1" },
  { id: "Написал", color: "#0284c7" },
  { id: "Собеседование", color: "#d97706" },
  { id: "Тестовое", color: "#9333ea" },
  { id: "Оффер", color: "#059669" },
];

const REJECTED_STATUS = "Отказ";

// Columns split vertically into unlimited sections (lanes), Jira-style
const LANE_COLUMNS = new Set(["Собеседование", "Тестовое"]);

// Cards without a manual position stay on top (in the order the API returned them),
// manually positioned cards follow, ordered by sort_order.
const sortByManualOrder = (list) => {
  const unordered = list.filter(v => v.sort_order == null);
  const ordered = list
    .filter(v => v.sort_order != null)
    .sort((a, b) => a.sort_order - b.sort_order);
  return [...unordered, ...ordered];
};

export default function KanbanBoard({ vacancies, onCardClick, onStatusChange, selectedIds = [], onToggleSelect, onStatusChangeMulti, onReorder }) {
  const { t } = useTranslation();
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [dragOverLane, setDragOverLane] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const [isRejectedCollapsed, setIsRejectedCollapsed] = useState(false);

  const rejectedVacancies = sortByManualOrder(vacancies.filter(v => v.status === REJECTED_STATUS));

  // Index at which the dragged card would be inserted, based on cursor Y vs. card midpoints
  const computeDropIndex = (e) => {
    const cards = Array.from(e.currentTarget.querySelectorAll('.kanban-card:not(.is-dragging)'));
    let index = 0;
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height / 2) index += 1;
    }
    return index;
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
    if (columnId !== REJECTED_STATUS && !LANE_COLUMNS.has(columnId)) {
      const idx = computeDropIndex(e);
      setDropIndex(prev => (prev === idx ? prev : idx));
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
      setDropIndex(null);
      setDragOverLane(0);
    }
  };

  const handleLaneDragOver = (e, columnId, lane) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(columnId);
    setDragOverLane(lane);
  };

  const handleDrop = (e, columnId, forcedLane = null) => {
    e.preventDefault();
    const lane = forcedLane !== null ? forcedLane : (LANE_COLUMNS.has(columnId) ? dragOverLane : 0);
    const targetIndex = (columnId !== REJECTED_STATUS && !LANE_COLUMNS.has(columnId)) ? computeDropIndex(e) : null;
    setDragOverColumn(null);
    setDropIndex(null);
    setDragOverLane(0);
    const vacancyId = e.dataTransfer.getData('text/plain');
    if (vacancyId) {
      const vid = parseInt(vacancyId, 10);
      if (selectedIds.includes(vid) && selectedIds.length > 1 && onStatusChangeMulti) {
        selectedIds.forEach(id => {
          trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
            vacancy_id: id,
            to_status: columnId,
            method: 'drag_and_drop_multi'
          });
        });
        onStatusChangeMulti(selectedIds, columnId);
      } else if (onReorder) {
        const dragged = vacancies.find(v => v.id === vid);
        if (!dragged) return;

        let ids;
        if (LANE_COLUMNS.has(columnId)) {
          // If dropping into a lane column, place it in the target lane and preserve column order
          ids = sortByManualOrder(vacancies.filter(v => v.status === columnId))
            .map(v => v.id)
            .filter(id => id !== vid);
          ids.push(vid); // append to column
        } else {
          ids = sortByManualOrder(vacancies.filter(v => v.status === columnId))
            .map(v => v.id)
            .filter(id => id !== vid);
          if (targetIndex !== null) {
            ids.splice(Math.min(targetIndex, ids.length), 0, vid);
          } else {
            ids.push(vid);
          }
        }

        trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
          vacancy_id: vid,
          to_status: columnId,
          method: dragged.status === columnId ? 'drag_reorder' : 'drag_and_drop'
        });
        onReorder(columnId, ids, lane);
      } else {
        trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
          vacancy_id: vid,
          to_status: columnId,
          method: 'drag_and_drop'
        });
        onStatusChange(vid, columnId);
      }
    }
  };

  return (
    <div className="kanban-wrapper">
      {/* Funnel Columns */}
      <div
        className="kanban-board"
        onDragStart={(e) => {
          const id = parseInt(e.dataTransfer.getData('text/plain'), 10);
          setDraggingId(Number.isNaN(id) ? null : id);
        }}
        onDragEnd={() => {
          setDraggingId(null);
          setDragOverColumn(null);
          setDropIndex(null);
          setDragOverLane(0);
        }}
      >
        {COLUMNS.map(col => {
          const columnVacancies = sortByManualOrder(vacancies.filter(v => v.status === col.id));
          const columnName = t(`kanban.columns.${col.id}`);
          const isLaneColumn = LANE_COLUMNS.has(col.id);
          const isDragging = draggingId !== null;

          // Compute number of active lanes for this column:
          // laneCount is at least the highest lane index + 1
          const maxLaneInCol = columnVacancies.reduce((m, v) => Math.max(m, (v.lane || 0)), 0);
          const laneCount = Math.max(1, maxLaneInCol + 1);
          const laneOptions = Array.from({ length: laneCount }, (_, i) => i);
          laneOptions.push(laneCount); // "+" extra lane

          const showIndicator = !isLaneColumn && dragOverColumn === col.id && dropIndex !== null;
          const cardsWithIndicator = [];
          let visibleIndex = 0;
          const pushIndicator = () => cardsWithIndicator.push(<div key="drop-indicator" className="drop-indicator" />);

          columnVacancies.forEach((vacancy) => {
            const isDragged = vacancy.id === draggingId;
            if (showIndicator && !isDragged && dropIndex === visibleIndex) pushIndicator();
            cardsWithIndicator.push(
              <KanbanCard
                key={vacancy.id}
                vacancy={vacancy}
                onClick={onCardClick}
                onStatusChange={onStatusChange}
                isSelected={selectedIds.includes(vacancy.id)}
                onToggleSelect={onToggleSelect}
              />
            );
            if (!isDragged) visibleIndex += 1;
          });
          if (showIndicator && dropIndex >= visibleIndex) pushIndicator();

          return (
            <div
              key={col.id}
              className={`kanban-column ${dragOverColumn === col.id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{ position: 'relative' }}
            >
              <div className="column-header">
                <div className="column-title-group">
                  <span className="column-dot" style={{ background: col.color }} />
                  <span className="column-name">{columnName}</span>
                </div>
                <span className="column-badge">{columnVacancies.length}</span>
              </div>

              <div className="column-cards">
                {cardsWithIndicator}

                {columnVacancies.length === 0 && (
                  <div className="empty-column">
                    {t('kanban.empty_column')}
                  </div>
                )}
              </div>

              {/* Jira-style vertical drop overlay when dragging over a segmented column */}
              {isLaneColumn && isDragging && dragOverColumn === col.id && (
                <div className="lanes-overlay">
                  {laneOptions.map(l => {
                    const isPlus = l === laneCount;
                    const isActive = dragOverLane === l;
                    return (
                      <div
                        key={l}
                        className={`lane-dropzone ${isPlus ? 'is-new-lane' : ''} ${isActive ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleLaneDragOver(e, col.id, l)}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDrop(e, col.id, l);
                        }}
                      >
                        <span className="lane-dropzone-badge">{isPlus ? '+' : l + 1}</span>
                        <span className="lane-dropzone-text">
                          {isPlus ? 'Новый этап' : `Этап ${l + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Rejection Block */}
      <div
        className={`kanban-rejected-block ${dragOverColumn === REJECTED_STATUS ? 'drag-over' : ''} ${isRejectedCollapsed ? 'is-collapsed' : ''}`}
        onDragOver={(e) => handleDragOver(e, REJECTED_STATUS)}
        onDragLeave={(e) => handleDragLeave(e, REJECTED_STATUS)}
        onDrop={(e) => handleDrop(e, REJECTED_STATUS)}
      >
        <div
          className="kanban-rejected-header"
          onClick={() => {
            trackEvent(EVENTS.REJECTED_TOGGLE, { collapsed: !isRejectedCollapsed });
            setIsRejectedCollapsed(prev => !prev);
          }}
        >
          <div className="column-title-group">
            <span className="column-dot" style={{ background: '#ef4444' }} />
            <span className="column-name">{t('kanban.rejected_title')}</span>
          </div>

          <span
            className="column-badge"
            style={rejectedVacancies.length > 0 ? { color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' } : {}}
          >
            {rejectedVacancies.length}
          </span>

          <button
            type="button"
            className="rejected-collapse-btn"
            onClick={(e) => {
              e.stopPropagation();
              trackEvent(EVENTS.REJECTED_TOGGLE, { collapsed: !isRejectedCollapsed });
              setIsRejectedCollapsed(prev => !prev);
            }}
            title={isRejectedCollapsed ? t('kanban.rejected_expand') : t('kanban.rejected_collapse')}
          >
            {isRejectedCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{isRejectedCollapsed ? t('kanban.rejected_expand') : t('kanban.rejected_collapse')}</span>
          </button>
        </div>

        {!isRejectedCollapsed && (
          <div className="kanban-rejected-content">
            {rejectedVacancies.length === 0 ? (
              <div className="kanban-rejected-empty">
                <Ban size={15} />
                <span>{t('kanban.rejected_empty')}</span>
              </div>
            ) : (
              <div className="kanban-rejected-cards">
                {rejectedVacancies.map(vacancy => (
                  <KanbanCard
                    key={vacancy.id}
                    vacancy={vacancy}
                    onClick={onCardClick}
                    onStatusChange={onStatusChange}
                    isSelected={selectedIds.includes(vacancy.id)}
                    onToggleSelect={onToggleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
