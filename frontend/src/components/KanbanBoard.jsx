import React, { useState } from 'react';
import KanbanCard from './KanbanCard';
import { useTranslation } from '../i18n/I18nContext';

const COLUMNS = [
  { id: "Еще не написан", color: "#6366f1" },
  { id: "Написал", color: "#0284c7" },
  { id: "Собеседование", color: "#d97706" },
  { id: "Тестовое", color: "#9333ea" },
  { id: "Оффер", color: "#059669" },
];

export default function KanbanBoard({ vacancies, onCardClick, onStatusChange }) {
  const { t } = useTranslation();
  const [dragOverColumn, setDragOverColumn] = useState(null);

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
  );
}
