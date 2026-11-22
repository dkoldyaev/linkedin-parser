import React from 'react';
import {
  VacancyDetailsModal,
  type VacancyDetailsModalProps,
} from '@blueprint/ui-kit';
import { getSalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import { useTranslation, type FormatDateFn, type TranslateFn } from '../i18n/I18nContext';
import { DEFAULT_COLUMNS } from '../constants/columns';
import {
  buildCompatibilitySections,
  buildHistoryItems,
  buildRecommendationsList,
  buildStageOptions,
  buildWorkplaceOptions,
  computeVacancyMatchScore,
  normalizeModalColumns,
  resolveCompatibilityDisplayScore,
  resolveCompatScoreTone,
  resolveModalRejectedStatusId,
  resolveSeniorityInfo,
} from './vacancyModalHelpers';
import { useVacancyModalController } from './useVacancyModalController';
import type {
  BoardColumn,
  CompatibilityAnalysis,
  Vacancy,
  VacancyHistoryItem,
} from '../types/models';

export interface VacancyModalProps {
  vacancy: Vacancy | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Vacancy) => void;
  onDelete?: (id: number) => void;
  columns?: Array<BoardColumn | string>;
  initialHistory?: VacancyHistoryItem[];
  initialCompatibility?: CompatibilityAnalysis | null;
}



function buildCompatibilityProps(
  vacancy: Vacancy,
  ctrl: ReturnType<typeof useVacancyModalController>,
  matchScore: number | undefined,
  t: TranslateFn
) {
  const compatibility = ctrl.compatibility;
  const compatibilitySections = buildCompatibilitySections(compatibility, t);
  const recommendations = buildRecommendationsList(compatibility);
  const compatibilityScore = resolveCompatibilityDisplayScore(compatibility, matchScore);
  const compatibilityScoreTone = resolveCompatScoreTone(compatibilityScore);
  const seniority = resolveSeniorityInfo(compatibility, t);
  const emptyCompatibilityDescription = vacancy.description
    ? t('vacancyModal.empty_compat_prompt')
    : t('vacancyModal.compat_no_description');

  return {
    isCvOutdated: Boolean(compatibility?.is_outdated),
    cvOutdatedMessage: t('vacancyModal.compat_outdated', {
      revision: compatibility?.cv_revision || '',
    }),
    cvAssessment: compatibility?.summary,
    cvLevelStatus: seniority.statusLabel,
    cvLevelTone: seniority.statusTone,
    cvLevelComment: seniority.comment,
    cvLevelStatusLabel: t('vacancyModal.compat_seniority'),
    compatibilitySections,
    compatibilityScore,
    compatibilityScoreTone,
    onRunCompatibility: ctrl.handleRunCompatibility,
    analyzingCompatibility: ctrl.analyzingCompatibility,
    loadingCompatibility: ctrl.loadingCompatibility,
    compatibilityError: ctrl.compatError || undefined,
    recheckCompatibilityLabel: t('vacancyModal.compat_reanalyze'),
    compareCompatibilityLabel: t('vacancyModal.compat_compare'),
    recommendationsTitle: t('vacancyModal.compat_recommendations'),
    recommendations,
    emptyCompatibilityTitle: t('vacancyModal.compat_title'),
    emptyCompatibilityDescription,
  };
}

