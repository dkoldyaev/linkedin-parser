import React from 'react';
import { Building2, MapPin, Sparkles, ChevronLeft, ChevronRight, ExternalLink, Tag, Banknote, Laptop, Layers, Building } from 'lucide-react';
import { getSalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';

const COLUMNS = [
  "Еще не написан",
  "Написал",
  "Собеседование",
  "Тестовое",
  "Оффер"
];

export default function KanbanCard({ vacancy, onClick, onStatusChange }) {
  const currentIndex = COLUMNS.indexOf(vacancy.status);
  const salaryInfo = getSalaryDisplay(vacancy);
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', vacancy.id.toString());
    e.currentTarget.classList.add('is-dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('is-dragging');
  };

  const handleMoveLeft = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onStatusChange(vacancy.id, COLUMNS[currentIndex - 1]);
    }
  };

  const handleMoveRight = (e) => {
    e.stopPropagation();
    if (currentIndex < COLUMNS.length - 1) {
      onStatusChange(vacancy.id, COLUMNS[currentIndex + 1]);
    }
  };

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onClick(vacancy)}
    >
      <div className="card-top">
        <div className="card-company">
          <Building2 size={12} />
          <span>{vacancy.company}</span>
          {vacancy.company_url && (
            <a 
              href={vacancy.company_url} 
              target="_blank" 
              rel="noreferrer" 
              onClick={e => e.stopPropagation()}
              title="LinkedIn компании"
            >
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      <h3 className="card-title">{vacancy.title}</h3>

      {(vacancy.location || salaryInfo.hasSalary || workplaceInfo) && (
        <div className="card-meta">
          {workplaceInfo && (
            <div className={`card-workplace-badge ${workplaceInfo.className}`} title={`Формат работы: ${workplaceInfo.fullLabel || workplaceInfo.label}`}>
              {workplaceInfo.key === 'remote' && <Laptop size={11} />}
              {workplaceInfo.key === 'hybrid' && <Layers size={11} />}
              {workplaceInfo.key === 'on-site' && <Building size={11} />}
              <span>{workplaceInfo.label}</span>
            </div>
          )}
          {vacancy.location && (
            <div className="card-location">
              <MapPin size={12} />
              <span>{vacancy.location}</span>
            </div>
          )}
          {salaryInfo.hasSalary && (
            <div className="card-salary-badge" title={salaryInfo.original || salaryInfo.formatted}>
              <Banknote size={12} />
              <span>{salaryInfo.formatted}</span>
            </div>
          )}
        </div>
      )}

      {vacancy.ai_summary ? (
        <div className="card-summary">
          {vacancy.ai_summary}
        </div>
      ) : (
        <div className="card-summary card-summary-pending" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#818cf8', padding: '6px 8px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '6px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
          <Sparkles size={13} style={{ flexShrink: 0, animation: 'pulse 2s infinite' }} />
          <span>Генерируем AI-саммари и стек...</span>
        </div>
      )}

      {/* Tech stack pills */}
      {vacancy.tech_stack && vacancy.tech_stack.length > 0 && (
        <div className="card-tech-stack">
          {vacancy.tech_stack.slice(0, 4).map((tech, i) => (
            <span key={i} className="tech-chip">
              {tech}
            </span>
          ))}
          {vacancy.tech_stack.length > 4 && (
            <span className="tech-chip" style={{ color: 'var(--text-muted)' }}>
              +{vacancy.tech_stack.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Custom labels / tags */}
      {vacancy.tags && vacancy.tags.length > 0 && (
        <div className="card-tags">
          {vacancy.tags.map((tag, i) => (
            <span key={i} className="tag-chip">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="card-footer">
        <span className="card-date">
          {new Date(vacancy.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </span>

        <div className="card-quick-actions">
          <button
            className="quick-move-btn"
            title="Переместить назад"
            disabled={currentIndex <= 0}
            onClick={handleMoveLeft}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="quick-move-btn"
            title="Переместить вперед"
            disabled={currentIndex >= COLUMNS.length - 1}
            onClick={handleMoveRight}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
