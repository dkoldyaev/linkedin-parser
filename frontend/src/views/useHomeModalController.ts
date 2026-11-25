import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { trackEvent, EVENTS } from '../utils/analytics';
import {
  useVacancyDetailLoader,
  buildResolvedModalVacancy,
  stripCachedDetailFields,
} from '../components/VacancyModal/useVacancyDetailLoader';
import { upsertVacancyInList } from './homeFilterHelpers';
import type { BoardModalEventListener, BoardToastState } from '../store/BoardStoreContext';
import type { User, Vacancy } from '../types/models';

export type ToastState = BoardToastState;

export interface UseHomeModalControllerArgs {
  user: User | null | undefined;
  vacancies: Vacancy[];
  setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
  toast: BoardToastState | null;
  setToast: React.Dispatch<React.SetStateAction<BoardToastState | null>>;
  showToast: (message: string, type: 'success' | 'error') => void;
  subscribeModalEvents?: (listener: BoardModalEventListener) => () => void;
}

function readSessionFlag(key: string): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function parseUrlVacancyParam(rawId: string | undefined): {
  activeVacancyId: number | null;
  isInvalidUrlId: boolean;
} {
  if (rawId === undefined) {
    return { activeVacancyId: null, isInvalidUrlId: false };
  }
  if (!/^[1-9]\d*$/.test(rawId)) {
    return { activeVacancyId: null, isInvalidUrlId: true };
  }
  return { activeVacancyId: Number(rawId), isInvalidUrlId: false };
}

function shouldTriggerGuestAuthPrompt(
  isAnonymous: boolean | undefined,
  currentCount: number,
  prevCount: number | null
): boolean {
  if (!isAnonymous || currentCount < 2) return false;
  if (readSessionFlag('guest_auth_prompt_shown')) return false;
  return prevCount !== null && currentCount > prevCount;
}

function useUrlDrivenVacancyModal(
  vacancies: Vacancy[],
  setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>,
  subscribeModalEvents: ((listener: BoardModalEventListener) => () => void) | undefined
) {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { activeVacancyId, isInvalidUrlId } = useMemo(
    () => parseUrlVacancyParam(params.id),
    [params.id]
  );

  const isRouteModalOpen = activeVacancyId !== null;

  const baseCard = useMemo(() => {
    if (activeVacancyId === null) return null;
    return vacancies.find((v) => v.id === activeVacancyId) || null;
  }, [vacancies, activeVacancyId]);

  const detailLoader = useVacancyDetailLoader({
    vacancyId: activeVacancyId,
    isOpen: isRouteModalOpen,
    subscribeModalEvents,
  });

  useEffect(() => {
    if (!detailLoader.detail) return;
    const cardSummary = stripCachedDetailFields(detailLoader.detail);
    setVacancies((prev) => {
      if (prev.length === 0) return prev;
      return upsertVacancyInList(prev, cardSummary);
    });
  }, [detailLoader.detail, setVacancies]);

  const selectedVacancy = useMemo(
    () => buildResolvedModalVacancy(activeVacancyId, baseCard, detailLoader.detail),
    [activeVacancyId, baseCard, detailLoader.detail]
  );

  const handleCardClick = useCallback(
    (vacancy: Vacancy) => {
      if (!vacancy || !vacancy.id) return;
      navigate(
        { pathname: `/vacancies/${vacancy.id}`, search: location.search },
        { replace: false }
      );
    },
    [navigate, location.search]
  );

  const handleCloseVacancyModal = useCallback(() => {
    navigate(
      { pathname: '/', search: location.search },
      { replace: false }
    );
  }, [navigate, location.search]);

  const isVacancyNotFound = isInvalidUrlId || detailLoader.notFound;
  const isVacancyModalOpen = isRouteModalOpen && !isVacancyNotFound && Boolean(selectedVacancy);

  return {
    selectedVacancy,
    loadingVacancyDetails: detailLoader.loadingDetails,
    isVacancyModalOpen,
    isVacancyNotFound,
    mergePatchedDetail: detailLoader.mergePatchedDetail,
    handleCardClick,
    handleCloseVacancyModal,
  };
}

export function useHomeModalController({
  user,
  vacancies,
  setVacancies,
  toast,
  setToast,
  showToast,
  subscribeModalEvents,
}: UseHomeModalControllerArgs) {
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const detailModal = useUrlDrivenVacancyModal(
    vacancies,
    setVacancies,
    subscribeModalEvents
  );

  const [shouldHighlightAdd, setShouldHighlightAdd] = useState(() =>
    readSessionFlag('highlight_add_vacancy')
  );

  const handleAddVacanciesClick = useCallback(() => {
    if (shouldHighlightAdd) {
      setShouldHighlightAdd(false);
      try {
        sessionStorage.removeItem('highlight_add_vacancy');
      } catch {
        /* ignore */
      }
    }
    trackEvent(EVENTS.BATCH_IMPORT_OPEN);
    setIsBatchOpen(true);
  }, [shouldHighlightAdd]);

  const [isGuestAuthModalOpen, setIsGuestAuthModalOpen] = useState(false);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(() =>
    readSessionFlag('guest_banner_dismissed')
  );
  const prevVacancyCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      shouldTriggerGuestAuthPrompt(
        user?.is_anonymous,
        vacancies.length,
        prevVacancyCountRef.current
      )
    ) {
      setIsGuestAuthModalOpen(true);
      try {
        sessionStorage.setItem('guest_auth_prompt_shown', 'true');
      } catch {
        /* ignore */
      }
    }
    prevVacancyCountRef.current = vacancies.length;
  }, [vacancies.length, user?.is_anonymous]);

  const dismissGuestBanner = useCallback(() => {
    setGuestBannerDismissed(true);
    try {
      sessionStorage.setItem('guest_banner_dismissed', 'true');
    } catch {
      /* ignore */
    }
  }, []);

  return {
    ...detailModal,
    isBatchOpen,
    setIsBatchOpen,
    isQueueOpen,
    setIsQueueOpen,
    toast,
    setToast,
    showToast,
    handleAddVacanciesClick,
    isGuestAuthModalOpen,
    setIsGuestAuthModalOpen,
    guestBannerDismissed,
    dismissGuestBanner,
  };
}