function buildContentSectionProps(
  vacancy: Vacancy,
  ctrl: ReturnType<typeof useVacancyModalController>,
  modalColumns: BoardColumn[],
  i18n: { t: TranslateFn; formatDate: FormatDateFn }
) {
  const { t, formatDate } = i18n;
  const historyItems = buildHistoryItems(ctrl.historyList, modalColumns, t, formatDate);
  const companyDesc = vacancy.company_info || vacancy.company_description || undefined;

  return {
    aiSummaryTitle: t('vacancyModal.ai_summary_title'),
    aiSummary: vacancy.ai_summary || undefined,
    companyDescription: companyDesc,
    companyInfoLabel: t('vacancyModal.about_company') + ' ',
    onResummarize: ctrl.handleResummarize,
    resummarizing: ctrl.resummarizing,
    updateAiLabel: t('vacancyModal.resummarize_btn'),
    noAiSummaryText: t('vacancyModal.no_summary'),
    techStackTitle: t('vacancyModal.tech_stack_title'),
    techStack: ctrl.draft.techStack,
    onTechStackChange: ctrl.handleTechStackChange,
    addTechPlaceholder: t('vacancyModal.add_token_placeholder'),
    tagsTitle: t('vacancyModal.tags_title'),
    tags: ctrl.draft.tags,
    onTagsChange: ctrl.handleTagsChange,
    addTagPlaceholder: t('vacancyModal.add_tag_placeholder'),
    historyTitle: t('vacancyModal.history_timeline_title'),
    historyStagesCountLabel: `{count} ${t('vacancyModal.history_timeline_title').toLowerCase()}`,
    historyItems,
    onSaveComment: ctrl.handleSaveHistoryComment,
    onDeleteComment: ctrl.handleDeleteHistoryComment,
    addCommentLabel: t('vacancyModal.history_add_comment'),
    commentPlaceholder: t('vacancyModal.history_comment_placeholder'),
    saveCommentLabel: t('vacancyModal.history_save_comment'),
    cancelCommentLabel: t('vacancyModal.history_cancel'),
    noHistoryTitle: t('vacancyModal.no_history'),
    notesTitle: t('vacancyModal.notes_title'),
    notes: ctrl.draft.notes,
    onNotesChange: ctrl.setNotes,
    onSaveNotes: ctrl.handleSaveNotes,
    savingNotes: ctrl.savingNotes,
    notesSaved: ctrl.savedNotesSuccess,
    saveNotesLabel: t('common.save'),
    savedNotesLabel: t('common.saved'),
    notesPlaceholder: t('vacancyModal.notes_placeholder'),
    originalDescriptionTitle: t('vacancyModal.description_title'),
    description: ctrl.draft.description,
    onDescriptionChange: ctrl.setDescription,
    onSaveDescription: ctrl.handleSaveDescription,
    savingDescription: ctrl.savingDesc,
    descriptionSaved: ctrl.savedDescSuccess,
    saveDescriptionLabel: t('common.save'),
    copyDescriptionLabel: t('vacancyModal.desc_copy'),
    copiedDescriptionLabel: t('vacancyModal.desc_copied'),
  };
}

