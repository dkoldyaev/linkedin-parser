import React, { useState } from 'react';
import KanbanCard from './KanbanCard';
import { useTranslation } from '../i18n/I18nContext';
import { ChevronDown, ChevronUp, Ban } from 'lucide-react';

const COLUMNS = [
  { id: "Еще не написан", color: "#6366f1" },
  { id: "Написал", color: "#0284c7" },
  { id: "Собеседование", color: "#d97706" },
  { id: "Тестовое", color: "#9333ea" },
  { id: "Оффер", color: "#059669" },
];

const REJECTED_STATUS = "Отказ";

export default function KanbanBoard({ vacancies, onCardClick, onStatusChange }) {
  const { t } = useTranslation();
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isRejectedCollapsed, setIsRejectedCollapsed] = useState(false);

  const rejectedVacancies = vacancies.filter(v => v.status === REJECTED_STATUS);

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e, columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const vacancyId = e.dataTransfer.getData('text/plain');
    if (vacancyId) {
      onStatusChange(parseInt(vacancyId, 10), columnId);
    }
  };

  return (
    <div className="kanban-wrapper">
      {/* Funnel Columns */}
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const columnVacancies = vacancies.filter(v => v.status === col.id);
          const columnName = t(`kanban.columns.${col.id}`);

          return (
            <div
              key={col.id}
              className={`kanban-column ${dragOverColumn === col.id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="column-header">
                <div className="column-title-group">
                  <span className="column-dot" style={{ background: col.color }} />
                  <span className="column-name">{columnName}</span>
                </div>
                <span className="column-badge">{columnVacancies.length}</span>
              </div>

              <div className="column-cards">
                {columnVacancies.map(vacancy => (
                  <KanbanCard
                    key={vacancy.id}
                    vacancy={vacancy}
                    onClick={onCardClick}
                    onStatusChange={onStatusChange}
                  />
                ))}

                {columnVacancies.length === 0 && (
                  <div className="empty-column">
                    {t('kanban.empty_column')}
                  </div>
                )}
              </div>
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
          onClick={() => setIsRejectedCollapsed(prev => !prev)}
        >
          <div className="column-title-group">
            <span className="column-dot" style={{ background: '#ef4444' }} />
            <span className="column-name">{t('kanban.rejected_title')}</span>
            <span
              className="column-badge"
              style={rejectedVacancies.length > 0 ? { color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' } : {}}
            >
              {rejectedVacancies.length}
            </span>
          </div>

          <button
            type="button"
            className="rejected-collapse-btn"
            onClick={(e) => {
              e.stopPropagation();
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
