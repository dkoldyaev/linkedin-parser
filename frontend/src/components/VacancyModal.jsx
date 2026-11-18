import React, { useState, useEffect } from 'react';
import {
  AlertBanner,
  VacancyDetailsModal,
} from '@blueprint/ui-kit';
import { getSalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import {
  STATUS_NOT_CONTACTED,
  STATUS_REJECTED,
  DEFAULT_COLUMNS,
} from '../constants/columns';

export default function VacancyModal({
  vacancy,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  columns = DEFAULT_COLUMNS,
}) {
  const { t, locale, formatDate, salaryDisplayFormat, salaryTargetCurrency, exchangeRates } = useTranslation();
  const [status, setStatus] = useState(vacancy?.status || STATUS_NOT_CONTACTED);

  const modalColumns = Array.isArray(columns) && columns.length > 0
    ? columns.map(c => typeof c === 'string' ? { id: c, name: c } : c)
    : DEFAULT_COLUMNS;

  const rejectedColumn = modalColumns.find(c => c.system_role === 'rejected' || (c.is_base && (c.id === STATUS_REJECTED || c.role === 'rejected'))) || modalColumns.find(c => c.id === STATUS_REJECTED) || modalColumns.find(c => c.is_base && c.system_role !== 'not_contacted');
  const rejectedStatusId = rejectedColumn ? rejectedColumn.id : STATUS_REJECTED;

  const getStageLabel = (colId, lane) => {
    const colName = t(`kanban.columns.${colId}`) || colId;
    const colObj = modalColumns.find(c => c.id === colId);
    if (colObj?.has_lanes && lane != null) {
      return `${colName} · ${t('kanban.stage_badge', { n: lane + 1 })}`;
    }
    return colName;
  };

  const [tags, setTags] = useState(vacancy?.tags || []);
  const [techStack, setTechStack] = useState(vacancy?.tech_stack || []);
  const [notes, setNotes] = useState(vacancy?.notes || "");
  const [description, setDescription] = useState(vacancy?.description || "");
  const [title, setTitle] = useState(vacancy?.title || "");

  const [salaryMin, setSalaryMin] = useState(vacancy?.salary_min ?? '');
  const [salaryMax, setSalaryMax] = useState(vacancy?.salary_max ?? '');
  const [salaryCurrency, setSalaryCurrency] = useState(vacancy?.salary_currency || '$');
  const [salaryPeriod, setSalaryPeriod] = useState(vacancy?.salary_period || 'month');
  const [workplaceType, setWorkplaceType] = useState(vacancy?.workplace_type || '');
  const [isClosed, setIsClosed] = useState(Boolean(vacancy?.is_closed));

  const [savingSalary, setSavingSalary] = useState(false);
  const [savedSalarySuccess, setSavedSalarySuccess] = useState(false);
  const [resummarizing, setResummarizing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [reparseError, setReparseError] = useState(null);
  const [reparseSuccess, setReparseSuccess] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotesSuccess, setSavedNotesSuccess] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [savedDescSuccess, setSavedDescSuccess] = useState(false);

  // CV Compatibility Analysis state
  const [compatibility, setCompatibility] = useState(null);
  const [loadingCompatibility, setLoadingCompatibility] = useState(false);
  const [analyzingCompatibility, setAnalyzingCompatibility] = useState(false);
  const [compatError, setCompatError] = useState(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (vacancy) {
      setStatus(vacancy.status || STATUS_NOT_CONTACTED);
      setTags(vacancy.tags || []);
      setTechStack(vacancy.tech_stack || []);
      setNotes(vacancy.notes || '');
      setDescription(vacancy.description || '');
      setTitle(vacancy.title || '');
      setSalaryMin(vacancy.salary_min ?? '');
      setSalaryMax(vacancy.salary_max ?? '');
      setSalaryCurrency(vacancy.salary_currency || '$');
      setSalaryPeriod(vacancy.salary_period || 'month');
      setWorkplaceType(vacancy.workplace_type || '');
      setIsClosed(Boolean(vacancy.is_closed));
      setCompatibility(null);
      setCompatError(null);

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

  if (!isOpen || !vacancy) return null;

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
      vacancy_id: vacancy.id,
      from_status: vacancy.status,
      to_status: newStatus,
      method: 'modal_button',
    });
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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

  const handleWorkplaceTypeChange = async (newType) => {
    const val = newType || null;
    setWorkplaceType(val || '');
    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workplace_type: val }),
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
        body: JSON.stringify({ is_closed: nextVal }),
      });
      onUpdate({ ...vacancy, is_closed: nextVal });
    } catch (err) {
      console.error('Failed to update closed status', err);
    }
  };

  const handleSaveSalary = async (salaryData) => {
    setSavingSalary(true);
    try {
      const payload = {
        salary_min: salaryData.min !== '' ? parseFloat(salaryData.min) : null,
        salary_max: salaryData.max !== '' ? parseFloat(salaryData.max) : null,
        salary_currency: salaryData.currency || null,
        salary_period: salaryData.period || null,
      };
      setSalaryMin(salaryData.min);
      setSalaryMax(salaryData.max);
      setSalaryCurrency(salaryData.currency);
      setSalaryPeriod(salaryData.period);
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      onUpdate({
        ...vacancy,
        ...payload,
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
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        onUpdate(await res.json());
      }
    } catch (err) {
      console.error('Failed to save title', err);
    }
  };

  const handleSaveNotes = async (nextNotes) => {
    setSavingNotes(true);
    setNotes(nextNotes);
    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: nextNotes }),
      });
      onUpdate({ ...vacancy, notes: nextNotes });
      setSavedNotesSuccess(true);
      setTimeout(() => setSavedNotesSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save notes', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveDescription = async (nextDesc) => {
    setSavingDesc(true);
    setDescription(nextDesc);
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: nextDesc }),
      });
      if (res.ok) {
        onUpdate(await res.json());
        setSavedDescSuccess(true);
        setTimeout(() => setSavedDescSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save description', err);
    } finally {
      setSavingDesc(false);
    }
  };

  const handleTechStackChange = async (nextTech) => {
    setTechStack(nextTech);
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tech_stack: nextTech }),
      });
      if (res.ok) onUpdate(await res.json());
    } catch (err) {
      console.error('Failed to update tech stack', err);
    }
  };

  const handleTagsChange = async (nextTags) => {
    setTags(nextTags);
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: nextTags }),
      });
      if (res.ok) onUpdate(await res.json());
    } catch (err) {
      console.error('Failed to update tags', err);
    }
  };

  const handleSaveHistoryComment = async (historyId, comment) => {
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/history/${historyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment.trim() || null }),
      });
      if (res.ok) onUpdate(await res.json());
    } catch (err) {
      console.error('Failed to save history comment', err);
    }
  };

  const handleDeleteHistoryComment = async (historyId) => {
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/history/${historyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: null }),
      });
      if (res.ok) onUpdate(await res.json());
    } catch (err) {
      console.error('Failed to delete history comment', err);
    }
  };

  const handleResummarize = async () => {
    setResummarizing(true);
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/resummarize?language=${locale}`, {
        method: 'POST',
      });
      if (res.ok) onUpdate(await res.json());
    } catch (err) {
      console.error('Failed to resummarize', err);
    } finally {
      setResummarizing(false);
    }
  };

  const handleReparse = async () => {
    setReparsing(true);
    setReparseError(null);
    setReparseSuccess(false);
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/reparse`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || t('common.error'));
      }
      setReparseSuccess(true);
      setTimeout(() => setReparseSuccess(false), 3000);
    } catch (err) {
      setReparseError(err.message || t('common.error'));
      setTimeout(() => setReparseError(null), 6000);
    } finally {
      setReparsing(false);
    }
  };

  const handleRunCompatibility = async (force = false) => {
    setAnalyzingCompatibility(true);
    setCompatError(null);
    try {
      const url = `/api/vacancies/${vacancy.id}/compatibility${force ? '?force=true' : ''}`;
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Analysis failed');
      }
      setCompatibility(await res.json());
    } catch (err) {
      setCompatError(err.message);
    } finally {
      setAnalyzingCompatibility(false);
    }
  };

  const salaryInfo = getSalaryDisplay(vacancy, t, salaryDisplayFormat, salaryTargetCurrency, exchangeRates);
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);
  const matchScore = vacancy.match_score != null ? Math.round(vacancy.match_score) : undefined;

  const stageOptions = modalColumns.map((col) => ({
    value: col.id,
    label: t(`kanban.columns.${col.id}`) || col.name || col.id,
  }));

  const workplaceOptions = [
    { value: '', label: t('vacancyModal.not_specified') },
    { value: 'remote', label: t('workplace.full_remote') },
    { value: 'hybrid', label: t('workplace.full_hybrid') },
    { value: 'on-site', label: t('workplace.full_onsite') },
  ];

  const historyItems = (vacancy.history || []).map((h, idx) => ({
    id: String(h.id || idx),
    label: getStageLabel(h.to_status, h.to_lane),
    fromLabel: h.from_status ? getStageLabel(h.from_status, h.from_lane) : undefined,
    timestamp: formatDate(h.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    tone: 'accent',
    comment: h.comment || '',
  }));

  // Build compatibility sections
  const compatibilitySections = [];
  if (compatibility?.matched_requirements?.length > 0) {
    compatibilitySections.push({
      id: 'matched',
      title: t('vacancyModal.compat_matched', { count: compatibility.matched_requirements.length }),
      tone: 'success',
      items: compatibility.matched_requirements.map((m, idx) => ({
        id: `m_${idx}`,
        title: m.requirement,
        content: m.evidence,
        actionLabel: t('vacancyModal.compat_evidence'),
      })),
    });
  }

  if (compatibility?.missing_requirements?.length > 0) {
    compatibilitySections.push({
      id: 'missing',
      title: t('vacancyModal.compat_missing', { count: compatibility.missing_requirements.length }),
      tone: 'warning',
      items: compatibility.missing_requirements.map((m, idx) => ({
        id: `missing_${idx}`,
        title: m.requirement,
        content: m.reason,
        actionLabel: m.severity || 'medium',
      })),
    });
  }

  if (compatibility?.critical_gaps?.length > 0) {
    compatibilitySections.push({
      id: 'gaps',
      title: t('vacancyModal.compat_gaps'),
      tone: 'danger',
      defaultExpandedIds: compatibility.critical_gaps.map((_, idx) => `gap_${idx}`),
      items: compatibility.critical_gaps.map((g, idx) => ({
        id: `gap_${idx}`,
        title: g.gap || g,
        content: g.impact || g.reason,
        actionLabel: 'critical',
      })),
    });
  }

  const recommendationsList = (compatibility?.recommendations || []).map((r) =>
    typeof r === 'string' ? r : r.text || r.title || ''
  ).filter(Boolean);

  const displayScore = compatibility
    ? (compatibility.calculated_score != null ? Math.round(compatibility.calculated_score) : Math.round(compatibility.overall_score))
    : matchScore;

  const scoreTone =
    displayScore == null
      ? 'neutral'
      : displayScore >= 70
        ? 'success'
        : displayScore >= 45
          ? 'warning'
          : 'danger';

  const seniorityStatus = compatibility?.seniority_assessment?.status;
  const seniorityStatusTone = seniorityStatus === 'matched' ? 'success' : seniorityStatus === 'partially_matched' ? 'warning' : 'danger';
  const seniorityStatusLabel = seniorityStatus ? (t(`vacancyModal.compat_seniority_status.${seniorityStatus}`) || seniorityStatus) : '';

  const banner = (
    <>
      {reparseError && (
        <AlertBanner tone="danger" title={reparseError} style={{ margin: 'var(--ui-space-2) var(--ui-space-3)' }} />
      )}
      {reparseSuccess && (
        <AlertBanner tone="success" title={t('vacancyModal.reparse_success')} style={{ margin: 'var(--ui-space-2) var(--ui-space-3)' }} />
      )}
    </>
  );

  return (
    <VacancyDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      banner={banner}
      size="xl"
      title={title}
      onTitleChange={setTitle}
      onSaveTitle={handleSaveTitle}
      company={vacancy.company}
      sourceUrl={vacancy.url}
      location={vacancy.location}
      workplace={workplaceType}
      workplaceLabel={workplaceInfo.label}
      workplaceOptions={workplaceOptions}
      onWorkplaceChange={handleWorkplaceTypeChange}
      isClosed={isClosed}
      onToggleClosed={handleToggleClosed}
      closedBadgeLabel={t('kanban.closed')}
      closedButtonLabel={t('kanban.closed')}
      openButtonLabel={t('vacancyModal.open_badge')}
      formattedSalary={salaryInfo.hasSalary ? salaryInfo.formatted : t('vacancyModal.salary_not_specified')}
      matchScore={matchScore}
      onRefresh={handleReparse}
      refreshing={reparsing}
      refreshLabel={t('vacancyModal.reparse_btn')}
      externalLinkLabel="LINKEDIN"
      onDelete={onDelete ? () => onDelete(vacancy.id) : undefined}
      deleteLabel={t('vacancyModal.delete_btn')}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      detailsTabLabel={t('vacancyModal.tab_details')}
      compatibilityTabLabel={t('vacancyModal.tab_cv_compatibility')}
      status={status}
      stageOptions={stageOptions}
      onStatusChange={handleStatusChange}
      statusLabel={t('vacancyModal.status_label')}
      formatLabel={t('vacancyModal.workplace_label')}
      salaryTitle={t('vacancyModal.salary_title')}
      salaryMin={salaryMin}
      salaryMax={salaryMax}
      salaryCurrency={salaryCurrency}
      salaryPeriod={salaryPeriod}
      onSaveSalary={handleSaveSalary}
      savingSalary={savingSalary}
      savedSalarySuccess={savedSalarySuccess}
      editSalaryLabel={t('common.edit')}
      saveSalaryLabel={t('common.save')}
      cancelSalaryLabel={t('common.cancel')}
      salaryMinLabel={t('vacancyModal.min')}
      salaryMaxLabel={t('vacancyModal.max')}
      salaryCurrencyLabel={t('vacancyModal.currency')}
      salaryPeriodLabel={t('vacancyModal.period')}
      aiSummaryTitle={t('vacancyModal.ai_summary_title')}
      aiSummary={vacancy.ai_summary}
      companyDescription={vacancy.company_description}
      companyInfoLabel={t('vacancyModal.about_company') + ' '}
      onResummarize={handleResummarize}
      resummarizing={resummarizing}
      updateAiLabel={t('vacancyModal.resummarize_btn')}
      noAiSummaryText={t('vacancyModal.no_summary')}
      techStackTitle={t('vacancyModal.tech_stack_title')}
      techStack={techStack}
      onTechStackChange={handleTechStackChange}
      addTechPlaceholder={t('vacancyModal.add_token_placeholder')}
      tagsTitle={t('vacancyModal.tags_title')}
      tags={tags}
      onTagsChange={handleTagsChange}
      addTagPlaceholder={t('vacancyModal.add_tag_placeholder')}
      historyTitle={t('vacancyModal.history_timeline_title')}
      historyStagesCountLabel={`{count} ${t('vacancyModal.history_timeline_title').toLowerCase()}`}
      historyItems={historyItems}
      onSaveComment={handleSaveHistoryComment}
      onDeleteComment={handleDeleteHistoryComment}
      addCommentLabel={t('vacancyModal.history_add_comment') || 'Добавить комментарий к этапу'}
      commentPlaceholder={t('vacancyModal.history_comment_placeholder')}
      saveCommentLabel={t('vacancyModal.history_save_comment')}
      cancelCommentLabel={t('vacancyModal.history_cancel')}
      noHistoryTitle={t('vacancyModal.no_history')}
      notesTitle={t('vacancyModal.notes_title')}
      notes={notes}
      onNotesChange={setNotes}
      onSaveNotes={handleSaveNotes}
      savingNotes={savingNotes}
      notesSaved={savedNotesSuccess}
      saveNotesLabel={t('common.save')}
      savedNotesLabel={t('common.saved')}
      notesPlaceholder={t('vacancyModal.notes_placeholder')}
      originalDescriptionTitle={t('vacancyModal.description_title')}
      description={description}
      onDescriptionChange={setDescription}
      onSaveDescription={handleSaveDescription}
      savingDescription={savingDesc}
      descriptionSaved={savedDescSuccess}
      saveDescriptionLabel={t('common.save')}
      copyDescriptionLabel={t('vacancyModal.desc_copy')}
      copiedDescriptionLabel={t('vacancyModal.desc_copied')}
      isCvOutdated={Boolean(compatibility?.is_outdated)}
      cvOutdatedMessage={t('vacancyModal.compat_outdated', { revision: compatibility?.cv_revision || '' })}
      cvAssessment={compatibility?.summary}
      cvLevelStatus={seniorityStatusLabel}
      cvLevelTone={seniorityStatusTone}
      cvLevelComment={compatibility?.seniority_assessment?.comment}
      cvLevelStatusLabel={t('vacancyModal.compat_seniority')}
      compatibilitySections={compatibilitySections}
      compatibilityScore={displayScore}
      compatibilityScoreTone={scoreTone}
      onRunCompatibility={handleRunCompatibility}
      analyzingCompatibility={analyzingCompatibility}
      loadingCompatibility={loadingCompatibility}
      compatibilityError={compatError}
      recheckCompatibilityLabel={t('vacancyModal.compat_reanalyze')}
      compareCompatibilityLabel={t('vacancyModal.compat_compare')}
      recommendationsTitle={t('vacancyModal.compat_recommendations')}
      recommendations={recommendationsList}
      emptyCompatibilityTitle={t('vacancyModal.compat_title')}
      emptyCompatibilityDescription={vacancy.description ? "Нажмите для запуска сопоставления резюме с требованиями вакансии." : t('vacancyModal.compat_no_description')}
      onReject={() => handleStatusChange(rejectedStatusId)}
      rejectLabel={t('vacancyModal.reject_btn') || 'В НЕ ПОДОШЛО'}
      closeLabel={t('batchModal.done_btn') || 'ЗАКРЫТЬ'}
    />
  );
}
