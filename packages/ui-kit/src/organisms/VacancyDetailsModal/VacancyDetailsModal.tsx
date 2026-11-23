import React, { useEffect, useState } from 'react';
import {
  Ban,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  History,
  Layers,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  StickyNote,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  Badge,
  Button,
  Icon,
  Input,
  Label,
  Paragraph,
  Text,
  Textarea,
  type BadgeTone,
  type TextTone,
} from '../../atoms';
import {
  AlertBanner,
  CollapsibleSection,
  EmptyState,
  Section,
  SectionHeader,
  Select,
  Stepper,
  Tabs,
  type SelectOption,
} from '../../molecules';
import {
  Modal,
  type ModalSize,
} from '../Modal';
import { ReportAccordion, type ReportSectionGroup } from '../ReportAccordion';
import { TagsList } from '../TagsList';
import styles from './VacancyDetailsModal.module.css';

export interface VacancyStageOption {
  readonly value: string;
  readonly label: string;
}

export interface VacancyHistoryItem {
  readonly id: string;
  readonly label: React.ReactNode;
  readonly fromLabel?: React.ReactNode;
  readonly timestamp?: React.ReactNode;
  readonly tone?: BadgeTone;
  readonly comment?: string;
}

export interface VacancySalaryData {
  readonly min: string;
  readonly max: string;
  readonly currency: string;
  readonly period: string;
}

export interface VacancyDetailsModalProps {
  // Dialog state
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly size?: ModalSize;
  readonly banner?: React.ReactNode;

  // Header & Meta
  readonly title: string;
  readonly onTitleChange?: (nextTitle: string) => void;
  readonly onSaveTitle?: () => void;
  readonly company?: string;
  readonly sourceUrl?: string;
  readonly location?: string;
  readonly workplace?: string;
  readonly workplaceLabel?: string;
  readonly formattedSalary?: string;
  readonly isClosed?: boolean;
  readonly closedBadgeLabel?: string;
  readonly matchScore?: number;

  // Actions
  readonly onRefresh?: () => void;
  readonly refreshing?: boolean;
  readonly refreshLabel?: string;
  readonly externalLinkLabel?: string;
  readonly onDelete?: () => void;
  readonly deleteLabel?: string;

  // Tabs
  readonly activeTab?: string;
  readonly onTabChange?: (tab: string) => void;
  readonly detailsTabLabel?: string;
  readonly compatibilityTabLabel?: string;

  // Status & Workplace bar
  readonly status?: string;
  readonly stageOptions?: readonly VacancyStageOption[];
  readonly onStatusChange?: (status: string) => void;
  readonly statusLabel?: string;
  readonly workplaceOptions?: readonly SelectOption[];
  readonly onWorkplaceChange?: (val: string) => void;
  readonly formatLabel?: string;
  readonly onToggleClosed?: () => void;
  readonly closedButtonLabel?: string;
  readonly openButtonLabel?: string;

  // Salary Section
  readonly salaryTitle?: string;
  readonly salaryMin?: string | number;
  readonly salaryMax?: string | number;
  readonly salaryCurrency?: string;
  readonly salaryPeriod?: string;
  readonly currencyOptions?: readonly SelectOption[];
  readonly periodOptions?: readonly SelectOption[];
  readonly onSaveSalary?: (salary: VacancySalaryData) => void | Promise<void>;
  readonly savingSalary?: boolean;
  readonly savedSalarySuccess?: boolean;
  readonly editSalaryLabel?: string;
  readonly saveSalaryLabel?: string;
  readonly cancelSalaryLabel?: string;
  readonly salaryMinLabel?: string;
  readonly salaryMaxLabel?: string;
  readonly salaryCurrencyLabel?: string;
  readonly salaryPeriodLabel?: string;
  readonly salarySavedLabel?: string;

  // AI Summary Section
  readonly aiSummaryTitle?: string;
  readonly aiSummary?: string;
  readonly companyDescription?: string;
  readonly companyInfoLabel?: string;
  readonly onResummarize?: () => void;
  readonly resummarizing?: boolean;
  readonly updateAiLabel?: string;
  readonly noAiSummaryText?: string;

