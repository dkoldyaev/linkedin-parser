import React, { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, MapPin, Building2, Sparkles, 
  Trash2, RefreshCw, Check, FileText, StickyNote, Banknote,
  Ban, Shield, Award, AlertCircle, Copy, AlignLeft
} from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalHeaderMeta,
  ModalBody,
  ModalFooter,
  Button,
  Icon,
  Tabs,
  Badge,
  Text,
  Paragraph,
  Select,
  Textarea,
  Input,
  AlertBanner,
  CollapsibleSection,
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

import VacancySalarySection from './vacancy/VacancySalarySection';
import VacancyAISummarySection from './vacancy/VacancyAISummarySection';
import VacancyTokensSection from './vacancy/VacancyTokensSection';
import VacancyTimelineSection from './vacancy/VacancyTimelineSection';
import VacancyCompatibilitySection from './vacancy/VacancyCompatibilitySection';

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
    ? columns.map(c => typeof c === 'string' ? { id: c, color: '#2563eb' } : c)
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
  const [isClosed, setIsClosed] = useState(vacancy?.is_closed || false);

  const [savingSalary, setSavingSalary] = useState(false);
  const [savedSalarySuccess, setSavedSalarySuccess] = useState(false);
  const [resummarizing, setResummarizing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [reparseError, setReparseError] = useState(null);
  const [reparseSuccess, setReparseSuccess] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotesSuccess, setSavedNotesSuccess] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [savedTitleSuccess, setSavedTitleSuccess] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [savedDescSuccess, setSavedDescSuccess] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  // CV Compatibility Analysis state
  const [compatibility, setCompatibility] = useState(null);
  const [loadingCompatibility, setLoadingCompatibility] = useState(false);
  const [analyzingCompatibility, setAnalyzingCompatibility] = useState(false);
  const [compatError, setCompatError] = useState(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'compatibility'

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
    setSavingTitle(true);
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
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
    try {
      await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
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

  const handleSaveDescription = async () => {
    setSavingDesc(true);
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
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

  const handleCopyDescription = (e) => {
    e.stopPropagation();
    if (description) {
      navigator.clipboard.writeText(description);
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
  };

  const salaryInfo = getSalaryDisplay(vacancy, t, salaryDisplayFormat, salaryTargetCurrency, exchangeRates);
  const matchScore = vacancy.match_score != null ? Math.round(vacancy.match_score) : null;
  const matchTone = matchScore == null ? 'neutral' : matchScore >= 75 ? 'success' : matchScore >= 50 ? 'warning' : 'danger';

  const tabItems = [
    {
      value: 'details',
      label: t('vacancyModal.tab_details'),
      icon: <Icon icon={FileText} size="xs" />,
    },
    {
      value: 'compatibility',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{t('vacancyModal.tab_cv_compatibility')}</span>
          {compatibility && (
            <Badge
              variant="solid"
              size="xs"
              tone={
                (compatibility.calculated_score ?? compatibility.overall_score) >= 70
                  ? 'success'
                  : (compatibility.calculated_score ?? compatibility.overall_score) >= 45
                    ? 'warning'
                    : 'danger'
              }
            >
              {Math.round(compatibility.calculated_score ?? compatibility.overall_score)}%
            </Badge>
          )}
        </span>
      ),
      icon: <Icon icon={Shield} size="xs" tone={compatibility ? 'success' : 'neutral'} />,
    },
  ];

  const statusOptions = modalColumns.map((col) => ({
    value: col.id,
    label: t(`kanban.columns.${col.id}`) || col.id,
  }));

  const workplaceOptions = [
    { value: '', label: t('vacancyModal.not_specified') },
    { value: 'remote', label: t('workplace.full_remote') },
    { value: 'hybrid', label: t('workplace.full_hybrid') },
    { value: 'on-site', label: t('workplace.full_onsite') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalHeader
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)', flex: 1 }}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              style={{ fontWeight: 600, fontSize: 'var(--ui-font-size-base)' }}
            />
            {savedTitleSuccess && (
              <Badge variant="solid" size="xs" tone="success">
                {t('common.saved') || 'Saved'}
              </Badge>
            )}
          </div>
        }
        meta={
          <ModalHeaderMeta>
            {vacancy.company && (
              <Text variant="mono" tone="secondary">
                {vacancy.company}
              </Text>
            )}
            {vacancy.url && (
              <Button
                as="a"
                href={vacancy.url}
                target="_blank"
                rel="noreferrer"
                variant="ghost"
                size="icon-xs"
                title={vacancy.url}
              >
                <Icon icon={ExternalLink} size="xs" />
              </Button>
            )}
            {vacancy.location && (
              <Text variant="caption" tone="secondary" startIcon={<Icon icon={MapPin} size="xs" />}>
                {vacancy.location}
              </Text>
            )}
            {matchScore !== null && (
              <Badge variant="solid" size="xs" tone={matchTone} icon={<Icon icon={Award} size="2xs" />}>
                {matchScore}%
              </Badge>
            )}
            {isClosed && (
              <Badge variant="solid" size="xs" tone="danger" icon={<Icon icon={Ban} size="2xs" />}>
                {t('kanban.closed')}
              </Badge>
            )}
          </ModalHeaderMeta>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-1-5)' }}>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleReparse}
              disabled={reparsing}
              loading={reparsing}
              title={t('vacancyModal.reparse_btn')}
              startIcon={<Icon icon={RefreshCw} size="xs" />}
            >
              {t('vacancyModal.reparse_btn')}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopyDescription}
              title={copiedDesc ? t('vacancyModal.desc_copied') : t('vacancyModal.desc_copy')}
            >
              <Icon icon={copiedDesc ? Check : Copy} size="xs" tone={copiedDesc ? 'success' : 'neutral'} />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              tone="danger"
              onClick={() => onDelete && onDelete(vacancy.id)}
              title={t('vacancyModal.delete_btn')}
            >
              <Icon icon={Trash2} size="xs" />
            </Button>
          </div>
        }
        tabs={
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            items={tabItems}
          />
        }
        onClose={onClose}
      />

      <ModalBody padding="none" gap="none">
        {reparseError && (
          <AlertBanner
            tone="danger"
            title={reparseError}
            style={{ marginBottom: 'var(--ui-space-4)' }}
          />
        )}
        {reparseSuccess && (
          <AlertBanner
            tone="success"
            title={t('vacancyModal.reparse_success')}
            style={{ marginBottom: 'var(--ui-space-4)' }}
          />
        )}

        {activeTab === 'details' && (
          <>
            {/* Status & Workplace Controls Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--ui-space-3)',
              padding: 'var(--ui-space-2) var(--ui-space-6)',
              backgroundColor: 'var(--ui-bg-surface)',
              boxShadow: 'inset 0 -1px 0 0 var(--ui-border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)', flexWrap: 'wrap' }}>
                <Text variant="mono-label" tone="muted">
                  {t('vacancyModal.status_label')}:
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-1)', flexWrap: 'wrap' }}>
                  {modalColumns.map((col) => (
                    <Button
                      key={col.id}
                      variant={status === col.id ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handleStatusChange(col.id)}
                    >
                      {t(`kanban.columns.${col.id}`) || col.name || col.id}
                    </Button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-3)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
                  <Text variant="mono-label" tone="muted">
                    {t('vacancyModal.workplace_label')}:
                  </Text>
                  <Select
                    value={workplaceType}
                    onValueChange={handleWorkplaceTypeChange}
                    options={workplaceOptions}
                  />
                </div>

                <Button
                  variant={isClosed ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={handleToggleClosed}
                  startIcon={<Icon icon={isClosed ? Ban : Check} size="xs" />}
                >
                  {isClosed ? t('kanban.closed') : t('vacancyModal.open_badge')}
                </Button>
              </div>
            </div>

            <div style={{ padding: 'var(--ui-space-4) var(--ui-space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
              {/* Salary Section */}
            <VacancySalarySection
              salaryInfo={salaryInfo}
              salaryMin={salaryMin}
              setSalaryMin={setSalaryMin}
              salaryMax={salaryMax}
              setSalaryMax={setSalaryMax}
              salaryCurrency={salaryCurrency}
              setSalaryCurrency={setSalaryCurrency}
              salaryPeriod={salaryPeriod}
              setSalaryPeriod={setSalaryPeriod}
              onSaveSalary={handleSaveSalary}
              savingSalary={savingSalary}
              savedSalarySuccess={savedSalarySuccess}
            />

            {/* AI Summary */}
            <VacancyAISummarySection
              aiSummary={vacancy.ai_summary}
              companyDescription={vacancy.company_description}
              onResummarize={handleResummarize}
              resummarizing={resummarizing}
            />

            {/* Tech Stack & Tags */}
            <VacancyTokensSection
              techStack={techStack}
              onTechStackChange={handleTechStackChange}
              tags={tags}
              onTagsChange={handleTagsChange}
            />

            {/* User Notes */}
            <CollapsibleSection
              title={t('vacancyModal.notes_title')}
              icon={<Icon icon={StickyNote} size="sm" tone="accent" />}
              accessoryAction={
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleSaveNotes}
                  loading={savingNotes}
                  startIcon={<Icon icon={Check} size="xs" />}
                >
                  {savedNotesSuccess ? t('common.saved') : t('common.save')}
                </Button>
              }
            >
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('vacancyModal.notes_placeholder')}
                rows={3}
              />
            </CollapsibleSection>

            {/* Full Vacancy Description */}
            <CollapsibleSection
              title={t('vacancyModal.description_title')}
              icon={<Icon icon={AlignLeft} size="sm" tone="neutral" />}
              accessoryAction={
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleSaveDescription}
                  loading={savingDesc}
                  startIcon={<Icon icon={Check} size="xs" />}
                >
                  {savedDescSuccess ? t('common.saved') : t('common.save')}
                </Button>
              }
            >
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('vacancyModal.description_placeholder')}
                rows={8}
              />
            </CollapsibleSection>

            {/* Stage History Timeline */}
            <VacancyTimelineSection
              history={vacancy.history || []}
              onSaveComment={handleSaveHistoryComment}
              onDeleteComment={handleDeleteHistoryComment}
              getStageLabel={getStageLabel}
            />
          </div>
        </>
      )}

      {activeTab === 'compatibility' && (
        <div style={{ padding: 'var(--ui-space-4) var(--ui-space-6)' }}>
          <VacancyCompatibilitySection
            compatibility={compatibility}
            onRunAnalysis={handleRunCompatibility}
            analyzing={analyzingCompatibility}
            loading={loadingCompatibility}
            hasDescription={Boolean(description?.trim())}
            error={compatError}
          />
        </div>
      )}
    </ModalBody>

      <ModalFooter justify="end">
        <Button variant="secondary" onClick={onClose}>
          {t('batchModal.done_btn')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
