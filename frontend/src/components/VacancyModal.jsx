import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, MapPin, Building2, Sparkles, Tag, Plus, 
  Trash2, RefreshCw, Check, Loader2, FileText, StickyNote, Banknote 
} from 'lucide-react';
import { getSalaryDisplay } from '../utils/salary';

const COLUMNS = [
  "Еще не написан",
  "Написал",
  "Собеседование",
  "Тестовое",
  "Оффер"
];

export default function VacancyModal({ vacancy, isOpen, onClose, onUpdate, onDelete }) {
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
  const [savingSalary, setSavingSalary] = useState(false);
  const [savedSalarySuccess, setSavedSalarySuccess] = useState(false);

  const [resummarizing, setResummarizing] = useState(false);
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
    const minVal = salaryMin !== '' && !isNaN(Number(salaryMin)) ? Number(salaryMin) : null;
    const maxVal = salaryMax !== '' && !isNaN(Number(salaryMax)) ? Number(salaryMax) : null;
    const patchData = {
      salary_min: minVal,
      salary_max: maxVal,
      salary_currency: salaryCurrency,
      salary_period: salaryPeriod,
    };
    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData)
      });
      onUpdate({ ...vacancy, ...patchData });
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
      const res = await fetch(`/api/vacancies/${vacancy.id}/resummarize`, {
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

  const handleDelete = async () => {
    if (window.confirm(`Удалить вакансию "${vacancy.title}"?`)) {
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
  });

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
                <a href={vacancy.company_url} target="_blank" rel="noreferrer" title="Страница компании" style={{ color: '#94a3b8' }}>
                  <ExternalLink size={12} />
                </a>
              )}
              {vacancy.location && (
                <span className="card-location" style={{ marginLeft: '6px' }}>
                  <MapPin size={12} />
                  {vacancy.location}
                </span>
              )}
              {currentSalaryInfo.hasSalary && (
                <span className="card-salary-badge" style={{ marginLeft: '8px' }} title={currentSalaryInfo.original || currentSalaryInfo.formatted}>
                  <Banknote size={13} />
                  <span>{currentSalaryInfo.formatted}</span>
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {vacancy.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* Body */}
        <div className="modal-body">
          {/* Status Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Статус на доске:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {COLUMNS.map(col => (
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
                    borderColor: status === col ? 'var(--primary)' : 'var(--border-subtle)',
                    background: status === col ? 'var(--primary-light)' : 'transparent',
                    color: status === col ? '#a5b4fc' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          {/* Salary Section */}
          <div className="form-group" style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Banknote size={15} color="#34d399" />
                <span style={{ fontWeight: 600 }}>Зарплата / Компенсация</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {currentSalaryInfo.hasSalary && (
                  <span style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 600 }}>
                    Итого за месяц: {currentSalaryInfo.formatted}
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
                      <span style={{ color: '#10b981' }}>Сохранено!</span>
                    </>
                  ) : (
                    <span>Сохранить ЗП</span>
                  )}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Минимум</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                  placeholder="напр. 100000"
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value)}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Максимум</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                  placeholder="напр. 140000"
                  value={salaryMax}
                  onChange={e => setSalaryMax(e.target.value)}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Валюта</span>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Период</span>
                <select
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '6px 8px', cursor: 'pointer' }}
                  value={salaryPeriod}
                  onChange={e => setSalaryPeriod(e.target.value)}
                >
                  <option value="year">в год (/ 12)</option>
                  <option value="month">в месяц</option>
                  <option value="hour">в час (× 160)</option>
                  <option value="week">в неделю</option>
                  <option value="day">в день</option>
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
                <span>AI-Саммари вакансии</span>
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
                    <span>Анализ...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} />
                    <span>Обновить AI</span>
                  </>
                )}
              </button>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {vacancy.ai_summary || "Саммари еще не сформировано (проверьте API ключ в Настройках)."}
            </p>

            {vacancy.company_info && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(99, 102, 241, 0.15)', fontSize: '0.8125rem', color: '#94a3b8' }}>
                <strong style={{ color: '#c7d2fe' }}>О компании: </strong>
                {vacancy.company_info}
              </div>
            )}
          </div>

          {/* Tech Stack */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Стек технологий</span>
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Стек не указан</span>
              )}
            </div>
            <form onSubmit={handleAddTech} style={{ display: 'flex', gap: '8px', maxWidth: '300px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                placeholder="+ Добавить технологию"
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
              Метки / Лейблы задачи
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {tags.map(t => (
                <span key={t} className="tag-chip" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  <Tag size={11} />
                  {t}
                  <button 
                    onClick={() => handleRemoveTag(t)} 
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: '2px' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нет меток</span>
              )}
            </div>
            <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '8px', maxWidth: '300px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                placeholder="+ Новая метка (напр. 'remote')"
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
                <span>Личные заметки (контакты рекрутера, дата интервью, ожидания по зарплате)</span>
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
                    <span style={{ color: '#10b981' }}>Сохранено!</span>
                  </>
                ) : (
                  <span>Сохранить заметку</span>
                )}
              </button>
            </div>
            <textarea
              className="form-textarea"
              style={{ minHeight: '80px' }}
              placeholder="Напишите любые заметки по процессу..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Original Vacancy Description */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} />
              <span>Оригинальный текст вакансии с LinkedIn</span>
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
              {vacancy.description || "Текст вакансии отсутствует"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={14} />
            <span>Удалить вакансию</span>
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
