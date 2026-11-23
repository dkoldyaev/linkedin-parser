import React from 'react';
import { Modal } from '@blueprint/ui-kit';
import { useTranslation } from '../../i18n/I18nContext';
import { DEFAULT_COLUMNS } from '../../constants/columns';
import {
  buildHistoryItems,
  computeVacancyMatchScore,
  normalizeModalColumns,
  resolveModalRejectedStatusId,
} from './vacancyModalHelpers';
import { useVacancyModalController } from './useVacancyModalController';
import type {
  BoardColumn,
  CompatibilityAnalysis,
  Vacancy,
  VacancyHistoryItem,
} from '../../types/models';

import VacancyReparseBanner from './VacancyReparseBanner';
import { VacancyModalHeader } from './VacancyModalHeader';
import { VacancyAiSummarySection } from './VacancyAiSummarySection';
import { VacancyCompanySection } from './VacancyCompanySection';
import { VacancySkillsSection } from './VacancySkillsSection';
import { VacancyHistorySection } from './VacancyHistorySection';
import { VacancyNotesSection } from './VacancyNotesSection';
import { VacancyRawDataTab } from './VacancyRawDataTab';
import { VacancyCompatibilityTab } from './VacancyCompatibilityTab';
import { VacancyModalFooter } from './VacancyModalFooter';

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
  const { t, locale, formatDate } = useTranslation();

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
  const matchScore = computeVacancyMatchScore(vacancy);
  const historyItems = buildHistoryItems(ctrl.historyList, modalColumns, t, formatDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <VacancyReparseBanner
        error={ctrl.reparseError}
        success={ctrl.reparseSuccess}
      />

      <VacancyModalHeader
        title={ctrl.draft.title}
        companyName={vacancy.company}
        link={vacancy.url}
        onRefresh={ctrl.handleReparse}
        refreshing={ctrl.reparsing}
        source={vacancy.source}
        location={vacancy.location}
        workplaceType={ctrl.draft.workplaceType}
        salaryMin={vacancy.salary_min}
        salaryMax={vacancy.salary_max}
        salaryCurrency={vacancy.salary_currency}
        salaryPeriod={vacancy.salary_period}
        isClosed={ctrl.draft.isClosed}
        activeTab={ctrl.activeTab}
        onTabChange={ctrl.setActiveTab}
        matchScore={vacancy.calculated_score}
      />

      <Modal.Body>
        {ctrl.activeTab === 'details' && (
          <>
            <VacancyAiSummarySection
              summary={vacancy.ai_summary || undefined}
              onResummarize={ctrl.handleResummarize}
              resummarizing={ctrl.resummarizing}
            />

            <VacancyCompanySection
              companyDescription={vacancy.company_info || vacancy.company_description || undefined}
            />

            <VacancySkillsSection
              techStack={ctrl.draft.techStack}
              onTechStackChange={ctrl.handleTechStackChange}
              tags={ctrl.draft.tags}
              onTagsChange={ctrl.handleTagsChange}
            />

            <VacancyHistorySection
              items={historyItems}
              onSaveComment={ctrl.handleSaveHistoryComment}
              onDeleteComment={ctrl.handleDeleteHistoryComment}
            />

            <VacancyNotesSection
              notes={ctrl.draft.notes}
              onSaveNotes={ctrl.handleSaveNotes}
              savingNotes={ctrl.savingNotes}
              notesSaved={ctrl.savedNotesSuccess}
            />
          </>
        )}

        {ctrl.activeTab === 'compatibility' && (
          <VacancyCompatibilityTab
            vacancy={vacancy}
            compatibility={ctrl.compatibility}
            matchScore={matchScore}
            analyzingCompatibility={ctrl.analyzingCompatibility}
            loadingCompatibility={ctrl.loadingCompatibility}
            compatError={ctrl.compatError}
            onRunCompatibility={ctrl.handleRunCompatibility}
          />
        )}

        {ctrl.activeTab === 'raw_data' && (
          <VacancyRawDataTab
            salaryMin={ctrl.draft.salaryMin}
            salaryMax={ctrl.draft.salaryMax}
            salaryCurrency={ctrl.draft.salaryCurrency}
            salaryPeriod={ctrl.draft.salaryPeriod}
            onSaveSalary={ctrl.handleSaveSalary}
            savingSalary={ctrl.savingSalary}
            savedSalarySuccess={ctrl.savedSalarySuccess}
            description={ctrl.draft.description}
            onSaveDescription={ctrl.handleSaveDescription}
            savingDescription={ctrl.savingDesc}
            descriptionSaved={ctrl.savedDescSuccess}
          />
        )}
      </Modal.Body>

      <VacancyModalFooter
        onClose={onClose}
        onReject={() => ctrl.handleStatusChange(rejectedStatusId)}
        onDelete={onDelete ? () => onDelete(vacancy.id) : undefined}
      />
    </Modal>
  );
}
