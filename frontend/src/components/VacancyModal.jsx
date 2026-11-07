import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { 
  X, ExternalLink, MapPin, Building2, Sparkles, Tag, Plus, 
  Trash2, RefreshCw, Check, Loader2, FileText, StickyNote, Banknote,
  Laptop, Layers, Building, Ban, History, MessageSquare, ArrowRight, Edit3,
  ChevronDown, ChevronUp, Copy, Shield, Award, AlertCircle, Globe
} from 'lucide-react';
import { getSalaryDisplay } from '../utils/salary';
import { useGridScroll } from '../utils/useGridScroll';
import { getWorkplaceInfo } from '../utils/workplace';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { computeCVDiff } from '../utils/cvDiff';
import {
  STATUS_NOT_CONTACTED,
  STATUS_REJECTED,
  DEFAULT_COLUMNS,
} from '../constants/columns';

export default function VacancyModal({ vacancy, isOpen, onClose, onUpdate, onDelete, columns = DEFAULT_COLUMNS }) {
  const { t, locale, formatDate, salaryDisplayFormat } = useTranslation();
  const snapScroll = useGridScroll();
  const [status, setStatus] = useState(vacancy?.status || STATUS_NOT_CONTACTED);

  const modalColumns = Array.isArray(columns) && columns.length > 0
    ? columns.map(c => typeof c === 'string' ? { id: c, color: '#2563eb' } : c)
    : DEFAULT_COLUMNS;

  const stageColorMap = modalColumns.reduce((acc, col) => {
    acc[col.id] = col.color;
    return acc;
  }, { [STATUS_REJECTED]: "#ef4444", [STATUS_NOT_CONTACTED]: "#2563eb" });

  const getStageLabel = (colId, lane) => {
    const colName = t(`kanban.columns.${colId}`) || colId;
    const colObj = modalColumns.find(c => c.id === colId);
    if (colObj?.has_lanes && lane != null) {
      return `${colName} · ${t('kanban.stage_badge', { n: lane + 1 })}`;
    }
    return colName;
  };
  const [tags, setTags] = useState(vacancy?.tags || []);
  const [newTagInput, setNewTagInput] = useState("");
  const [notes, setNotes] = useState(vacancy?.notes || "");
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [historyCommentText, setHistoryCommentText] = useState("");
  const [savingHistoryId, setSavingHistoryId] = useState(null);
  const [techStack, setTechStack] = useState(vacancy?.tech_stack || []);
  const [newTechInput, setNewTechInput] = useState("");
  const [editingTech, setEditingTech] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const listValues = useRef({ tags: vacancy?.tags || [], tech_stack: vacancy?.tech_stack || [] });
  const listSaveQueue = useRef(Promise.resolve());
  const listSaveVersion = useRef(0);
  
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
  const titleTextareaRef = useRef(null);

  // CV Compatibility Analysis state
  const [compatibility, setCompatibility] = useState(null);
  const [loadingCompatibility, setLoadingCompatibility] = useState(false);
  const [analyzingCompatibility, setAnalyzingCompatibility] = useState(false);
  const [compatError, setCompatError] = useState(null);
  const [showEvidenceMap, setShowEvidenceMap] = useState({});

  // Adapted CV editing & regeneration state
  const [adaptingCV, setAdaptingCV] = useState(false);
  const [adaptError, setAdaptError] = useState(null);

  // Versioning and comments for Adapted CV
  const [adaptComment, setAdaptComment] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [lastDiffItems, setLastDiffItems] = useState([]);

  // Modal navigation tab
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'compatibility'

  const detailBodyRef = useRef(null);
  const modalRef = useRef(null);
  useLayoutEffect(() => {
    const modal = modalRef.current;
    if (!isOpen || !modal) return;
    const alignControls = () => {
      const grid = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
      modal.querySelectorAll('.vacancy-tabs .settings-tab-btn, .vacancy-status-option, .modal-status-label, .workplace-label, .modal-header-actions .header-action-badge:not(.btn-icon)').forEach(control => {
        control.style.width = '';
        const width = control.offsetWidth;
        if (width) control.style.width = `${Math.ceil((width - .01) / grid) * grid}px`;
      });
    };
    alignControls();
    window.addEventListener('resize', alignControls);
    document.fonts?.ready.then(alignControls);
    return () => window.removeEventListener('resize', alignControls);
  }, [isOpen, locale, columns, activeTab, compatibility?.overall_score]);
  useLayoutEffect(() => {
    const body = detailBodyRef.current;
    if (!isOpen || activeTab !== 'details' || !body) return;
    const sections = Array.from(body.querySelectorAll(':scope > .stage-history-section, :scope > .vacancy-notes-section, :scope > .orig-desc-section'));
    let frame;
    const align = () => {
      sections.forEach(section => {
        section.style.minHeight = '0px';
        section.style.minHeight = `${Math.ceil(section.offsetHeight / 32) * 32}px`;
      });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(align); };
    const resize = new ResizeObserver(schedule);
    resize.observe(body);
    sections.forEach(section => resize.observe(section));
    const mutation = new MutationObserver(schedule);
    sections.forEach(section => mutation.observe(section, { childList: true, subtree: true, characterData: true }));
    align();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); };
  }, [isOpen, activeTab]);



  const adjustTitleHeight = () => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTitleHeight();
    const timer = setTimeout(adjustTitleHeight, 50);
    return () => clearTimeout(timer);
  }, [title, isOpen]);

  useEffect(() => {
    window.addEventListener('resize', adjustTitleHeight);
    return () => window.removeEventListener('resize', adjustTitleHeight);
  }, []);

  useEffect(() => {
    if (vacancy) {
      setStatus(vacancy.status || STATUS_NOT_CONTACTED);
      setTags(vacancy.tags || []);
      listValues.current = { tags: vacancy.tags || [], tech_stack: vacancy.tech_stack || [] };
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
      setCompatibility(null);
      setCompatError(null);
      setAdaptingCV(false);
      setAdaptError(null);

      // Fetch cached compatibility analysis
      if (vacancy.id) {
        setLoadingCompatibility(true);
        fetch(`/api/vacancies/${vacancy.id}/compatibility`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => setCompatibility(data))
          .catch((err) => console.warn('Failed to load compatibility:', err))
          .finally(() => setLoadingCompatibility(false));
      }
    }
  }, [vacancy]);

  const handleRunCompatibilityAnalysis = async (force = false) => {
    if (!vacancy?.id) return;
    setAnalyzingCompatibility(true);
    setCompatError(null);
    try {
      const url = `/api/vacancies/${vacancy.id}/compatibility${force ? '?force=true' : ''}`;
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Analysis failed');
      }
      const data = await res.json();
      setCompatibility(data);
    } catch (err) {
      setCompatError(err.message);
    } finally {
      setAnalyzingCompatibility(false);
    }
  };

  const handleManualAdaptCV = async (parentVerId = null) => {
    if (!vacancy?.id) return;
    setAdaptingCV(true);
    setAdaptError(null);
    try {
      // Find previous version for diff calculation
      const prevVersionObj = (compatibility?.versions || []).find(v => v.id === (parentVerId || selectedVersionId)) || (compatibility?.versions || [])[0];
      const prevAdaptedCv = prevVersionObj ? prevVersionObj.adapted_cv : compatibility?.adapted_cv;

      const bodyPayload = {
        user_comment: adaptComment.trim() || null,
        parent_version_id: parentVerId || selectedVersionId || null,
      };

      const res = await fetch(`/api/vacancies/${vacancy.id}/adapt-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'CV adaptation failed');
      }
      const data = await res.json();
      setCompatibility(data);
      setAdaptComment('');

      // Auto-select newest version and calculate diff
      if (data.versions && data.versions.length > 0) {
        setSelectedVersionId(data.versions[0].id);
        if (prevAdaptedCv) {
          const diffs = computeCVDiff(prevAdaptedCv, data.versions[0].adapted_cv);
          setLastDiffItems(diffs);
          setShowDiff(true);
        }
      }

      trackEvent('CV_MANUAL_ADAPT_SUCCESS', { vacancy_id: vacancy.id });
    } catch (err) {
      console.error('Manual adaptation failed:', err);
      setAdaptError(err.message || 'Failed to adapt CV');
    } finally {
      setAdaptingCV(false);
    }
  };

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
            to_status: vacancy.status || STATUS_NOT_CONTACTED,
            to_lane: vacancy.lane ?? 0,
            from_lane: vacancy.lane ?? 0,
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

  const saveList = (field, values, eventName, eventData) => {
    listValues.current = { ...listValues.current, [field]: values };
    if (field === 'tags') setTags(values); else setTechStack(values);
    trackEvent(eventName, { vacancy_id: vacancy.id, ...eventData });
    const version = ++listSaveVersion.current;
    const vacancyId = vacancy.id;
    listSaveQueue.current = listSaveQueue.current.catch(() => {}).then(async () => {
      const res = await fetch(`/api/vacancies/${vacancyId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: values })
      });
      if (!res.ok) throw new Error('Failed to save vacancy list');
      const updated = await res.json();
      if (version === listSaveVersion.current) onUpdate(updated);
    }).catch(err => console.error('Failed to save vacancy list', err));
  };

  const addListItems = (field, raw) => {
    const current = listValues.current[field];
    const items = raw.split(',').map(value => field === 'tags' ? value.trim().toLowerCase() : value.trim()).filter(Boolean);
    const added = [...new Set(items)].filter(value => !current.includes(value));
    if (!added.length) return;
    saveList(field, [...current, ...added], field === 'tags' ? EVENTS.TAG_ADD : EVENTS.TECH_ADD,
      field === 'tags' ? { tag: added.join(', ') } : { tech: added.join(', ') });
  };

  const handleRemoveTag = (tagToRemove) => {
    saveList('tags', listValues.current.tags.filter(tag => tag !== tagToRemove), EVENTS.TAG_REMOVE, { tag: tagToRemove });
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

  const handleRemoveTech = (techToRemove) => {
    saveList('tech_stack', listValues.current.tech_stack.filter(tech => tech !== techToRemove), EVENTS.TECH_REMOVE, { tech: techToRemove });
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

  const executeReparse = async () => {
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

  const handleReparse = async () => {
    if (!vacancy?.id || reparsing) return;
    await executeReparse();
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
      <div ref={modalRef} className="modal-content vacancy-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '832px' }}>
        {/* Header */}
        <div className="modal-header modal-header-custom" style={{ display: 'block' }}>
          <div className="modal-header-top">
            <div className="modal-company-title">
              <span className="card-company">
                <Building2 size={13} />
                <span>{vacancy.company}</span>
              </span>
              {vacancy.company_url && (
                <a
                  href={vacancy.company_url}
                  target="_blank"
                  rel="noreferrer"
                  title={t('kanban.company_linkedin')}
                  className="modal-company-link"
                  onClick={() => trackEvent(EVENTS.COMPANY_LINK_CLICK, { vacancy_id: vacancy.id, company: vacancy.company })}
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            
            <div className="modal-header-actions">
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
                  vacancy.source || (() => {
                    if (!vacancy.url) return 'Link';
                    try {
                      const hn = new URL(vacancy.url).hostname;
                      if (hn.includes('linkedin.com')) return 'LinkedIn';
                      if (hn.includes('upwork.com')) return 'Upwork';
                      if (hn.includes('indeed.')) return 'Indeed';
                      if (hn.includes('hh.ru')) return 'HH.ru';
                      return hn.replace(/^www\./, '');
                    } catch(e) { return 'Link'; }
                  })()
                }</span>
              </a>
              <button className="btn-icon header-action-badge header-badge modal-close-btn" onClick={onClose} title={t('vacancyModal.close_btn')}>
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="modal-header-badges">
            {vacancy.location && (
              <span className="card-location">
                <MapPin size={12} />
                <span>{vacancy.location}</span>
              </span>
            )}
            {modalWorkplaceInfo && (
              <span className={`card-workplace-badge header-badge ${modalWorkplaceInfo.className}`}>
                {modalWorkplaceInfo.key === 'remote' && <Laptop size={11} />}
                {modalWorkplaceInfo.key === 'hybrid' && <Layers size={11} />}
                {modalWorkplaceInfo.key === 'on-site' && <Building size={11} />}
                <span>{modalWorkplaceInfo.label}</span>
              </span>
            )}
            {currentSalaryInfo.hasSalary && (
              <span className="card-salary-badge" title={currentSalaryInfo.original || currentSalaryInfo.formatted}>
                <Banknote size={13} />
                <span>{currentSalaryInfo.formatted}</span>
              </span>
            )}
            {isClosed && (
              <span className="card-closed-badge header-badge" title={t('kanban.closed_hint')}>
                <Ban size={12} />
                <span>{t('vacancyModal.closed_badge')}</span>
              </span>
            )}
          </div>

          <div className="modal-header-title">
            <textarea
              ref={titleTextareaRef}
              rows={1}
              className="modal-title-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                adjustTitleHeight();
              }}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.target.blur();
                }
              }}
              title="Нажмите, чтобы редактировать"
            />
            {savingTitle && (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginTop: '6px', flexShrink: 0 }} />
            )}
            {savedTitleSuccess && (
              <Check size={16} color="#10b981" style={{ marginTop: '6px', flexShrink: 0 }} />
            )}
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

        {/* Navigation Tabs */}
        <div className="settings-tabs vacancy-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <FileText size={15} />
            <span>{t('vacancyModal.tab_details')}</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'compatibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('compatibility')}
          >
            <Shield size={15} color={compatibility ? '#34d399' : undefined} />
            <span>{t('vacancyModal.tab_cv_compatibility')}</span>
            {compatibility && (
              <span style={{
                background: compatibility.overall_score >= 70 ? '#059669' : compatibility.overall_score >= 45 ? '#d97706' : '#ef4444',
                color: '#ffffff',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '0.725rem',
                fontWeight: '700',
                marginLeft: '4px'
              }}>
                {Math.round(compatibility.overall_score)}%
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" ref={detailBodyRef} onScroll={snapScroll}>
          {activeTab === 'details' && (
            <>
          {/* Status & Workplace Format Bar */}
          <div className="modal-meta-bar">
            <div className="modal-status-group">
              <span className="modal-status-label">
                {t('vacancyModal.status_label')}
              </span>
              <div className="modal-status-buttons">
                {modalColumns.map(colItem => {
                  const col = colItem.id;
                  const isSelected = status === col;
                  const isRejectedCol = col === 'Отказ';
                  let borderColor = 'var(--border-subtle)';
                  let background = 'transparent';
                  let color = 'var(--text-muted)';

                  if (isSelected) {
                    if (isRejectedCol) {
                      borderColor = '#ef4444';
                      background = 'rgba(239, 68, 68, 0.15)';
                      color = 'var(--text-primary)';
                    } else {
                      borderColor = colItem.color || 'var(--primary)';
                      background = `${colItem.color || 'var(--primary)'}22`;
                      color = 'var(--text-primary)';
                    }
                  } else if (isRejectedCol) {
                    color = 'var(--text-muted)';
                  }

                  return (
                    <button
                      key={col}
                      onClick={() => handleStatusChange(col)}
                      className="vacancy-status-option"
                      aria-pressed={isSelected}
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
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t(`kanban.columns.${col}`)}
                    </button>
                  );
                })}
              </div>
              <select
                className="form-input modal-status-select"
                value={status}
                onChange={e => handleStatusChange(e.target.value)}
              >
                {modalColumns.map(colItem => (
                  <option key={colItem.id} value={colItem.id}>
                    {t(`kanban.columns.${colItem.id}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className='modal-status-group'>
              <span className="workplace-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                {t('vacancyModal.workplace_label')}
              </span>
              <select
                className="form-input modal-workplace-select"
                value={workplaceType}
                onChange={e => handleWorkplaceTypeChange(e.target.value)}
              >
                <option value="">{t('vacancyModal.not_specified')}</option>
                <option value="remote">{t('workplace.full_remote')}</option>
                <option value="hybrid">{t('workplace.full_hybrid')}</option>
                <option value="on-site">{t('workplace.full_onsite')}</option>
              </select>
            </div>

            <div className='modal-status-group'>
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
          <div className="form-group vacancy-salary">
            <div className="vacancy-salary-header">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Banknote size={15} color="var(--aspen-mint)" />
                <span style={{ fontWeight: 600 }}>{t('vacancyModal.salary_title')}</span>
              </label>
                <button
                  type="button"
                  className="btn btn-secondary vacancy-salary-save"
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
            {currentSalaryInfo.hasSalary && (
              <div className="vacancy-salary-total">
                {t('vacancyModal.monthly_total', { amount: currentSalaryInfo.formatted })}
              </div>
            )}
            <div className="salary-fields-grid">
              <div className="salary-field-item">
                <span className="salary-field-label">{t('vacancyModal.min')}</span>
                <input
                  type="number"
                  className="form-input salary-field-input"
                  placeholder={t('vacancyModal.min_placeholder')}
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value)}
                />
              </div>
              <div className="salary-field-item">
                <span className="salary-field-label">{t('vacancyModal.max')}</span>
                <input
                  type="number"
                  className="form-input salary-field-input"
                  placeholder={t('vacancyModal.max_placeholder')}
                  value={salaryMax}
                  onChange={e => setSalaryMax(e.target.value)}
                />
              </div>
              <div className="salary-field-item">
                <span className="salary-field-label">{t('vacancyModal.currency')}</span>
                <select
                  className="form-input salary-field-input"
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
              <div className="salary-field-item">
                <span className="salary-field-label">{t('vacancyModal.period')}</span>
                <select
                  className="form-input salary-field-input"
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
              <div className="salary-original">
                {currentSalaryInfo.original}
              </div>
            )}
          </div>

          {/* AI Summary Section */}
          <div className="vacancy-ai-summary">
            <div className="vacancy-ai-summary-header">
              <div className="vacancy-ai-summary-title">
                <Sparkles size={16} />
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
            
            <p className="vacancy-ai-summary-text">
              {vacancy.ai_summary || t('vacancyModal.no_summary')}
            </p>

            {vacancy.company_info && (
              <div className="vacancy-ai-company">
                <strong>{t('vacancyModal.about_company')}</strong>
                {vacancy.company_info}
              </div>
            )}
          </div>

          {/* Tech Stack */}
          <div className="form-group vacancy-tokens-section">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{t('vacancyModal.tech_stack_title')}</span>
            </label>
            <div className="editable-token-list">
              {techStack.map(tech => (
                <span key={tech} className="editable-token">{tech}
                  <button type="button" className="editable-token-remove" onClick={() => handleRemoveTech(tech)} aria-label={`${t('common.delete')} ${tech}`}><X size={12} /></button>
                </span>
              ))}
              {editingTech ? (
                <input autoFocus className="form-input editable-token-input" aria-label={t('vacancyModal.add_tech_placeholder')}
                  placeholder={t('vacancyModal.add_tech_placeholder')} value={newTechInput}
                  onChange={e => { const value = e.target.value; if (value.includes(',')) { const parts = value.split(','); setNewTechInput(parts.pop()); addListItems('tech_stack', parts.join(',')); } else setNewTechInput(value); }}
                  onBlur={() => { addListItems('tech_stack', newTechInput); setNewTechInput(''); setEditingTech(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addListItems('tech_stack', newTechInput); setNewTechInput(''); } if (e.key === 'Escape') { setNewTechInput(''); setEditingTech(false); } }} />
              ) : <button type="button" className="editable-token-add" onClick={() => setEditingTech(true)} aria-label={t('vacancyModal.add_tech_placeholder')} title={t('vacancyModal.add_tech_placeholder')}><Plus size={15} /></button>}
            </div>
          </div>

          {/* Custom Tags */}
          <div className="form-group vacancy-tokens-section">
            <label className="form-label">{t('vacancyModal.tags_title')}</label>
            <div className="editable-token-list">
              {tags.map(tagItem => (
                <span key={tagItem} className="editable-token"><Tag size={11} />{tagItem}
                  <button type="button" className="editable-token-remove" onClick={() => handleRemoveTag(tagItem)} aria-label={`${t('common.delete')} ${tagItem}`}><X size={12} /></button>
                </span>
              ))}
              {editingTags ? (
                <input autoFocus className="form-input editable-token-input" aria-label={t('vacancyModal.add_tag_placeholder')}
                  placeholder={t('vacancyModal.add_tag_placeholder')} value={newTagInput}
                  onChange={e => { const value = e.target.value; if (value.includes(',')) { const parts = value.split(','); setNewTagInput(parts.pop()); addListItems('tags', parts.join(',')); } else setNewTagInput(value); }}
                  onBlur={() => { addListItems('tags', newTagInput); setNewTagInput(''); setEditingTags(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addListItems('tags', newTagInput); setNewTagInput(''); } if (e.key === 'Escape') { setNewTagInput(''); setEditingTags(false); } }} />
              ) : <button type="button" className="editable-token-add" onClick={() => setEditingTags(true)} aria-label={t('vacancyModal.add_tag_placeholder')} title={t('vacancyModal.add_tag_placeholder')}><Plus size={15} /></button>}
            </div>
          </div>

          {/* Stage Movement History */}
          <div className="form-group stage-history-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
                <History size={15} color="#60a5fa" />
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
                  const stageColor = stageColorMap[item.to_status] || '#2563eb';
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
                            {item.from_status && (
                              item.from_status !== item.to_status ||
                              (item.from_lane != null && item.to_lane != null && item.from_lane !== item.to_lane)
                            ) ? (
                              <div className="stage-transition-group">
                                <span className="stage-badge stage-badge-from">
                                  {getStageLabel(item.from_status, item.from_lane)}
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
                                  {getStageLabel(item.to_status, item.to_lane)}
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
                                {getStageLabel(item.to_status, item.to_lane)}
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
          <div className="form-group vacancy-notes-section">
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
            </>
          )}

          {activeTab === "compatibility" && (
            <div className="vacancy-compatibility-content">
          {/* CV Compatibility Analysis Section */}
          <div className="vacancy-compatibility">
            <div className="compatibility-header">
              <div className="compatibility-header-title">
                <Shield size={18} color="var(--aspen-mint)" />
                <span>{t('vacancyModal.compat_title')}</span>
                {compatibility && (
                  <div className="compatibility-scores">
                    <span style={{
                      background: compatibility.overall_score >= 70 ? '#059669' : compatibility.overall_score >= 45 ? '#d97706' : '#ef4444',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '0',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      marginLeft: '4px'
                    }}>
                      AI Match: {Math.round(compatibility.overall_score)}%
                    </span>
                    {compatibility.calculated_score != null && (
                      <span style={{
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                        padding: '2px 6px',
                        borderRadius: '0',
                        fontSize: '0.7rem',
                      }} title={t('vacancyModal.compat_formula_hint')}>
                        {t('vacancyModal.compat_formula')}: {Math.round(compatibility.calculated_score)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                className="btn btn-secondary compatibility-analyze"
                onClick={() => handleRunCompatibilityAnalysis(!!compatibility)}
                disabled={analyzingCompatibility || loadingCompatibility}
                style={{ color: 'var(--aspen-mint)' }}
              >
                {analyzingCompatibility ? (
                  <>
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{t('vacancyModal.compat_loading')}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} />
                    <span>{t(compatibility ? 'vacancyModal.compat_reanalyze' : 'vacancyModal.compat_compare')}</span>
                  </>
                )}
              </button>
            </div>

            {compatError && (
              <div className="compatibility-notice is-error">
                {compatError}
              </div>
            )}

            {compatibility ? (
              <div>
                {compatibility.is_outdated && (
                  <div className="compatibility-notice is-outdated">
                    <AlertCircle size={14} />
                    <span>{t('vacancyModal.compat_outdated', { revision: compatibility.cv_revision })}</span>
                  </div>
                )}

                <p className="compatibility-summary">
                  {compatibility.summary}
                </p>

                {/* Seniority assessment */}
                {compatibility.seniority_assessment && (
                  <div className="compatibility-assessment">
                    <span style={{ color: 'var(--text-secondary)' }}>{t('vacancyModal.compat_seniority')} </span>
                    <strong style={{ color: 'var(--primary)' }}>{compatibility.seniority_assessment.status}</strong> — {compatibility.seniority_assessment.comment}
                  </div>
                )}

                {/* Matched Requirements with Evidence toggles */}
                {compatibility.matched_requirements?.length > 0 && (
                  <div className="compatibility-group">
                    <div className="compatibility-group-title is-matched">
                      {t('vacancyModal.compat_matched', { count: compatibility.matched_requirements.length })}
                    </div>
                    <div className="compatibility-list">
                      {compatibility.matched_requirements.map((m, idx) => (
                        <div key={idx} className="compatibility-row">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowEvidenceMap(prev => ({ ...prev, [`m_${idx}`]: !prev[`m_${idx}`] }))}>
                            <span style={{ color: 'var(--aspen-mint)', fontWeight: 600 }}>&bull; {m.requirement}</span>
                            <span style={{ color: 'var(--aspen-mint)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              {t('vacancyModal.compat_evidence')} {showEvidenceMap[`m_${idx}`] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </span>
                          </div>
                          {showEvidenceMap[`m_${idx}`] && (
                            <div className="compatibility-evidence">
                              {m.evidence}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Requirements */}
                {compatibility.missing_requirements?.length > 0 && (
                  <div className="compatibility-group">
                    <div className="compatibility-group-title is-missing">
                      {t('vacancyModal.compat_missing', { count: compatibility.missing_requirements.length })}
                    </div>
                    <div className="compatibility-list">
                      {compatibility.missing_requirements.map((m, idx) => (
                        <div key={idx} className="compatibility-row">
                          &bull; <strong>{m.requirement}</strong> ({m.severity}): {m.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Gaps */}
                {compatibility.critical_gaps?.length > 0 && (
                  <div className="compatibility-group">
                    <div className="compatibility-group-title is-critical">
                      {t('vacancyModal.compat_gaps')}
                    </div>
                    <div className="compatibility-list">
                      {compatibility.critical_gaps.map((g, idx) => (
                        <div key={idx} className="compatibility-row">
                          &bull; <strong>{g.requirement}</strong>: {g.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grounded Actionable Recommendations */}
                {compatibility.recommendations?.length > 0 && (
                  <div className="compatibility-recommendations">
                    <div className="compatibility-group-title is-recommendations">
                      {t('vacancyModal.compat_recommendations')}
                    </div>
                    <ul className="compatibility-recommendation-list">
                      {compatibility.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="compatibility-empty">
                {t('vacancyModal.compat_empty')}
              </p>
            )}
          </div>

            </div>
          )}
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
