import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, MapPin, Building2, Sparkles, Tag, Plus, 
  Trash2, RefreshCw, Check, Loader2, FileText, StickyNote, Banknote,
  Laptop, Layers, Building, Ban
} from 'lucide-react';
import { getSalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import { useTranslation } from '../i18n/I18nContext';

const COLUMNS = [
  "Еще не написан",
  "Написал",
  "Собеседование",
  "Тестовое",
  "Оффер",
  "Отказ"
];

export default function VacancyModal({ vacancy, isOpen, onClose, onUpdate, onDelete }) {
  const { t, locale } = useTranslation();
  const [status, setStatus] = useState(vacancy?.status || "Еще не написан");
  const [tags, setTags] = useState(vacancy?.tags || []);
  const [newTagInput, setNewTagInput] = useState("");
  const [notes, setNotes] = useState(vacancy?.notes || "");
  const [techStack, setTechStack] = useState(vacancy?.tech_stack || []);
  const [newTechInput, setNewTechInput] = useState("");
  
  const [salaryMin, setSalaryMin] = useState(vacancy?.salary_min ?? '');
  const [salaryMax, setSalaryMax] = useState(vacancy?.salary_max ?? '');
  const [salaryCurrency, setSalaryCurrency] = useState(vacancy?.salary_currency || '$');
  const [salaryPeriod, setSalaryPeriod] = useState(vacancy?.salary_period || 'month');
  const [workplaceType, setWorkplaceType] = useState(vacancy?.workplace_type || '');
  const [isClosed, setIsClosed] = useState(vacancy?.is_closed || false);
  const [savingSalary, setSavingSalary] = useState(false);
  const [savedSalarySuccess, setSavedSalarySuccess] = useState(false);

  const [resummarizing, setResummarizing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [reparseError, setReparseError] = useState(null);
  const [reparseSuccess, setReparseSuccess] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotesSuccess, setSavedNotesSuccess] = useState(false);

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
    }
  }, [vacancy]);

  if (!isOpen || !vacancy) return null;

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      onUpdate({ ...vacancy, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleWorkplaceTypeChange = async (newType) => {
    const val = newType || null;
    setWorkplaceType(val || "");
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

  const handleAddTech = async (e) => {
    e.preventDefault();
    const clean = newTechInput.trim();
    if (!clean || techStack.includes(clean)) return;

    const updated = [...techStack, clean];
    setTechStack(updated);
    setNewTechInput("");

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

  const handleSaveNotes = async () => {
    setSavingNotes(true);
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
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/resummarize?language=${locale}`, {
        method: 'POST'
      });
      if (res.ok) {
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
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/reparse`, {
        method: 'POST'
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || t('common.error'));
      }
      setReparseSuccess(true);
      setTimeout(() => setReparseSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to reparse vacancy', err);
      setReparseError(err.message || t('common.error'));
      setTimeout(() => setReparseError(null), 6000);
    } finally {
      setReparsing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('vacancyModal.delete_confirm'))) {
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
  }, t);

  const modalWorkplaceInfo = getWorkplaceInfo(workplaceType || vacancy.workplace_type, t);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '840px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ flex: 1, paddingRight: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="card-company">
                <Building2 size={13} />
                {vacancy.company}
              </span>
              {vacancy.company_url && (
                <a href={vacancy.company_url} target="_blank" rel="noreferrer" title={t('kanban.company_linkedin')} style={{ color: '#94a3b8' }}>
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
                <span className={`card-workplace-badge ${modalWorkplaceInfo.className}`} style={{ marginLeft: '6px' }}>
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
                <span className="card-closed-badge" style={{ marginLeft: '8px' }} title={t('kanban.closed_hint')}>
                  <Ban size={12} />
                  <span>{t('vacancyModal.closed_badge')}</span>
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {vacancy.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleReparse}
              disabled={reparsing || !vacancy.url}
              title={vacancy.url ? t('vacancyModal.reparse_btn') : undefined}
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderColor: reparseSuccess ? '#10b981' : undefined,
                color: reparseSuccess ? '#10b981' : undefined,
                transition: 'all 0.2s ease'
              }}
            >
              {reparsing ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{t('vacancyModal.reparsing')}</span>
                </>
              ) : reparseSuccess ? (
                <>
                  <Check size={14} color="#10b981" />
                  <span>{t('vacancyModal.saved_salary')}</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>{t('vacancyModal.reparse_btn')}</span>
                </>
              )}
            </button>
            <a 
              href={vacancy.url} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <ExternalLink size={14} />
              <span>LinkedIn</span>
            </a>
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
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
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid',
                  borderColor: isClosed ? 'rgba(244, 63, 94, 0.45)' : 'rgba(16, 185, 129, 0.35)',
                  background: isClosed ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                  color: isClosed ? '#fb7185' : '#34d399',
                  transition: 'all 0.15s ease'
                }}
              >
                {isClosed ? (
                  <>
                    <Ban size={12} />
                    <span>{t('kanban.closed')}</span>
                  </>
                ) : (
                  <>
                    <Check size={12} />
                    <span>{t('vacancyModal.closed_badge')}</span>
                  </>
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
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} />
              <span>{t('vacancyModal.orig_description_title')}</span>
            </label>
            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              maxHeight: '260px',
              overflowY: 'auto',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap'
            }}>
              {vacancy.description || t('vacancyModal.not_specified')}
            </div>
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
