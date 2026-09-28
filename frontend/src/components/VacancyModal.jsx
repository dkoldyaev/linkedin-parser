import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, MapPin, Building2, Sparkles, Tag, Plus, 
  Trash2, RefreshCw, Check, Loader2, FileText, StickyNote, Banknote,
  Laptop, Layers, Building, Ban, History, MessageSquare, ArrowRight, Edit3,
  ChevronDown, ChevronUp, Copy
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
  "Оффер",
  "Отказ"
];

const STAGE_COLORS = {
  "Еще не написан": "#6366f1",
  "Написал": "#0284c7",
  "Собеседование": "#d97706",
  "Тестовое": "#9333ea",
  "Оффер": "#059669",
  "Отказ": "#ef4444"
};

export default function VacancyModal({ vacancy, isOpen, onClose, onUpdate, onDelete }) {
  const { t, locale, formatDate, salaryDisplayFormat } = useTranslation();
  const [status, setStatus] = useState(vacancy?.status || "Еще не написан");
  const [tags, setTags] = useState(vacancy?.tags || []);
  const [newTagInput, setNewTagInput] = useState("");
  const [notes, setNotes] = useState(vacancy?.notes || "");
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [historyCommentText, setHistoryCommentText] = useState("");
  const [savingHistoryId, setSavingHistoryId] = useState(null);
  const [techStack, setTechStack] = useState(vacancy?.tech_stack || []);
  const [newTechInput, setNewTechInput] = useState("");
  
  const [salaryMin, setSalaryMin] = useState(vacancy?.salary_min ?? '');
  const [salaryMax, setSalaryMax] = useState(vacancy?.salary_max ?? '');
  const [salaryCurrency, setSalaryCurrency] = useState(vacancy?.salary_currency || '$');
  const [salaryPeriod, setSalaryPeriod] = useState(vacancy?.salary_period || 'month');
  const [workplaceType, setWorkplaceType] = useState(vacancy?.workplace_type || '');
  const [isClosed, setIsClosed] = useState(vacancy?.is_closed || false);
  const [hoverToggle, setHoverToggle] = useState(false);
  const [savingSalary, setSavingSalary] = useState(false);
  const [savedSalarySuccess, setSavedSalarySuccess] = useState(false);

  const [resummarizing, setResummarizing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [reparseError, setReparseError] = useState(null);
  const [reparseSuccess, setReparseSuccess] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotesSuccess, setSavedNotesSuccess] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [description, setDescription] = useState(vacancy?.description || "");
  const [title, setTitle] = useState(vacancy?.title || "");
  const [savingTitle, setSavingTitle] = useState(false);
  const [savedTitleSuccess, setSavedTitleSuccess] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [savedDescriptionSuccess, setSavedDescriptionSuccess] = useState(false);

  useEffect(() => {
    if (vacancy) {
      setStatus(vacancy.status || "Еще не написан");
      setTags(vacancy.tags || []);
      setNotes(vacancy.notes || "");
      setTechStack(vacancy.tech_stack || []);
      setSalaryMin(vacancy.salary_min ?? '');
      setSalaryMax(vacancy.salary_max ?? '');
      setSalaryCurrency(vacancy.salary_currency || '$');
      setSalaryPeriod(vacancy.salary_period || 'month');
      setWorkplaceType(vacancy.workplace_type || '');
      setIsClosed(Boolean(vacancy.is_closed));
      setReparsing(false);
      setEditingHistoryId(null);
      setHistoryCommentText("");
      setSavingHistoryId(null);
      setIsDescExpanded(false);
      setCopiedDesc(false);
      setDescription(vacancy.description || "");
      setTitle(vacancy.title || "");
    }
  }, [vacancy]);

  const handleCopyDescription = (e) => {
    e.stopPropagation();
    if (vacancy?.description) {
      navigator.clipboard.writeText(vacancy.description);
      trackEvent(EVENTS.DESCRIPTION_COPY, { vacancy_id: vacancy.id });
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
  };

  if (!isOpen || !vacancy) return null;

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
      vacancy_id: vacancy.id,
      from_status: vacancy.status,
      to_status: newStatus,
      method: 'modal_button'
    });
    if (newStatus === 'Отказ') {
      trackEvent(EVENTS.VACANCY_MOVE_REJECTED, {
        vacancy_id: vacancy.id,
        method: 'modal_status_button'
      });
    }
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      } else {
        onUpdate({ ...vacancy, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleSaveHistoryComment = async (historyId) => {
    if (!historyId || historyId === 0) {
      try {
        setSavingHistoryId(historyId);
        trackEvent(EVENTS.HISTORY_COMMENT_ADD, {
          vacancy_id: vacancy.id,
          stage: vacancy.status
        });
        const res = await fetch(`/api/vacancies/${vacancy.id}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_status: vacancy.status || 'Еще не написан',
            comment: historyCommentText.trim() || null
          })
        });
        if (res.ok) {
          const updated = await res.json();
          onUpdate(updated);
        }
      } catch (err) {
        console.error('Failed to create history comment', err);
      } finally {
        setSavingHistoryId(null);
        setEditingHistoryId(null);
        setHistoryCommentText('');
      }
      return;
    }

    try {
      setSavingHistoryId(historyId);
      trackEvent(EVENTS.HISTORY_COMMENT_EDIT, {
        vacancy_id: vacancy.id,
        history_id: historyId
      });
      const res = await fetch(`/api/vacancies/${vacancy.id}/history/${historyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: historyCommentText.trim() || null })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } catch (err) {
      console.error('Failed to save history comment', err);
    } finally {
      setSavingHistoryId(null);
      setEditingHistoryId(null);
      setHistoryCommentText('');
    }
  };

  const handleDeleteHistoryComment = async (historyId) => {
    if (!historyId) return;
    try {
      setSavingHistoryId(historyId);
      trackEvent(EVENTS.HISTORY_COMMENT_DELETE, {
        vacancy_id: vacancy.id,
        history_id: historyId
      });
      const res = await fetch(`/api/vacancies/${vacancy.id}/history/${historyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: null })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } catch (err) {
      console.error('Failed to delete history comment', err);
    } finally {
      setSavingHistoryId(null);
    }
  };

  const handleWorkplaceTypeChange = async (newType) => {
    const val = newType || null;
    setWorkplaceType(val || "");
    trackEvent(EVENTS.WORKPLACE_CHANGE, {
      vacancy_id: vacancy.id,
      workplace_type: val || 'none'
    });
    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workplace_type: val })
      });
      onUpdate({ ...vacancy, workplace_type: val });
    } catch (err) {
      console.error('Failed to update workplace type', err);
    }
  };

  const handleToggleClosed = async () => {
    const nextVal = !isClosed;
    setIsClosed(nextVal);
    trackEvent(EVENTS.VACANCY_TOGGLE_CLOSED, {
      vacancy_id: vacancy.id,
      is_closed: nextVal
    });
    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_closed: nextVal })
      });
      onUpdate({ ...vacancy, is_closed: nextVal });
    } catch (err) {
      console.error('Failed to update closed status', err);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase();
    if (!clean || tags.includes(clean)) return;

    const updatedTags = [...tags, clean];
    setTags(updatedTags);
    setNewTagInput("");
    trackEvent(EVENTS.TAG_ADD, {
      vacancy_id: vacancy.id,
      tag: clean
    });

    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags })
      });
      onUpdate({ ...vacancy, tags: updatedTags });
    } catch (err) {
      console.error('Failed to add tag', err);
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);
    trackEvent(EVENTS.TAG_REMOVE, {
      vacancy_id: vacancy.id,
      tag: tagToRemove
    });

    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags })
      });
      onUpdate({ ...vacancy, tags: updatedTags });
    } catch (err) {
      console.error('Failed to remove tag', err);
    }
  };

  const handleSaveDescription = async () => {
    try {
      setSavingDescription(true);
      trackEvent(EVENTS.DESCRIPTION_EDIT, { vacancy_id: vacancy.id });
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setSavedDescriptionSuccess(true);
        setTimeout(() => setSavedDescriptionSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save description', err);
    } finally {
      setSavingDescription(false);
    }
  };

  const handleAddTech = async (e) => {
    e.preventDefault();
    const clean = newTechInput.trim();
    if (!clean || techStack.includes(clean)) return;

    const updated = [...techStack, clean];
    setTechStack(updated);
    setNewTechInput("");
    trackEvent(EVENTS.TECH_ADD, {
      vacancy_id: vacancy.id,
      tech: clean
    });

    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tech_stack: updated })
      });
      onUpdate({ ...vacancy, tech_stack: updated });
    } catch (err) {
      console.error('Failed to add tech', err);
    }
  };

  const handleRemoveTech = async (techToRemove) => {
    const updated = techStack.filter(t => t !== techToRemove);
    setTechStack(updated);
    trackEvent(EVENTS.TECH_REMOVE, {
      vacancy_id: vacancy.id,
      tech: techToRemove
    });

    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tech_stack: updated })
      });
      onUpdate({ ...vacancy, tech_stack: updated });
    } catch (err) {
      console.error('Failed to remove tech', err);
    }
  };

  const handleSaveSalary = async () => {
    setSavingSalary(true);
    trackEvent(EVENTS.SALARY_SAVE, {
      vacancy_id: vacancy.id,
      currency: salaryCurrency || null,
      period: salaryPeriod || null,
      has_min: salaryMin !== '',
      has_max: salaryMax !== ''
    });
    try {
      const payload = {
        salary_min: salaryMin !== '' ? parseFloat(salaryMin) : null,
        salary_max: salaryMax !== '' ? parseFloat(salaryMax) : null,
        salary_currency: salaryCurrency || null,
        salary_period: salaryPeriod || null,
      };
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      onUpdate({
        ...vacancy,
        salary_min: payload.salary_min,
        salary_max: payload.salary_max,
        salary_currency: payload.salary_currency,
        salary_period: payload.salary_period,
      });
      setSavedSalarySuccess(true);
      setTimeout(() => setSavedSalarySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save salary', err);
    } finally {
      setSavingSalary(false);
    }
  };

  const handleSaveTitle = async () => {
    setSavingTitle(true);
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        onUpdate(await res.json());
        setSavedTitleSuccess(true);
        setTimeout(() => setSavedTitleSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save title', err);
    } finally {
      setSavingTitle(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    trackEvent(EVENTS.NOTES_SAVE, {
      vacancy_id: vacancy.id,
      notes_length: notes.length
    });
    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      onUpdate({ ...vacancy, notes });
      setSavedNotesSuccess(true);
      setTimeout(() => setSavedNotesSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save notes', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleResummarize = async () => {
    setResummarizing(true);
    trackEvent(EVENTS.AI_RESUMMARIZE_CLICK, {
      vacancy_id: vacancy.id,
      language: locale
    });
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/resummarize?language=${locale}`, {
        method: 'POST'
      });
      if (res.ok) {
        trackEvent(EVENTS.AI_RESUMMARIZE_SUCCESS, {
          vacancy_id: vacancy.id
        });
        const updated = await res.json();
        onUpdate(updated);
      }
    } catch (err) {
      console.error('Failed to resummarize', err);
    } finally {
      setResummarizing(false);
    }
  };

  const handleReparse = async () => {
    if (!vacancy?.id || reparsing) return;
    setReparsing(true);
    setReparseError(null);
    setReparseSuccess(false);
    trackEvent(EVENTS.VACANCY_REPARSE_CLICK, {
      vacancy_id: vacancy.id
    });
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/reparse`, {
        method: 'POST'
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || t('common.error'));
      }
      trackEvent(EVENTS.VACANCY_REPARSE_SUCCESS, {
        vacancy_id: vacancy.id
      });
      setReparseSuccess(true);
      setTimeout(() => setReparseSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to reparse vacancy', err);
      trackEvent(EVENTS.VACANCY_REPARSE_ERROR, {
        vacancy_id: vacancy.id,
        error: err.message || t('common.error')
      });
      setReparseError(err.message || t('common.error'));
      setTimeout(() => setReparseError(null), 6000);
    } finally {
      setReparsing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('vacancyModal.delete_confirm'))) {
      trackEvent(EVENTS.VACANCY_DELETE, {
        vacancy_id: vacancy.id,
        company: vacancy.company,
        status: vacancy.status
      });
      try {
        await fetch(`/api/vacancies/${vacancy.id}`, { method: 'DELETE' });
        onDelete(vacancy.id);
        onClose();
      } catch (err) {
        console.error('Failed to delete', err);
      }
    }
  };

  const currentSalaryInfo = getSalaryDisplay({
    salary_min: salaryMin !== '' ? salaryMin : vacancy.salary_min,
    salary_max: salaryMax !== '' ? salaryMax : vacancy.salary_max,
    salary_currency: salaryCurrency || vacancy.salary_currency,
    salary_period: salaryPeriod || vacancy.salary_period,
  }, t, salaryDisplayFormat);

  const modalWorkplaceInfo = getWorkplaceInfo(workplaceType || vacancy.workplace_type, t);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '840px' }}>
        {/* Header */}
        <div className="modal-header" style={{ display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'baseline' }}>
              <span className="card-company">
                <Building2 size={13} />
                {vacancy.company}
              </span>
              {vacancy.company_url && (
                <a
                  href={vacancy.company_url}
                  target="_blank"
                  rel="noreferrer"
                  title={t('kanban.company_linkedin')}
                  style={{ color: '#94a3b8' }}
                  onClick={() => trackEvent(EVENTS.COMPANY_LINK_CLICK, { vacancy_id: vacancy.id, company: vacancy.company })}
                >
                  <ExternalLink size={12} />
                </a>
              )}
              {vacancy.location && (
                <span className="card-location" style={{ marginLeft: '6px' }}>
                  <MapPin size={12} />
                  {vacancy.location}
                </span>
              )}
              {modalWorkplaceInfo && (
                <span className={`card-workplace-badge header-badge ${modalWorkplaceInfo.className}`} style={{ marginLeft: '6px' }}>
                  {modalWorkplaceInfo.key === 'remote' && <Laptop size={11} />}
                  {modalWorkplaceInfo.key === 'hybrid' && <Layers size={11} />}
                  {modalWorkplaceInfo.key === 'on-site' && <Building size={11} />}
                  <span>{modalWorkplaceInfo.label}</span>
                </span>
              )}
              {currentSalaryInfo.hasSalary && (
                <span className="card-salary-badge" style={{ marginLeft: '8px' }} title={currentSalaryInfo.original || currentSalaryInfo.formatted}>
                  <Banknote size={13} />
                  <span>{currentSalaryInfo.formatted}</span>
                </span>
              )}
              {isClosed && (
                <span className="card-closed-badge header-badge" style={{ marginLeft: '8px' }} title={t('kanban.closed_hint')}>
                  <Ban size={12} />
                  <span>{t('vacancyModal.closed_badge')}</span>
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <button 
                type="button"
                className="btn btn-secondary header-action-badge header-badge"
                onClick={handleReparse}
                disabled={reparsing || !vacancy.url}
                title={vacancy.url ? t('vacancyModal.reparse_btn') : undefined}
                style={{
                  borderColor: reparseSuccess ? '#10b981' : undefined,
                  color: reparseSuccess ? '#10b981' : undefined,
                }}
              >
                {reparsing ? (
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                ) : reparseSuccess ? (
                  <Check size={12} color="#10b981" />
                ) : (
                  <>
                    <RefreshCw size={12} />
                    <span>{t('vacancyModal.reparse_short')}</span>
                  </>
                )}
              </button>
              <a 
                href={vacancy.url} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-secondary header-action-badge header-badge"
                onClick={() => trackEvent(EVENTS.VACANCY_LINK_CLICK, { vacancy_id: vacancy.id })}
              >
                <ExternalLink size={12} />
                <span>{
                  (() => {
                    if (!vacancy.url) return 'Link';
                    try {
                      const hn = new URL(vacancy.url).hostname;
                      if (hn.includes('linkedin.com')) return 'LinkedIn';
                      if (hn.includes('upwork.com')) return 'Upwork';
                      if (hn.includes('hh.ru')) return 'HH.ru';
                      return hn.replace(/^www\./, '');
                    } catch(e) { return 'Link'; }
                  })()
                }</span>
              </a>
              <button className="btn-icon header-action-badge header-badge" onClick={onClose} title={t('vacancyModal.close_btn')}>
                <X size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
              style={{ fontSize: '1.25rem', fontWeight: 700, padding: '4px 8px', flex: 1, color: 'var(--text-primary)', border: '1px solid transparent', background: 'transparent' }}
              title="Нажмите, чтобы редактировать"
            />
            {savingTitle && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {savedTitleSuccess && <Check size={16} color="#10b981" />}
          </div>
        </div>

        {reparseError && (
          <div style={{
            margin: '12px 24px 0',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <span><strong>{t('common.error')}:</strong> {reparseError}</span>
            <button
              onClick={() => setReparseError(null)}
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          {/* Status & Workplace Format Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t('vacancyModal.status_label')}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {COLUMNS.map(col => {
                  const isSelected = status === col;
                  const isRejectedCol = col === 'Отказ';
                  let borderColor = 'var(--border-subtle)';
                  let background = 'transparent';
                  let color = 'var(--text-muted)';

                  if (isSelected) {
                    if (isRejectedCol) {
                      borderColor = '#ef4444';
                      background = 'rgba(239, 68, 68, 0.15)';
                      color = '#fca5a5';
                    } else {
                      borderColor = 'var(--primary)';
                      background = 'var(--primary-light)';
                      color = '#a5b4fc';
                    }
                  } else if (isRejectedCol) {
                    color = 'var(--text-muted)';
                  }

                  return (
                    <button
                      key={col}
                      onClick={() => handleStatusChange(col)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor,
                        background,
                        color,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {t(`kanban.columns.${col}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t('vacancyModal.workplace_label')}
              </span>
              <select
                className="form-input"
                style={{ fontSize: '0.75rem', padding: '5px 10px', cursor: 'pointer', minWidth: '135px' }}
                value={workplaceType}
                onChange={e => handleWorkplaceTypeChange(e.target.value)}
              >
                <option value="">{t('vacancyModal.not_specified')}</option>
                <option value="remote">{t('workplace.full_remote')}</option>
                <option value="hybrid">{t('workplace.full_hybrid')}</option>
                <option value="on-site">{t('workplace.full_onsite')}</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleToggleClosed}
                onMouseEnter={() => setHoverToggle(true)}
                onMouseLeave={() => setHoverToggle(false)}
                className={`btn-toggle-closed ${isClosed ? 'is-closed' : 'is-open'}`}
              >
                {isClosed ? (
                  hoverToggle ? (
                    <>
                      <Check size={12} />
                      <span>{t('vacancyModal.open_action')}</span>
                    </>
                  ) : (
                    <>
                      <Ban size={12} />
                      <span>{t('kanban.closed')}</span>
                    </>
                  )
                ) : (
                  hoverToggle ? (
                    <>
                      <Ban size={12} />
                      <span>{t('vacancyModal.close_action')}</span>
                    </>
                  ) : (
                    <>
                      <Check size={12} />
                      <span>{t('vacancyModal.open_badge')}</span>
                    </>
                  )
                )}
              </button>
            </div>
          </div>

          {/* Salary Section */}
          <div className="form-group" style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Banknote size={15} color="#34d399" />
                <span style={{ fontWeight: 600 }}>{t('vacancyModal.salary_title')}</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {currentSalaryInfo.hasSalary && (
                  <span style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 600 }}>
                    {t('vacancyModal.monthly_total', { amount: currentSalaryInfo.formatted })}
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSaveSalary}
                  disabled={savingSalary}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {savedSalarySuccess ? (
                    <>
                      <Check size={14} color="#10b981" />
                      <span style={{ color: '#10b981' }}>{t('vacancyModal.saved_salary')}</span>
                    </>
                  ) : (
                    <span>{t('vacancyModal.save_salary')}</span>
                  )}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('vacancyModal.min')}</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                  placeholder={t('vacancyModal.min_placeholder')}
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value)}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('vacancyModal.max')}</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                  placeholder={t('vacancyModal.max_placeholder')}
                  value={salaryMax}
                  onChange={e => setSalaryMax(e.target.value)}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('vacancyModal.currency')}</span>
                <select
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '6px 8px', cursor: 'pointer' }}
                  value={salaryCurrency}
                  onChange={e => setSalaryCurrency(e.target.value)}
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="₽">₽ (RUB)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="CHF">CHF</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('vacancyModal.period')}</span>
                <select
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '6px 8px', cursor: 'pointer' }}
                  value={salaryPeriod}
                  onChange={e => setSalaryPeriod(e.target.value)}
                >
                  <option value="year">{t('salary.in_year_opt')}</option>
                  <option value="month">{t('salary.in_month_opt')}</option>
                  <option value="hour">{t('salary.in_hour_opt')}</option>
                  <option value="week">{t('salary.in_week_opt')}</option>
                  <option value="day">{t('salary.in_day_opt')}</option>
                </select>
              </div>
            </div>
            {currentSalaryInfo.original && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {currentSalaryInfo.original}
              </div>
            )}
          </div>

          {/* AI Summary Section */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(30, 27, 75, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7d2fe', fontWeight: 600, fontSize: '0.9rem' }}>
                <Sparkles size={16} color="#a5b4fc" />
                <span>{t('vacancyModal.ai_summary_title')}</span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleResummarize}
                disabled={resummarizing}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {resummarizing ? (
                  <>
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{t('vacancyModal.analyzing')}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} />
                    <span>{t('vacancyModal.resummarize_btn')}</span>
                  </>
                )}
              </button>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {vacancy.ai_summary || t('vacancyModal.no_summary')}
            </p>

            {vacancy.company_info && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(99, 102, 241, 0.15)', fontSize: '0.8125rem', color: '#94a3b8' }}>
                <strong style={{ color: '#c7d2fe' }}>{t('vacancyModal.about_company')}</strong>
                {vacancy.company_info}
              </div>
            )}
          </div>

          {/* Tech Stack */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{t('vacancyModal.tech_stack_title')}</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {techStack.map(tech => (
                <span key={tech} className="tech-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px' }}>
                  {tech}
                  <button 
                    onClick={() => handleRemoveTech(tech)} 
                    style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {techStack.length === 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('vacancyModal.no_tech_stack')}</span>
              )}
            </div>
            <form onSubmit={handleAddTech} style={{ display: 'flex', gap: '8px', maxWidth: '300px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                placeholder={t('vacancyModal.add_tech_placeholder')}
                value={newTechInput}
                onChange={e => setNewTechInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                <Plus size={14} />
              </button>
            </form>
          </div>

          {/* Custom Tags */}
          <div className="form-group">
            <label className="form-label">
              {t('vacancyModal.tags_title')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {tags.map(tagItem => (
                <span key={tagItem} className="tag-chip" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  <Tag size={11} />
                  {tagItem}
                  <button 
                    onClick={() => handleRemoveTag(tagItem)} 
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: '2px' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('vacancyModal.no_tags')}</span>
              )}
            </div>
            <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '8px', maxWidth: '300px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                placeholder={t('vacancyModal.add_tag_placeholder')}
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                <Plus size={14} />
              </button>
            </form>
          </div>

          {/* Stage Movement History */}
          <div className="form-group stage-history-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
                <History size={15} color="#818cf8" />
                <span>{t('vacancyModal.history_title')}</span>
              </label>
              {vacancy.history && vacancy.history.length > 0 && (
                <span className="stage-count-badge">
                  {t('vacancyModal.history_badge_hint', { count: vacancy.history.length })}
                </span>
              )}
            </div>

            {(!vacancy.history || vacancy.history.length === 0) ? (
              <div className="stage-timeline-empty">
                <History size={15} />
                <span>{t('vacancyModal.history_empty')}</span>
              </div>
            ) : (
              <div className="stage-timeline">
                {vacancy.history.map((item, idx) => {
                  const isCurrent = idx === vacancy.history.length - 1;
                  const stageColor = STAGE_COLORS[item.to_status] || '#6366f1';
                  const isEditingThis = editingHistoryId === item.id;
                  const isSavingThis = savingHistoryId === item.id;
                  const isLastItem = idx === vacancy.history.length - 1;

                  return (
                    <div key={item.id || idx} className={`stage-timeline-item ${isCurrent ? 'is-current' : ''}`}>
                      {!isLastItem && <div className="stage-timeline-line" />}
                      <div
                        className="stage-timeline-dot"
                        style={{
                          borderColor: stageColor,
                          backgroundColor: isCurrent ? stageColor : 'var(--bg-card)',
                          boxShadow: isCurrent ? `0 0 8px ${stageColor}88` : 'none'
                        }}
                      />

                      <div className="stage-timeline-content">
                        <div className="stage-timeline-header">
                          <div className="stage-badges-row">
                            {item.from_status && item.from_status !== item.to_status ? (
                              <div className="stage-transition-group">
                                <span className="stage-badge stage-badge-from">
                                  {t(`kanban.columns.${item.from_status}`)}
                                </span>
                                <ArrowRight size={11} className="stage-arrow-icon" />
                                <span
                                  className="stage-badge stage-badge-to"
                                  style={{
                                    borderColor: `${stageColor}50`,
                                    color: stageColor,
                                    backgroundColor: `${stageColor}18`
                                  }}
                                >
                                  {t(`kanban.columns.${item.to_status}`)}
                                </span>
                              </div>
                            ) : (
                              <span
                                className="stage-badge stage-badge-to"
                                style={{
                                  borderColor: `${stageColor}50`,
                                  color: stageColor,
                                  backgroundColor: `${stageColor}18`
                                }}
                              >
                                {t(`kanban.columns.${item.to_status}`)}
                              </span>
                            )}

                            {isCurrent && (
                              <span className="stage-current-pill">
                                {t('vacancyModal.history_current')}
                              </span>
                            )}
                          </div>

                          <span className="stage-time">
                            {formatDate(item.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Comment section for this stage */}
                        <div className="stage-comment-area">
                          {isEditingThis ? (
                            <div className="stage-comment-form">
                              <textarea
                                className="form-textarea stage-comment-input"
                                rows={2}
                                placeholder={t('vacancyModal.history_comment_placeholder')}
                                value={historyCommentText}
                                onChange={(e) => setHistoryCommentText(e.target.value)}
                                autoFocus
                              />
                              <div className="stage-comment-form-actions">
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                  onClick={() => handleSaveHistoryComment(item.id)}
                                  disabled={isSavingThis}
                                >
                                  {isSavingThis ? (
                                    <>
                                      <Loader2 size={12} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                                      <span>{t('vacancyModal.history_saving')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check size={12} />
                                      <span>{t('vacancyModal.history_save_comment')}</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                  onClick={() => {
                                    setEditingHistoryId(null);
                                    setHistoryCommentText('');
                                  }}
                                  disabled={isSavingThis}
                                >
                                  <X size={12} />
                                  <span>{t('vacancyModal.history_cancel')}</span>
                                </button>
                              </div>
                            </div>
                          ) : item.comment ? (
                            <div className="stage-comment-bubble">
                              <div className="stage-comment-text">
                                <MessageSquare size={13} className="stage-comment-icon" />
                                <span>{item.comment}</span>
                              </div>
                              <div className="stage-comment-tools">
                                <button
                                  type="button"
                                  className="stage-tool-btn"
                                  title={t('vacancyModal.history_edit_comment')}
                                  onClick={() => {
                                    setEditingHistoryId(item.id);
                                    setHistoryCommentText(item.comment || '');
                                  }}
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="stage-tool-btn stage-tool-btn-danger"
                                  title={t('vacancyModal.history_delete_comment')}
                                  onClick={() => handleDeleteHistoryComment(item.id)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="stage-add-comment-btn"
                              onClick={() => {
                                setEditingHistoryId(item.id);
                                setHistoryCommentText('');
                              }}
                            >
                              <Plus size={11} />
                              <span>{t('vacancyModal.history_add_comment')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Personal Notes */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StickyNote size={14} />
                <span>{t('vacancyModal.notes_title')}</span>
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {savedNotesSuccess ? (
                  <>
                    <Check size={14} color="#10b981" />
                    <span style={{ color: '#10b981' }}>{t('vacancyModal.saved_notes')}</span>
                  </>
                ) : (
                  <span>{t('vacancyModal.save_notes')}</span>
                )}
              </button>
            </div>
            <textarea
              className="form-textarea"
              style={{ minHeight: '80px' }}
              placeholder={t('vacancyModal.notes_placeholder')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Original Vacancy Description */}
          <div className="form-group orig-desc-section">
            <button
              type="button"
              className={`orig-desc-header ${isDescExpanded ? 'is-expanded' : ''}`}
              onClick={() => {
                trackEvent(EVENTS.DESCRIPTION_EXPAND, {
                  vacancy_id: vacancy.id,
                  expanded: !isDescExpanded
                });
                setIsDescExpanded(prev => !prev);
              }}
              aria-expanded={isDescExpanded}
            >
              <div className="orig-desc-header-title">
                <FileText size={15} />
                <span>{t('vacancyModal.orig_description_title')}</span>
              </div>
              <div className="orig-desc-header-action">
                <span>{isDescExpanded ? t('vacancyModal.collapse') : t('vacancyModal.show_full')}</span>
                {isDescExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </button>
            {isDescExpanded && (
              <div className="orig-desc-body">
                <div className="orig-desc-actions" style={{ justifyContent: 'space-between', display: 'flex', marginBottom: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSaveDescription}
                    disabled={savingDescription}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {savedDescriptionSuccess ? (
                      <>
                        <Check size={12} color="#10b981" />
                        <span style={{ color: '#10b981' }}>Сохранено</span>
                      </>
                    ) : (
                      <span>Сохранить текст</span>
                    )}
                  </button>
                  {vacancy.description && (
                    <button
                      type="button"
                      className="btn btn-secondary orig-desc-copy-btn"
                      onClick={handleCopyDescription}
                      title={t('vacancyModal.copy_description')}
                    >
                      {copiedDesc ? (
                        <>
                          <Check size={12} color="#10b981" />
                          <span style={{ color: '#10b981' }}>{t('vacancyModal.copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>{t('vacancyModal.copy_description')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '150px', width: '100%', fontSize: '0.8125rem' }}
                  placeholder="Вставьте текст вакансии сюда..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={14} />
            <span>{t('vacancyModal.delete_vacancy')}</span>
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            {t('vacancyModal.close_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
