import { useState, useEffect, useCallback } from 'react';
import { vacancyService } from '../../services/vacancyService';
import type { Vacancy, VacancyHistoryItem } from '../../types/models';

export function useVacancyHistory(
  vacancy: Vacancy | null,
  isOpen: boolean,
  loadingDetails: boolean
) {
  const [historyList, setHistoryList] = useState<VacancyHistoryItem[]>([]);
  const vacancyId = vacancy?.id;
  const vacancyHistory = vacancy?.history;

  useEffect(() => {
    if (!isOpen || !vacancyId || loadingDetails) {
      return undefined;
    }
    if (Array.isArray(vacancyHistory)) {
      setHistoryList(vacancyHistory);
      return undefined;
    }
    let cancelled = false;
    vacancyService
      .getHistory(vacancyId)
      .then((items) => {
        if (!cancelled && Array.isArray(items)) setHistoryList(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, vacancyId, vacancyHistory, loadingDetails]);

  const handleSaveComment = useCallback(
    async (historyId: string, comment: string) => {
      if (!vacancyId) return;
      const updated = await vacancyService.updateHistoryComment(vacancyId, historyId, comment);
      if (updated) {
        setHistoryList((prev) =>
          prev.map((item) => (String(item.id) === historyId ? { ...item, comment } : item))
        );
      }
    },
    [vacancyId]
  );

  const handleDeleteComment = useCallback(
    async (historyId: string) => {
      if (!vacancyId) return;
      await vacancyService.updateHistoryComment(vacancyId, historyId, null);
      setHistoryList((prev) =>
        prev.map((item) => (String(item.id) === historyId ? { ...item, comment: '' } : item))
      );
    },
    [vacancyId]
  );

  const effectiveHistory = isOpen && vacancyId && !loadingDetails ? historyList : [];

  return {
    historyList: effectiveHistory,
    handleSaveComment,
    handleDeleteComment,
  };
}
