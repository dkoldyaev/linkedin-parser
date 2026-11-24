import { useState, useEffect, useCallback } from 'react';
import { vacancyService } from '../../services/vacancyService';
import type { Vacancy, VacancyHistoryItem } from '../../types/models';

export function useVacancyHistory(vacancy: Vacancy | null, initialHistory?: VacancyHistoryItem[]) {
  const [historyList, setHistoryList] = useState<VacancyHistoryItem[]>(() => {
    if (Array.isArray(initialHistory)) return initialHistory;
    if (Array.isArray(vacancy?.history)) return vacancy.history;
    return [];
  });

  useEffect(() => {
    if (!vacancy) return;
    if (Array.isArray(initialHistory)) {
      setHistoryList(initialHistory);
    } else if (Array.isArray(vacancy.history)) {
      setHistoryList(vacancy.history);
    } else if (vacancy.id) {
      vacancyService
        .getHistory(vacancy.id)
        .then((items) => {
          if (Array.isArray(items)) setHistoryList(items);
        })
        .catch(() => {});
    }
  }, [vacancy?.id, initialHistory]);

  const handleSaveComment = useCallback(
    async (historyId: string, comment: string) => {
      if (!vacancy) return;
      try {
        const updated = await vacancyService.updateHistoryComment(vacancy.id, historyId, comment);
        if (updated) {
          setHistoryList((prev) =>
            prev.map((item) => (String(item.id) === historyId ? { ...item, comment } : item))
          );
        }
      } catch (err) {
        console.error('Failed to save history comment', err);
        throw err;
      }
    },
    [vacancy?.id]
  );

  const handleDeleteComment = useCallback(
    async (historyId: string) => {
      if (!vacancy) return;
      try {
        await vacancyService.updateHistoryComment(vacancy.id, historyId, null);
        setHistoryList((prev) =>
          prev.map((item) => (String(item.id) === historyId ? { ...item, comment: '' } : item))
        );
      } catch (err) {
        console.error('Failed to delete history comment', err);
        throw err;
      }
    },
    [vacancy?.id]
  );

  return {
    historyList,
    handleSaveComment,
    handleDeleteComment,
  };
}
