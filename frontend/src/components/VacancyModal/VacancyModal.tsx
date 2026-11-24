import React, { useState } from 'react';
import { Modal } from '@blueprint/ui-kit';
import { useTranslation } from '../../i18n/I18nContext';
import { DEFAULT_COLUMNS } from '../../constants/columns';
import { vacancyService } from '../../services/vacancyService';
import {
  buildHistoryItems,
  computeVacancyMatchScore,
  normalizeModalColumns,
  resolveModalRejectedStatusId,
} from './vacancyModalHelpers';
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
import { VacancyTabContent } from './VacancyTabContent';
import { useVacancyHistory } from './useVacancyHistory';
import { useVacancyCompatibility } from './useVacancyCompatibility';
import type { SalaryData } from './VacancySalarySection';

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
  const [activeTab, setActiveTab] = useState('details');

  // Reparse and Resummarize local state
  const [resummarizing, setResummarizing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [reparseError, setReparseError] = useState<string | null>(null);
  const [reparseSuccess, setReparseSuccess] = useState(false);

  // Subsystem hooks
  const { historyList, handleSaveComment, handleDeleteComment } = useVacancyHistory(
    vacancy,
    initialHistory
  );
  const {
    compatibility,
    analyzingCompatibility,
    loadingCompatibility,
    compatError,
    handleRunCompatibility,
  } = useVacancyCompatibility(vacancy, initialCompatibility, t);

  if (!isOpen || !vacancy) return null;

  const modalColumns = normalizeModalColumns(columns);
  const rejectedStatusId = resolveModalRejectedStatusId(modalColumns);
  const matchScore = computeVacancyMatchScore(vacancy);
  const historyItems = buildHistoryItems(historyList, modalColumns, t, formatDate);

  // Direct save handlers
  const patchField = async (payload: Record<string, unknown>) => {
    try {
      const updated = await vacancyService.patchDetail(vacancy.id, payload);
      if (updated) onUpdate(updated);
    } catch (err) {
      console.error('Failed to patch vacancy field', err);
      throw err;
    }
  };

  const handleSaveSalary = async (salary: SalaryData) => {
    const minVal = salary.min !== '' ? Number(salary.min) : null;
    const maxVal = salary.max !== '' ? Number(salary.max) : null;
    await patchField({
      salary_min: minVal,
      salary_max: maxVal,
      salary_currency: salary.currency,
      salary_period: salary.period,
    });
  };

  const handleResummarize = async () => {
    setResummarizing(true);
    try {
      const updated = await vacancyService.resummarize(vacancy.id, locale);
      onUpdate(updated);
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
      await vacancyService.reparse(vacancy.id);
      setReparseSuccess(true);
      setTimeout(() => setReparseSuccess(false), 3000);
    } catch (err) {
      setReparseError(err instanceof Error ? err.message : t('common.error'));
      setTimeout(() => setReparseError(null), 6000);
    } finally {
      setReparsing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <VacancyReparseBanner error={reparseError} success={reparseSuccess} />

      <VacancyModalHeader
        title={vacancy.title || ''}
        companyName={vacancy.company}
        link={vacancy.url}
        onRefresh={handleReparse}
        refreshing={reparsing}
        source={vacancy.source}
        location={vacancy.location}
        workplaceType={vacancy.workplace_type}
        salaryMin={vacancy.salary_min}
        salaryMax={vacancy.salary_max}
        salaryCurrency={vacancy.salary_currency}
        salaryPeriod={vacancy.salary_period}
        isClosed={Boolean(vacancy.is_closed)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchScore={vacancy.calculated_score}
      />

      <Modal.Body>
        {activeTab === 'details' && (
          <VacancyTabContent>
            <VacancyAiSummarySection
              summary={vacancy.ai_summary || undefined}
              onResummarize={handleResummarize}
              resummarizing={resummarizing}
            />

            <VacancyCompanySection
              companyDescription={vacancy.company_info || vacancy.company_description || undefined}
            />

            <VacancySkillsSection
              techStack={vacancy.tech_stack || []}
              onTechStackChange={(tech_stack) => patchField({ tech_stack })}
              tags={vacancy.tags || []}
              onTagsChange={(tags) => patchField({ tags })}
            />

            <VacancyHistorySection
              items={historyItems}
              onSaveComment={handleSaveComment}
              onDeleteComment={handleDeleteComment}
            />

            <VacancyNotesSection
              notes={vacancy.notes || ''}
              onSaveNotes={(notes) => patchField({ notes })}
            />
          </VacancyTabContent>
        )}

        {activeTab === 'raw_data' && (
          <VacancyRawDataTab
            salaryMin={vacancy.salary_min}
            salaryMax={vacancy.salary_max}
            salaryCurrency={vacancy.salary_currency}
            salaryPeriod={vacancy.salary_period}
            onSaveSalary={handleSaveSalary}
            description={vacancy.description || ''}
            onSaveDescription={(description) => patchField({ description })}
          />
        )}

        {activeTab === 'compatibility' && (
          <VacancyTabContent>
            <VacancyCompatibilityTab
              vacancy={vacancy}
              compatibility={compatibility}
              matchScore={matchScore}
              analyzingCompatibility={analyzingCompatibility}
              loadingCompatibility={loadingCompatibility}
              compatError={compatError}
              onRunCompatibility={handleRunCompatibility}
            />
          </VacancyTabContent>
        )}
      </Modal.Body>

      <VacancyModalFooter
        onClose={onClose}
        onReject={() => patchField({ status: rejectedStatusId })}
        onDelete={onDelete ? () => onDelete(vacancy.id) : undefined}
      />
    </Modal>
  );
}