  // Tech Stack & Tags Sections
  readonly techStackTitle?: string;
  readonly techStack?: readonly string[];
  readonly onTechStackChange?: (next: string[]) => void;
  readonly addTechPlaceholder?: string;
  readonly tagsTitle?: string;
  readonly tags?: readonly string[];
  readonly onTagsChange?: (next: string[]) => void;
  readonly addTagPlaceholder?: string;

  // History timeline & comments
  readonly historyTitle?: string;
  readonly historyStagesCountLabel?: string;
  readonly historyItems?: readonly VacancyHistoryItem[];
  readonly onSaveComment?: (id: string, comment: string) => void | Promise<void>;
  readonly onDeleteComment?: (id: string) => void | Promise<void>;
  readonly addCommentLabel?: string;
  readonly commentPlaceholder?: string;
  readonly saveCommentLabel?: string;
  readonly cancelCommentLabel?: string;
  readonly noHistoryTitle?: string;
  readonly noHistoryDescription?: string;

  // Personal Notes Section
  readonly notesTitle?: string;
  readonly notes?: string;
  readonly onNotesChange?: (notes: string) => void;
  readonly onSaveNotes?: (notes: string) => void | Promise<void>;
  readonly savingNotes?: boolean;
  readonly notesSaved?: boolean;
  readonly saveNotesLabel?: string;
  readonly savedNotesLabel?: string;
  readonly notesPlaceholder?: string;

  // Original Description Section
  readonly originalDescriptionTitle?: string;
  readonly description?: string;
  readonly onDescriptionChange?: (desc: string) => void;
  readonly onSaveDescription?: (desc: string) => void | Promise<void>;
  readonly savingDescription?: boolean;
  readonly descriptionSaved?: boolean;
  readonly saveDescriptionLabel?: string;
  readonly copyDescriptionLabel?: string;
  readonly copiedDescriptionLabel?: string;
  readonly showFullDescriptionLabel?: string;
  readonly collapseDescriptionLabel?: string;

  // Compatibility Tab
  readonly isCvOutdated?: boolean;
  readonly cvOutdatedMessage?: string;
  readonly cvAssessment?: string;
  readonly cvLevelStatus?: string;
  readonly cvLevelTone?: TextTone;
  readonly cvLevelComment?: string;
  readonly cvLevelStatusLabel?: string;
  readonly compatibilitySections?: readonly ReportSectionGroup[];
  readonly compatibilityScore?: number | null;
  readonly compatibilityScoreTone?: BadgeTone;
  readonly onRunCompatibility?: (force?: boolean) => void;
  readonly analyzingCompatibility?: boolean;
  readonly loadingCompatibility?: boolean;
  readonly compatibilityError?: string | null;
  readonly recheckCompatibilityLabel?: string;
  readonly compareCompatibilityLabel?: string;
  readonly recommendationsTitle?: string;
  readonly recommendations?: readonly string[];
  readonly emptyCompatibilityTitle?: string;
  readonly emptyCompatibilityDescription?: string;

  // Footer
  readonly onReject?: () => void;
  readonly rejectLabel?: string;
  readonly closeLabel?: string;
  readonly className?: string;
}

const DEFAULT_CURRENCY_OPTIONS: readonly SelectOption[] = [
  { value: '$', label: '$ (USD)' },
  { value: '€', label: '€ (EUR)' },
  { value: '₽', label: '₽ (RUB)' },
  { value: '£', label: '£ (GBP)' },
];

const DEFAULT_PERIOD_OPTIONS: readonly SelectOption[] = [
  { value: 'month', label: 'в месяц' },
  { value: 'year', label: 'в год' },
  { value: 'day', label: 'в день' },
  { value: 'hour', label: 'в час' },
];

/**
 * 
 * @deprecated Should be deleted. Do not use it!!
 * @param param0
 * @returns 
 */
