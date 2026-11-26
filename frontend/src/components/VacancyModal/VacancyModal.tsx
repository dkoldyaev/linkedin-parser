import type { BoardColumn, Vacancy } from '../../types/models';
import {
  buildHistoryItems,
  computeVacancyMatchScore,
  normalizeModalColumns,
  resolveModalRejectedStatusId,
} from './vacancyModalHelpers';
import React, { useState } from 'react';
import { DEFAULT_COLUMNS } from '../../constants/columns';
import { Modal } from '@blueprint/ui-kit';
import { useTranslation } from '../../i18n/I18nContext';
import { vacancyService } from '../../services/vacancyService';

import type { SalaryData } from './VacancySalarySection';
import { useVacancyCompatibility } from './useVacancyCompatibility';
import { useVacancyHistory } from './useVacancyHistory';
import { VacancyCompatibilityTab } from './VacancyCompatibilityTab';
import { VacancyDetailsTabPanel } from './VacancyDetailsTabPanel';
import { VacancyModalFooter } from './VacancyModalFooter';
import { VacancyModalHeader } from './VacancyModalHeader';
import { VacancyRawDataTab } from './VacancyRawDataTab';
import VacancyReparseBanner from './VacancyReparseBanner';
import { VacancyTabContent } from './VacancyTabContent';

export interface VacancyModalProps {
  vacancy: Vacancy | null;
  isOpen: boolean;
  loadingDetails?: boolean;
  onClose: () => void;
  onUpdate: (updated: Vacancy) => void;
  onDelete?: (id: number) => void;
  columns?: Array<BoardColumn | string>;
}

function useModalAsyncActions(
  vacancy: Vacancy | null,
  locale: string,
  t: (path: string) => string,
  onUpdate: (updated: Vacancy) => void,
) {
  const [resummarizing, setResummarizing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [reparseError, setReparseError] = useState<string | null>(null);
  const [reparseSuccess, setReparseSuccess] = useState(false);

  const patchField = async (payload: Record<string, unknown>) => {
    if (!vacancy) return;
    const updated = await vacancyService.patchDetail(vacancy.id, payload);
    if (updated) onUpdate(updated);
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
    if (!vacancy) return;
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
    if (!vacancy) return;
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

  return {
    resummarizing,
    reparsing,
    reparseError,
    reparseSuccess,
    patchField,
    handleSaveSalary,
    handleResummarize,
    handleReparse,
  };
}

function useResettableActiveTab(vacancyId: number | undefined, isOpen: boolean) {
  const [tabState, setTabState] = useState<{ key: string; tab: string }>({
    key: '',
    tab: 'details',
  });
  const currentKey = `${isOpen ? '1' : '0'}:${vacancyId ?? 'none'}`;
  const activeTab = tabState.key === currentKey ? tabState.tab : 'details';

  const setActiveTab: React.Dispatch<React.SetStateAction<string>> = (next) => {
    const resolved = typeof next === 'function' ? next(activeTab) : next;
    setTabState({ key: currentKey, tab: resolved });
  };

  return { activeTab, setActiveTab };
}

export default function VacancyModal({
  vacancy,
  isOpen,
  loadingDetails = false,
  onClose,
  onUpdate,
  onDelete,
  columns = DEFAULT_COLUMNS,
}: VacancyModalProps): React.ReactElement | null {
  const { t, locale, formatDate } = useTranslation();
  const { activeTab, setActiveTab } = useResettableActiveTab(vacancy?.id, isOpen);

  const actions = useModalAsyncActions(vacancy, locale, t, onUpdate);
  const history = useVacancyHistory(vacancy, isOpen, loadingDetails);
  const compat = useVacancyCompatibility(vacancy, isOpen, t);

  if (!isOpen || !vacancy) return null;

  const modalColumns = normalizeModalColumns(columns);
  const rejectedStatusId = resolveModalRejectedStatusId(modalColumns);
  const matchScore = computeVacancyMatchScore(vacancy);
  const historyItems = buildHistoryItems(history.historyList, modalColumns, t, formatDate);
  const deleteHandler = onDelete ? () => onDelete(vacancy.id) : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <VacancyReparseBanner error={actions.reparseError} success={actions.reparseSuccess} />
      <VacancyModalHeader
        title={vacancy.title}
        companyName={vacancy.company}
        link={vacancy.url}
        onRefresh={actions.handleReparse}
        refreshing={actions.reparsing}
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
        <VacancyTabContent>
          {activeTab === 'raw_data' && (
            <VacancyRawDataTab
              salaryMin={vacancy.salary_min}
              salaryMax={vacancy.salary_max}
              salaryCurrency={vacancy.salary_currency}
              salaryPeriod={vacancy.salary_period}
              onSaveSalary={actions.handleSaveSalary}
              description={vacancy.description || ''}
              loadingDescription={loadingDetails}
              onSaveDescription={(description) => actions.patchField({ description })}
            />
          )}
          {activeTab === 'compatibility' && (
            <VacancyCompatibilityTab
              vacancy={vacancy}
              compatibility={compat.compatibility}
              matchScore={matchScore}
              analyzingCompatibility={compat.analyzingCompatibility}
              loadingCompatibility={compat.loadingCompatibility}
              loadingDetails={loadingDetails}
              compatError={compat.compatError}
              onRunCompatibility={compat.handleRunCompatibility}
            />
          )}
          {activeTab === 'details' && (
            <VacancyDetailsTabPanel
              vacancy={vacancy}
              loadingDetails={loadingDetails}
              resummarizing={actions.resummarizing}
              onResummarize={actions.handleResummarize}
              onPatchField={actions.patchField}
              historyItems={historyItems}
              onSaveComment={history.handleSaveComment}
              onDeleteComment={history.handleDeleteComment}
            />
          )}
        </VacancyTabContent>
      </Modal.Body>
      <VacancyModalFooter
        onClose={onClose}
        onReject={() => actions.patchField({ status: rejectedStatusId })}
        onDelete={deleteHandler}
      />
    </Modal>
  );
}
