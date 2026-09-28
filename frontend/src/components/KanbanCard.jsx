import React from 'react';
import { 
  Building2, MapPin, Sparkles, ChevronLeft, ChevronRight, 
  ExternalLink, Tag, Banknote, Laptop, Layers, Building, Ban,
  XCircle, RotateCcw, History
} from 'lucide-react';
import { getSalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';

const COLUMNS = [
  "Еще не написан",
  "Написал",
  "Собеседование",
  "Тестовое",
  "Оффер"
];

export default function KanbanCard({ vacancy, onClick, onStatusChange, isSelected, onToggleSelect }) {
  const { t, formatDate, salaryDisplayFormat } = useTranslation();
  const isRejected = vacancy.status === "Отказ";
  const currentIndex = COLUMNS.indexOf(vacancy.status);
  const salaryInfo = getSalaryDisplay(vacancy, t, salaryDisplayFormat);
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);

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
      const targetStatus = COLUMNS[currentIndex - 1];
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
    if (currentIndex < COLUMNS.length - 1) {
      const targetStatus = COLUMNS[currentIndex + 1];
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
      className={`kanban-card ${vacancy.is_closed ? 'is-closed' : ''} ${isRejected ? 'is-rejected' : ''} ${isSelected ? 'is-selected' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
    >
      <div className="card-top">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={(e) => {
              e.stopPropagation();
              if (onToggleSelect) onToggleSelect(vacancy.id);
            }}
            className="card-checkbox"
            title="Выделить карточку"
          />
          <div className="card-company">
            <Building2 size={12} />
            <span>{vacancy.company}</span>
            {vacancy.company_url && (
              <a 
                href={vacancy.company_url} 
                target="_blank" 
                rel="noreferrer" 
                onClick={handleCompanyLinkClick}
                title={t('kanban.company_linkedin')}
              >
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
        {vacancy.is_closed && (
          <div className="card-closed-badge" title={t('kanban.closed_hint')}>
            <Ban size={10} />
            <span>{t('kanban.closed')}</span>
          </div>
        )}
      </div>

      <h3 className="card-title">{vacancy.title}</h3>

      {(vacancy.location || salaryInfo.hasSalary || workplaceInfo) && (
        <div className="card-meta">
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
        <div className="card-summary card-summary-pending" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#818cf8', padding: '6px 8px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '6px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
          <Sparkles size={13} style={{ flexShrink: 0, animation: 'pulse 2s infinite' }} />
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
              disabled={currentIndex <= 0}
              onClick={handleMoveLeft}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="quick-move-btn quick-reject-btn"
              title={t('kanban.move_to_rejected')}
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
              <XCircle size={14} />
            </button>
            <button
              className="quick-move-btn"
              title={t('kanban.move_right')}
              disabled={currentIndex >= COLUMNS.length - 1}
              onClick={handleMoveRight}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