export function VacancyDetailsModal({
  isOpen,
  onClose,
  size = 'xl',
  banner,
  title,
  onTitleChange,
  onSaveTitle,
  company,
  sourceUrl,
  location,
  workplace,
  workplaceLabel,
  formattedSalary,
  isClosed = false,
  closedBadgeLabel = 'Вакансия закрыта',
  matchScore,
  onRefresh,
  refreshing = false,
  refreshLabel = 'ОБНОВИТЬ',
  externalLinkLabel = 'LINKEDIN',
  onDelete,
  deleteLabel = 'Удалить вакансию',
  activeTab: controlledTab,
  onTabChange,
  detailsTabLabel = 'Описание и детали',
  compatibilityTabLabel = 'Совместимость с CV',
  status,
  stageOptions = [],
  onStatusChange,
  statusLabel = 'Статус:',
  workplaceOptions = [],
  onWorkplaceChange,
  formatLabel = 'Формат:',
  onToggleClosed,
  closedButtonLabel = 'Вакансия закрыта',
  openButtonLabel = 'Вакансия открыта',
  salaryTitle = 'ЗАРПЛАТА:',
  salaryMin = '',
  salaryMax = '',
  salaryCurrency = '$',
  salaryPeriod = 'month',
  currencyOptions = DEFAULT_CURRENCY_OPTIONS,
  periodOptions = DEFAULT_PERIOD_OPTIONS,
  onSaveSalary,
  savingSalary = false,
  savedSalarySuccess = false,
  editSalaryLabel = 'РЕДАКТИРОВАТЬ',
  saveSalaryLabel = 'Сохранить',
  cancelSalaryLabel = 'Отмена',
  salaryMinLabel = 'Минимум',
  salaryMaxLabel = 'Максимум',
  salaryCurrencyLabel = 'Валюта',
  salaryPeriodLabel = 'Период',
  salarySavedLabel = 'СОХРАНЕНО',
  aiSummaryTitle = 'AI-САММАРИ ВАКАНСИИ',
  aiSummary,
  companyDescription,
  companyInfoLabel = 'О компании: ',
  onResummarize,
  resummarizing = false,
  updateAiLabel = 'ОБНОВИТЬ AI',
  noAiSummaryText = 'AI-саммари пока отсутствует.',
  techStackTitle = 'СТЕК ТЕХНОЛОГИЙ',
  techStack = [],
  onTechStackChange,
  addTechPlaceholder = 'Добавить технологию...',
  tagsTitle = 'ТЕГИ',
  tags = [],
  onTagsChange,
  addTagPlaceholder = 'Добавить тег...',
  historyTitle = 'ИСТОРИЯ ЭТАПОВ И ПЕРЕМЕЩЕНИЙ',
  historyStagesCountLabel = '{count} этапов',
  historyItems = [],
  onSaveComment,
  onDeleteComment,
  addCommentLabel = 'Добавить комментарий к этапу',
  commentPlaceholder = 'Комментарий к этапу...',
  saveCommentLabel = 'Сохранить',
  cancelCommentLabel = 'Отмена',
  noHistoryTitle = 'Нет истории этапов',
  noHistoryDescription = 'Перемещайте карточку по этапам для записи истории.',
  notesTitle = 'ЗАМЕТКИ',
  notes = '',
  onNotesChange,
  onSaveNotes,
  savingNotes = false,
  notesSaved = false,
  saveNotesLabel = 'СОХРАНИТЬ ЗАМЕТКИ',
  savedNotesLabel = 'СОХРАНЕНО',
  notesPlaceholder = 'Ваши комментарии, контакты рекрутера, этапы, вопросы к интервью...',
  originalDescriptionTitle = 'ОРИГИНАЛЬНОЕ ОПИСАНИЕ ВАКАНСИИ',
  description = '',
  onDescriptionChange,
  onSaveDescription,
  savingDescription = false,
  descriptionSaved = false,
  saveDescriptionLabel = 'СОХРАНИТЬ ТЕКСТ',
  copyDescriptionLabel = 'КОПИРОВАТЬ ОПИСАНИЕ',
  copiedDescriptionLabel = 'СКОПИРОВАНО',
  showFullDescriptionLabel = 'ПОКАЗАТЬ ПОЛНОСТЬЮ',
  collapseDescriptionLabel = 'СВЕРНУТЬ',
  isCvOutdated = false,
  cvOutdatedMessage = 'CV изменилось после проверки. Запустите проверку повторно.',
  cvAssessment,
  cvLevelStatus,
  cvLevelTone = 'warning',
  cvLevelComment,
  cvLevelStatusLabel = 'Соответствие уровня:',
  compatibilitySections = [],
  compatibilityScore,
  compatibilityScoreTone = 'warning',
  onRunCompatibility,
  analyzingCompatibility = false,
  loadingCompatibility = false,
  compatibilityError,
  recheckCompatibilityLabel = 'ПРОВЕРИТЬ ПОВТОРНО',
  compareCompatibilityLabel = 'Сравнить с CV',
  recommendationsTitle = 'РЕКОМЕНДАЦИИ ДЛЯ CV:',
  recommendations = [],
  emptyCompatibilityTitle = 'Совместимость с CV',
  emptyCompatibilityDescription = 'Нажмите кнопку ниже для запуска проверки совместимости вашего CV с требованиями вакансии.',
  onReject,
  rejectLabel = 'В НЕ ПОДОШЛО',
  closeLabel = 'ЗАКРЫТЬ',
  className,
  ...rest
}: VacancyDetailsModalProps & React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  // Navigation tabs
  const [internalTab, setInternalTab] = useState('details');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const handleTabChange = (val: string) => {
    setInternalTab(val);
    onTabChange?.(val);
  };

  // Salary editing state
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryMinDraft, setSalaryMinDraft] = useState(String(salaryMin));
  const [salaryMaxDraft, setSalaryMaxDraft] = useState(String(salaryMax));
  const [salaryCurrencyDraft, setSalaryCurrencyDraft] = useState(salaryCurrency);
  const [salaryPeriodDraft, setSalaryPeriodDraft] = useState(salaryPeriod);

  useEffect(() => {
    setSalaryMinDraft(String(salaryMin));
    setSalaryMaxDraft(String(salaryMax));
    setSalaryCurrencyDraft(salaryCurrency);
    setSalaryPeriodDraft(salaryPeriod);
  }, [salaryMin, salaryMax, salaryCurrency, salaryPeriod]);

  // Tags & Tech stack adding state
  const [isAddingTech, setIsAddingTech] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);

  // History comment editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  // Personal notes draft
  const [notesDraft, setNotesDraft] = useState(notes);
  useEffect(() => {
    setNotesDraft(notes);
  }, [notes]);

  // Original description draft & copy feedback
  const [descriptionDraft, setDescriptionDraft] = useState(description);
  useEffect(() => {
    setDescriptionDraft(description);
  }, [description]);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const handleCopyDescription = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(descriptionDraft);
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
  };

  const handleCommitSalary = async () => {
    if (onSaveSalary) {
      await onSaveSalary({
        min: salaryMinDraft,
        max: salaryMaxDraft,
        currency: salaryCurrencyDraft,
        period: salaryPeriodDraft,
      });
    }
    setIsEditingSalary(false);
  };

  const handleSaveComment = async (id: string) => {
    if (onSaveComment) {
      await onSaveComment(id, commentDraft);
    }
    setEditingCommentId(null);
    setCommentDraft('');
  };

  const formattedCountStages = historyStagesCountLabel.replace(
    '{count}',
    String(historyItems.length)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} className={className} {...rest}>
      <Modal.Header
        title={
          onTitleChange ? (
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onSaveTitle}
            />
          ) : (
            title
          )
        }
        icon={<Icon icon={Building2} size="sm" tone="secondary" />}
        description={
          company ? (
            <span className={styles.companyLinkWrapper}>
              <strong>{company}</strong>
              {sourceUrl && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => window.open(sourceUrl, '_blank')}
                  aria-label="External link"
                >
                  <Icon icon={ExternalLink} size="xs" />
                </Button>
              )}
            </span>
          ) : undefined
        }
        actions={
          <>
            {onRefresh && (
              <Button
                variant="secondary"
                size="sm"
                loading={refreshing}
                startIcon={<Icon icon={RefreshCw} size="xs" />}
                onClick={onRefresh}
              >
                {refreshLabel}
              </Button>
            )}
            {sourceUrl && (
              <Button
                variant="secondary"
                size="sm"
                startIcon={<Icon icon={ExternalLink} size="xs" />}
                onClick={() => window.open(sourceUrl, '_blank')}
              >
                {externalLinkLabel}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                tone="danger"
                onClick={onDelete}
                aria-label={deleteLabel}
              >
                <Icon icon={Trash2} size="xs" />
              </Button>
            )}
          </>
        }
        meta={
          <Modal.Header.Meta>
            {location && (
              <Text
                variant="caption"
                tone="secondary"
                startIcon={<Icon icon={MapPin} size="xs" />}
              >
                {location}
              </Text>
            )}
            {workplaceLabel && (
              <Badge
                variant="outline"
                size="xs"
                tone="accent"
                icon={<Icon icon={Layers} size="xs" />}
              >
                {workplaceLabel}
              </Badge>
            )}
            {formattedSalary && (
              <Text
                variant="mono"
                tone="success"
                weight="semibold"
                startIcon={<Icon icon={Banknote} size="xs" />}
              >
                {formattedSalary}
              </Text>
            )}
            {isClosed && (
              <Badge
                variant="outline"
                size="xs"
                tone="danger"
                icon={<Icon icon={Ban} size="xs" />}
              >
                {closedBadgeLabel}
              </Badge>
            )}
          </Modal.Header.Meta>
        }
        tabs={
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            items={[
              {
                value: 'details',
                label: detailsTabLabel,
                icon: <Icon icon={FileText} size="xs" />,
              },
              {
                value: 'compatibility',
                label: compatibilityTabLabel,
                icon: <Icon icon={Shield} size="xs" />,
                accessory:
                  matchScore !== undefined && matchScore !== null ? (
                    <Badge variant="counter" size="xs" tone={compatibilityScoreTone}>
                      {matchScore}%
                    </Badge>
                  ) : undefined,
              },
            ]}
          />
        }
      />

      <Modal.Body padding="none" gap="none">
        {banner}
        {activeTab === 'details' ? (
          <>
            {/* Status and Workplace Bar */}
            <div className={styles.metaBar}>
              <div className={styles.statusButtonGroup}>
                <Text variant="mono-label" tone="muted">
                  {statusLabel}
                </Text>
                <div className={styles.statusButtonsList}>
                  {stageOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={status === opt.value ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => onStatusChange?.(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className={styles.metaControlsGroup}>
                {workplaceOptions.length > 0 && (
                  <div className={styles.workplaceControl}>
                    <Text variant="mono-label" tone="muted">
                      {formatLabel}
                    </Text>
                    <Select
                      value={workplace ?? ''}
                      onValueChange={onWorkplaceChange}
                      options={workplaceOptions}
                      ariaLabel={formatLabel}
                      variant="filter"
                    />
                  </div>
                )}

                {onToggleClosed && (
                  <Button
                    variant={isClosed ? 'danger' : 'secondary'}
                    size="m"
                    startIcon={<Icon icon={isClosed ? Ban : Check} size="xs" />}
                    onClick={onToggleClosed}
                  >
                    {isClosed ? closedButtonLabel : openButtonLabel}
                  </Button>
                )}
              </div>
            </div>

            {/* Salary Section */}
            <Section padding="lg">
              <Section.Header
                icon={<Icon icon={Banknote} size="sm" />}
                title={
                  <>
                    <Text variant="mono-label" tone="secondary">
                      {salaryTitle}
                    </Text>
                    <Text variant="mono" tone="success" weight="bold">
                      {formattedSalary}
                    </Text>
                  </>
                }
                accessory={
                  !isEditingSalary ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      startIcon={<Icon icon={savedSalarySuccess ? Check : Edit3} size="xs" tone={savedSalarySuccess ? 'success' : undefined} />}
                      onClick={() => setIsEditingSalary(true)}
                    >
                      {savedSalarySuccess ? salarySavedLabel : editSalaryLabel}
                    </Button>
                  ) : (
                    <div className={styles.salaryActions}>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={savingSalary}
                        startIcon={<Icon icon={Check} size="xs" />}
                        onClick={handleCommitSalary}
                      >
                        {saveSalaryLabel}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        startIcon={<Icon icon={X} size="xs" />}
                        onClick={() => setIsEditingSalary(false)}
                      >
                        {cancelSalaryLabel}
                      </Button>
                    </div>
                  )
                }
              />
              {isEditingSalary && (
                <Section.Body padding="sm">
                  <div className={styles.salaryFormGrid}>
                    <div className={styles.salaryFieldItem}>
                      <Label>{salaryMinLabel}</Label>
                      <Input
                        type="number"
                        value={salaryMinDraft}
                        onChange={(e) => setSalaryMinDraft(e.target.value)}
                      />
                    </div>
                    <div className={styles.salaryFieldItem}>
                      <Label>{salaryMaxLabel}</Label>
                      <Input
                        type="number"
                        value={salaryMaxDraft}
                        onChange={(e) => setSalaryMaxDraft(e.target.value)}
                      />
                    </div>
                    <div className={styles.salaryFieldItem}>
                      <Label>{salaryCurrencyLabel}</Label>
                      <Select
                        value={salaryCurrencyDraft}
                        onValueChange={setSalaryCurrencyDraft}
                        options={currencyOptions}
                      />
                    </div>
                    <div className={styles.salaryFieldItem}>
                      <Label>{salaryPeriodLabel}</Label>
                      <Select
                        value={salaryPeriodDraft}
                        onValueChange={setSalaryPeriodDraft}
                        options={periodOptions}
                      />
                    </div>
                  </div>
                </Section.Body>
              )}
            </Section>

            {/* AI Summary Section */}
            <Section padding="lg">
              <Section.Header
                title={aiSummaryTitle}
                icon={<Icon icon={Sparkles} size="sm" />}
                accessory={
                  onResummarize ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={resummarizing}
                      startIcon={<Icon icon={RefreshCw} size="xs" />}
                      onClick={onResummarize}
                    >
                      {updateAiLabel}
                    </Button>
                  ) : undefined
                }
              />
              <Section.Body padding="none" gap="sm">
                {aiSummary ? (
                  <Paragraph size="sm">{aiSummary}</Paragraph>
                ) : (
                  <Paragraph size="sm" tone="secondary">
                    {noAiSummaryText}
                  </Paragraph>
                )}
                {companyDescription && (
                  <div className={styles.companyInfoBox}>
                    <Paragraph size="sm" tone="secondary">
                      <strong>{companyInfoLabel}</strong>
                      {companyDescription}
                    </Paragraph>
                  </div>
                )}
              </Section.Body>
            </Section>

            {/* Tech Stack Section */}
            <Section padding="lg">
              <Section.Header
                title={techStackTitle}
                accessory={
                  onTechStackChange ? (
                    <Button
                      aria-label={addTechPlaceholder}
                      size="icon-sm"
                      variant="secondary"
                      onClick={() => setIsAddingTech((prev) => !prev)}
                    >
                      <Icon icon={Plus} size="sm" />
                    </Button>
                  ) : undefined
                }
              />
              <Section.Body padding="none">
                <TagsList
                  value={techStack}
                  onChange={onTechStackChange}
                  deletable={Boolean(onTechStackChange)}
                  addable={isAddingTech}
                  onFinishAdd={() => setIsAddingTech(false)}
                  placeholder={addTechPlaceholder}
                />
              </Section.Body>
            </Section>

            {/* Tags Section */}
            <Section padding="lg">
              <Section.Header
                title={tagsTitle}
                accessory={
                  onTagsChange ? (
                    <Button
                      aria-label={addTagPlaceholder}
                      size="icon-sm"
                      variant="secondary"
                      onClick={() => setIsAddingTag((prev) => !prev)}
                    >
                      <Icon icon={Plus} size="sm" />
                    </Button>
                  ) : undefined
                }
              />
              <Section.Body padding="none">
                <TagsList
                  value={tags}
                  onChange={onTagsChange}
                  variant="outline"
                  size="xs"
                  deletable={Boolean(onTagsChange)}
                  addable={isAddingTag}
                  onFinishAdd={() => setIsAddingTag(false)}
                  placeholder={addTagPlaceholder}
                />
              </Section.Body>
            </Section>

            {/* Stage History Timeline Section */}
            <Section>
              <Section.Header
                title={historyTitle}
                icon={<Icon icon={History} size="sm" tone="accent" />}
                accessory={
                  <Badge variant="counter" size="xs" tone="neutral">
                    {formattedCountStages}
                  </Badge>
                }
              />
              <Section.Body padding="sm">
                {historyItems.length === 0 ? (
                  <EmptyState
                    title={noHistoryTitle}
                    description={noHistoryDescription}
                  />
                ) : (
                  <ol className={styles.historyList}>
                    {historyItems.map((item, idx) => {
                      const isEditing = editingCommentId === item.id;
                      return (
                        <Stepper.Item
                          key={item.id}
                          id={item.id}
                          label={item.label}
                          fromLabel={item.fromLabel}
                          timestamp={item.timestamp}
                          tone={item.tone}
                          active={idx === 0}
                          isLast={idx === historyItems.length - 1}
                          description={
                            <div className={styles.historyItemWrapper}>
                              {isEditing ? (
                                <div className={styles.historyCommentForm}>
                                  <Textarea
                                    rows={2}
                                    placeholder={commentPlaceholder}
                                    value={commentDraft}
                                    onChange={(e) => setCommentDraft(e.target.value)}
                                    autoFocus
                                  />
                                  <div className={styles.historyCommentActions}>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      startIcon={<Icon icon={Check} size="xs" />}
                                      onClick={() => handleSaveComment(item.id)}
                                    >
                                      {saveCommentLabel}
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setCommentDraft('');
                                      }}
                                    >
                                      {cancelCommentLabel}
                                    </Button>
                                  </div>
                                </div>
                              ) : item.comment ? (
                                <div className={styles.historyCommentBubble}>
                                  <div className={styles.commentContent}>
                                    <Icon icon={MessageSquare} size="xs" tone="secondary" />
                                    <Text variant="caption" tone="primary">
                                      {item.comment}
                                    </Text>
                                  </div>
                                  <div className={styles.commentTools}>
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={() => {
                                        setEditingCommentId(item.id);
                                        setCommentDraft(item.comment || '');
                                      }}
                                    >
                                      <Icon icon={Edit3} size="xs" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      tone="danger"
                                      onClick={() => onDeleteComment?.(item.id)}
                                    >
                                      <Icon icon={Trash2} size="xs" />
                                    </Button>
                                  </div>
                                </div>
                              ) : onSaveComment ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  startIcon={<Icon icon={Plus} size="xs" />}
                                  onClick={() => {
                                    setEditingCommentId(item.id);
                                    setCommentDraft('');
                                  }}
                                >
                                  {addCommentLabel}
                                </Button>
                              ) : null}
                            </div>
                          }
                        />
                      );
                    })}
                  </ol>
                )}
              </Section.Body>
            </Section>

            {/* Personal Notes Section */}
            <Section>
              <Section.Header
                title={notesTitle}
                icon={<Icon icon={StickyNote} size="sm" />}
                accessory={
                  onSaveNotes ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={savingNotes}
                      startIcon={<Icon icon={notesSaved ? Check : CheckCircle2} size="xs" />}
                      onClick={() => onSaveNotes(notesDraft)}
                    >
                      {notesSaved ? savedNotesLabel : saveNotesLabel}
                    </Button>
                  ) : undefined
                }
              />
              <Section.Body padding="sm">
                <Textarea
                  rows={3}
                  placeholder={notesPlaceholder}
                  value={notesDraft}
                  onChange={(e) => {
                    setNotesDraft(e.target.value);
                    onNotesChange?.(e.target.value);
                  }}
                />
              </Section.Body>
            </Section>

            {/* Original Vacancy Description Section */}
            <Section divider={false}>
              <CollapsibleSection
                title={originalDescriptionTitle}
                icon={<Icon icon={FileText} size="sm" />}
                defaultOpen={false}
                expandLabel={showFullDescriptionLabel}
                collapseLabel={collapseDescriptionLabel}
                accessory={
                  <div className={styles.collapsibleActions}>
                    {onSaveDescription && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={savingDescription}
                        startIcon={<Icon icon={descriptionSaved ? Check : CheckCircle2} size="xs" />}
                        onClick={() => onSaveDescription(descriptionDraft)}
                      >
                        {descriptionSaved ? savedNotesLabel : saveDescriptionLabel}
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      startIcon={<Icon icon={copiedDesc ? Check : Copy} size="xs" />}
                      onClick={handleCopyDescription}
                    >
                      {copiedDesc ? copiedDescriptionLabel : copyDescriptionLabel}
                    </Button>
                  </div>
                }
              >
                <Textarea
                  rows={8}
                  value={descriptionDraft}
                  onChange={(e) => {
                    setDescriptionDraft(e.target.value);
                    onDescriptionChange?.(e.target.value);
                  }}
                />
              </CollapsibleSection>
            </Section>
          </>
        ) : (
          /* Compatibility with CV Tab */
          <div className={styles.compatibilityContainer}>
            {isCvOutdated && (
              <AlertBanner tone="warning">
                {cvOutdatedMessage}
              </AlertBanner>
            )}

            {compatibilityError && (
              <AlertBanner tone="danger">
                {compatibilityError}
              </AlertBanner>
            )}

            {cvAssessment && (
              <div className={styles.assessmentBox}>
                <Paragraph size="sm">{cvAssessment}</Paragraph>
                {cvLevelComment && (
                  <div className={styles.levelAssessment}>
                    <Paragraph size="sm">
                      {cvLevelStatusLabel}{' '}
                      <Text as="span" weight="bold" tone={cvLevelTone}>
                        {cvLevelStatus}
                      </Text>{' '}
                      — {cvLevelComment}
                    </Paragraph>
                  </div>
                )}
              </div>
            )}

            {compatibilitySections.length > 0 ? (
              <ReportAccordion
                title={compatibilityTabLabel}
                scoreLabel={compatibilityScore != null ? `${Math.round(compatibilityScore)}%` : undefined}
                scoreTone={compatibilityScoreTone}
                onAction={onRunCompatibility ? () => onRunCompatibility(Boolean(compatibilitySections.length)) : undefined}
                actionLabel={recheckCompatibilityLabel}
                actionLoading={analyzingCompatibility || loadingCompatibility}
                defaultActionLabel="Подтверждение"
                sections={compatibilitySections as any}
              />
            ) : (
              <EmptyState
                title={emptyCompatibilityTitle}
                description={emptyCompatibilityDescription}
                action={
                  onRunCompatibility ? (
                    <Button
                      variant="primary"
                      onClick={() => onRunCompatibility(false)}
                      loading={analyzingCompatibility || loadingCompatibility}
                      startIcon={<Icon icon={Shield} size="xs" />}
                    >
                      {compareCompatibilityLabel}
                    </Button>
                  ) : undefined
                }
              />
            )}

            {recommendations && recommendations.length > 0 && (
              <div className={styles.recommendationsBox}>
                <SectionHeader title={recommendationsTitle} tone="accent" />
                <div className={styles.ptSm}>
                  <ul className={styles.recommendationsList}>
                    {recommendations.map((rec, i) => (
                      <li key={i}>
                        <Text variant="body-sm" tone="secondary">
                          {rec}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer justify="between">
        {onReject ? (
          <Button
            variant="ghost"
            tone="danger"
            size="sm"
            startIcon={<Icon icon={XCircle} size="xs" />}
            onClick={onReject}
          >
            {rejectLabel}
          </Button>
        ) : (
          <span />
        )}
        <Modal.Footer.Actions>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {closeLabel}
          </Button>
        </Modal.Footer.Actions>
      </Modal.Footer>
    </Modal>
  );
}
