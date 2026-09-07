import React, { useState } from 'react';
import KanbanCard from './KanbanCard';

const COLUMNS = [
  { id: "Еще не написан", name: "Еще не написан", color: "#6366f1" },
  { id: "Написал", name: "Написал", color: "#0284c7" },
  { id: "Собеседование", name: "Собеседование", color: "#d97706" },
  { id: "Тестовое", name: "Тестовое", color: "#9333ea" },
  { id: "Оффер", name: "Оффер", color: "#059669" },
];

export default function KanbanBoard({ vacancies, onCardClick, onStatusChange }) {
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
                <span className="column-name">{col.name}</span>
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
                  Перетащите сюда или создайте вакансию
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
