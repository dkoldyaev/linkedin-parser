import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../services/apiClient';
import type { BoardModalEventListener } from '../../store/BoardStoreContext';
import type { Vacancy } from '../../types/models';
import { vacancyService } from '../../services/vacancyService';

export interface UseVacancyDetailLoaderArgs {
  vacancyId: number | null;
  isOpen: boolean;
  subscribeModalEvents?: (listener: BoardModalEventListener) => () => void;
}

function isNotFoundOrForbiddenError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  return err.status === 404 || err.status === 403;
}

export function stripCachedDetailFields(card: Vacancy): Vacancy {
  return {
    ...card,
    description: undefined,
    company_info: undefined,
    company_description: undefined,
    notes: undefined,
    history: undefined,
  };
}

export function buildResolvedModalVacancy(
  vacancyId: number | null,
  baseCard: Vacancy | null,
  detail: Vacancy | null,
): Vacancy | null {
  if (vacancyId === null) return null;
  const cleanBase = baseCard ? stripCachedDetailFields(baseCard) : null;
  if (cleanBase && detail) {
    return { ...cleanBase, ...detail };
  }
  if (detail) return detail;
  if (cleanBase) return cleanBase;
  return {
    id: vacancyId,
    title: '',
    company: '',
    url: '',
    status: 'Еще не написал',
  };
}

export function useVacancyDetailLoader({
  vacancyId,
  isOpen,
  subscribeModalEvents,
}: UseVacancyDetailLoaderArgs) {
  const [detail, setDetail] = useState<Vacancy | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(
    Boolean(isOpen && vacancyId !== null),
  );
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || vacancyId === null) {
      setDetail(null);
      setLoadingDetails(false);
      setNotFound(false);
      return undefined;
    }

    let cancelled = false;
    setDetail(null);
    setLoadingDetails(true);
    setNotFound(false);

    vacancyService
      .getVacancy(vacancyId)
      .then((fetched) => {
        if (cancelled) return;
        setDetail(fetched);
        setLoadingDetails(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isNotFoundOrForbiddenError(err)) {
          setNotFound(true);
        }
        setLoadingDetails(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vacancyId, isOpen]);

  useEffect(() => {
    if (!isOpen || vacancyId === null || !subscribeModalEvents) {
      return undefined;
    }
    return subscribeModalEvents((event) => {
      if (event.type === 'vacancy_updated' && event.vacancy.id === vacancyId) {
        setDetail((prev) => (prev ? { ...prev, ...event.vacancy } : prev));
      } else if (event.type === 'compatibility_analyzed' && event.vacancyId === vacancyId) {
        setDetail((prev) =>
          prev ? { ...prev, calculated_score: event.score, match_score: event.score } : prev,
        );
      } else if (event.type === 'vacancy_deleted' && event.vacancyId === vacancyId) {
        setNotFound(true);
      }
    });
  }, [isOpen, vacancyId, subscribeModalEvents]);

  const mergePatchedDetail = useCallback(
    (updated: Vacancy) => {
      if (vacancyId !== null && updated.id === vacancyId) {
        setDetail((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    },
    [vacancyId],
  );

  return {
    detail,
    loadingDetails,
    notFound,
    mergePatchedDetail,
  };
}