function buildHeaderAndSalaryProps(
  vacancy: Vacancy,
  ctrl: ReturnType<typeof useVacancyModalController>,
  modalColumns: BoardColumn[],
  meta: {
    t: TranslateFn;
    formattedSalary: string;
    workplaceLabel: string;
    matchScore: number | undefined;
    onDelete?: (id: number) => void;
    rejectedStatusId: string;
  }
) {
  const { t, formattedSalary, workplaceLabel, matchScore, onDelete, rejectedStatusId } = meta;

  return {
    title: ctrl.draft.title,
    onTitleChange: ctrl.setTitle,
    onSaveTitle: ctrl.handleSaveTitle,
    company: vacancy.company,
    sourceUrl: vacancy.url,
    location: vacancy.location,
    workplace: ctrl.draft.workplaceType,
    workplaceLabel,
    workplaceOptions: buildWorkplaceOptions(t),
    onWorkplaceChange: ctrl.handleWorkplaceTypeChange,
    isClosed: ctrl.draft.isClosed,
    onToggleClosed: ctrl.handleToggleClosed,
    closedBadgeLabel: t('kanban.closed'),
    closedButtonLabel: t('kanban.closed'),
    openButtonLabel: t('vacancyModal.open_badge'),
    formattedSalary,
    matchScore,
    onRefresh: ctrl.handleReparse,
    refreshing: ctrl.reparsing,
    refreshLabel: t('vacancyModal.reparse_btn'),
    externalLinkLabel: 'LINKEDIN',
    onDelete: onDelete ? () => onDelete(vacancy.id) : undefined,
    deleteLabel: t('vacancyModal.delete_btn'),
    activeTab: ctrl.activeTab,
    onTabChange: ctrl.setActiveTab,
    detailsTabLabel: t('vacancyModal.tab_details'),
    compatibilityTabLabel: t('vacancyModal.tab_cv_compatibility'),
    status: ctrl.draft.status,
    stageOptions: buildStageOptions(modalColumns, t),
    onStatusChange: ctrl.handleStatusChange,
    statusLabel: t('vacancyModal.status_label'),
    formatLabel: t('vacancyModal.workplace_label'),
    salaryTitle: t('vacancyModal.salary_title'),
    salaryMin: ctrl.draft.salaryMin,
    salaryMax: ctrl.draft.salaryMax,
    salaryCurrency: ctrl.draft.salaryCurrency,
    salaryPeriod: ctrl.draft.salaryPeriod,
    onSaveSalary: ctrl.handleSaveSalary,
    savingSalary: ctrl.savingSalary,
    savedSalarySuccess: ctrl.savedSalarySuccess,
    editSalaryLabel: t('common.edit'),
    saveSalaryLabel: t('common.save'),
    cancelSalaryLabel: t('common.cancel'),
    salaryMinLabel: t('vacancyModal.min'),
    salaryMaxLabel: t('vacancyModal.max'),
    salaryCurrencyLabel: t('vacancyModal.currency'),
    salaryPeriodLabel: t('vacancyModal.period'),
    onReject: () => ctrl.handleStatusChange(rejectedStatusId),
    rejectLabel: t('vacancyModal.reject_btn'),
    closeLabel: t('vacancyModal.close_btn'),
  };
}

import VacancyReparseBanner from './VacancyReparseBanner';

function resolveModalLabels(
  hasSalary: boolean,
  salaryFormatted: string,
  workplaceInfo: { label: string } | null,
  t: (key: string) => string
) {
  return {
    formattedSalary: hasSalary ? salaryFormatted : t('vacancyModal.salary_not_specified'),
    workplaceLabel: workplaceInfo ? workplaceInfo.label : t('vacancyModal.not_specified'),
  };
}

export default function VacancyModal({
  vacancy,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  columns = DEFAULT_COLUMNS,
  initialHistory,
  initialCompatibility,
}: VacancyModalProps): React.ReactElement | null {
  const { t, locale, formatDate, salaryDisplayFormat, salaryTargetCurrency, exchangeRates } =
    useTranslation();

  const ctrl = useVacancyModalController({
    vacancy,
    onUpdate,
    initialHistory,
    initialCompatibility,
    locale,
    t,
  });

  if (!isOpen || !vacancy) return null;

  const modalColumns = normalizeModalColumns(columns);
  const rejectedStatusId = resolveModalRejectedStatusId(modalColumns);
  const salaryInfo = getSalaryDisplay(
    vacancy,
    t,
    salaryDisplayFormat,
    salaryTargetCurrency,
    exchangeRates
  );
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);
  const matchScore = computeVacancyMatchScore(vacancy);
  const { formattedSalary, workplaceLabel } = resolveModalLabels(
    salaryInfo.hasSalary,
    salaryInfo.formatted,
    workplaceInfo,
    t
  );

  const detailsProps: VacancyDetailsModalProps = {
    isOpen,
    onClose,
    size: 'xl',
    banner: <VacancyReparseBanner error={ctrl.reparseError} success={ctrl.reparseSuccess} />,
    ...buildHeaderAndSalaryProps(vacancy, ctrl, modalColumns, {
      t,
      formattedSalary,
      workplaceLabel,
      matchScore,
      onDelete,
      rejectedStatusId,
    }),
    ...buildContentSectionProps(vacancy, ctrl, modalColumns, { t, formatDate }),
    ...buildCompatibilityProps(vacancy, ctrl, matchScore, t),
  };

  return <VacancyDetailsModal {...detailsProps} />;
}
