import React, { useLayoutEffect, useRef, useState } from 'react';
import { 
  MapPin, Sparkles, 
  ExternalLink, Tag, Banknote, Laptop, Layers, Building, Ban,
  RotateCcw, History, Award
} from 'lucide-react';
import { getSalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';

const DEFAULT_COLUMNS = [
  "Еще не написан",
  "Написал",
  "Собеседование",
  "Тестовое",
  "Оффер"
];

export default function KanbanCard({
  vacancy,
  onClick,
  onStatusChange,
  isSelected,
  onToggleSelect,
  columns = DEFAULT_COLUMNS,
  laneColumns = new Set(["Собеседование", "Тестовое"])
}) {
  const { t, formatDate, salaryDisplayFormat } = useTranslation();
  const contentRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const updateHeight = () => {
      // Snap the content area to the grid, leaving the footer on the next grid line.
      const height = Math.ceil(content.offsetHeight / 32) * 32;
      setGridHeight((previous) => previous === height ? previous : height);
    };
    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    updateHeight();
    return () => observer.disconnect();
  }, []);
  const isRejected = vacancy.status === "Отказ";
  // Filter out Отказ from linear column navigation
  const linearColumns = (Array.isArray(columns) && columns.length > 0)
    ? columns.map(c => typeof c === 'string' ? c : c.id).filter(id => id !== "Отказ")
    : DEFAULT_COLUMNS;
  const currentIndex = linearColumns.indexOf(vacancy.status);
  const salaryInfo = getSalaryDisplay(vacancy, t, salaryDisplayFormat);
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);

  // Match score tier classification
  const matchScore = vacancy.match_score != null ? Math.round(vacancy.match_score) : null;
  let matchTier = '';
  let matchTierLabel = '';
  if (matchScore !== null) {
    if (matchScore >= 75) {
      matchTier = 'match-high';
      matchTierLabel = t('kanban.match_high');
    } else if (matchScore >= 50) {
      matchTier = 'match-medium';
      matchTierLabel = t('kanban.match_medium');
    } else {
      matchTier = 'match-low';
      matchTierLabel = t('kanban.match_low');
    }
  }

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
      const targetStatus = linearColumns[currentIndex - 1];
      trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
        vacancy_id: vacancy.id,
        company: vacancy.company,
        from_status: vacancy.status,
        to_status: targetStatus,
        method: 'quick_arrow'
      });
      onStatusChange(vacancy.id, targetStatus);
    }
  };

  const handleMoveRight = (e) => {
    e.stopPropagation();
    if (currentIndex < linearColumns.length - 1) {
      const targetStatus = linearColumns[currentIndex + 1];
      trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
        vacancy_id: vacancy.id,
        company: vacancy.company,
        from_status: vacancy.status,
        to_status: targetStatus,
        method: 'quick_arrow'
      });
      onStatusChange(vacancy.id, targetStatus);
    }
  };

  const handleCardClick = () => {
    trackEvent(EVENTS.VACANCY_CARD_CLICK, {
      vacancy_id: vacancy.id,
      company: vacancy.company,
      status: vacancy.status,
      is_closed: Boolean(vacancy.is_closed),
      has_salary: salaryInfo.hasSalary
    });
    onClick(vacancy);
  };

  const handleCompanyLinkClick = (e) => {
    e.stopPropagation();
    trackEvent(EVENTS.COMPANY_LINK_CLICK, {
      vacancy_id: vacancy.id,
      company: vacancy.company
    });
  };

  return (
    <div
      className={`kanban-card ${vacancy.is_closed ? 'is-closed' : ''} ${isRejected ? 'is-rejected' : ''} ${isSelected ? 'is-selected' : ''} ${matchTier ? `card-${matchTier}` : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
    >
      <div className="card-grid-content">
      <div className="card-grid-body" style={gridHeight ? { minHeight: gridHeight } : undefined}>
      <div className="card-grid-body-content" ref={contentRef}>
      <div className="card-top">
        <div className="card-heading">
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={(e) => {
              e.stopPropagation();
              if (onToggleSelect) onToggleSelect(vacancy.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="card-checkbox"
            title="Выделить карточку"
          />
          <div className="card-title-container">
            <div className="card-header-meta">
              <a 
                href={vacancy.url} 
                target="_blank" 
                rel="noreferrer" 
                onClick={handleCompanyLinkClick}
                className="card-source-link"
                title={vacancy.source || ''}
              >
                {vacancy.source && <span>{vacancy.source}</span>}
                <ExternalLink size={10} />
              </a>
            </div>
            <h3 className="card-title">
              {vacancy.title}
            </h3>
          </div>

        </div>
        <div className="card-status-indicators">
          {(laneColumns.has(vacancy.status)) && (vacancy.lane != null) && (
            <span className="card-lane-badge" title={t('kanban.stage_badge', { n: (vacancy.lane || 0) + 1 })}>
              {t('kanban.stage_badge', { n: (vacancy.lane || 0) + 1 })}
            </span>
          )}
          {vacancy.is_closed && (
            <div className="card-closed-badge" title={t('kanban.closed_hint')}>
              <Ban size={10} />
              <span>{t('kanban.closed')}</span>
            </div>
          )}
        </div>
      </div>

      {(vacancy.location || salaryInfo.hasSalary || workplaceInfo || matchScore !== null) && (
        <div className="card-meta">
          {matchScore !== null && (
            <div
              className={`card-match-badge ${matchTier}`}
              title={`${t('kanban.match_badge', { score: matchScore })} (${matchTierLabel})`}
            >
              <Award size={11} />
              <span>{matchScore}%</span>
            </div>
          )}
          {workplaceInfo && (
            <div className={`card-workplace-badge ${workplaceInfo.className}`} title={t('workplace.badge_title', { format: workplaceInfo.fullLabel || workplaceInfo.label })}>
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
        <div className="card-summary card-summary-pending">
          <Sparkles size={13} />
          <span>{t('kanban.ai_generating')}</span>
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

      </div>
      </div>
      <div className="card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="card-date">
            {formatDate(vacancy.created_at)}
          </span>
          {vacancy.history && vacancy.history.length > 0 && (
            <span
              className="card-history-indicator"
              title={
                vacancy.history.some(h => h.comment)
                  ? t('vacancyModal.history_badge_with_comments', { count: vacancy.history.length })
                  : t('vacancyModal.history_badge_hint', { count: vacancy.history.length })
              }
            >
              <History size={11} />
              <span>{vacancy.history.length}</span>
              {vacancy.history.some(h => h.comment) && (
                <span className="card-history-comment-dot" />
              )}
            </span>
          )}
        </div>

        {isRejected ? (
          <button
            className="quick-restore-btn"
            title={t('kanban.rejected_restore_hint')}
            onClick={(e) => {
              e.stopPropagation();
              trackEvent(EVENTS.VACANCY_RESTORE_REJECTED, {
                vacancy_id: vacancy.id,
                company: vacancy.company,
                to_status: 'Еще не написан',
                method: 'quick_restore_btn'
              });
              onStatusChange(vacancy.id, 'Еще не написан');
            }}
          >
            <RotateCcw size={12} />
            <span>{t('kanban.rejected_restore')}</span>
          </button>
        ) : (
          <div className="card-quick-actions">
            <button
              className="quick-move-btn"
              title={t('kanban.move_left')}
              aria-label={t('kanban.move_left')}
              disabled={currentIndex <= 0}
              onClick={handleMoveLeft}
            >
              <span aria-hidden="true">&lt;</span>
            </button>
            <button
              className="quick-move-btn quick-reject-btn"
              title={t('kanban.move_to_rejected')}
              aria-label={t('kanban.move_to_rejected')}
              onClick={(e) => {
                e.stopPropagation();
                trackEvent(EVENTS.VACANCY_MOVE_REJECTED, {
                  vacancy_id: vacancy.id,
                  company: vacancy.company,
                  from_status: vacancy.status,
                  method: 'quick_reject_btn'
                });
                onStatusChange(vacancy.id, 'Отказ');
              }}
            >
              <span aria-hidden="true">×</span>
            </button>
            <button
              className="quick-move-btn"
              title={t('kanban.move_right')}
              aria-label={t('kanban.move_right')}
              disabled={currentIndex >= linearColumns.length - 1}
              onClick={handleMoveRight}
            >
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
