'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { trackEvent, EVENTS } from '../utils/analytics';
import { useDisclosure } from '../utils/useDisclosure';
import { vacancyService } from '../services/vacancyService';
import { ApiError } from '../services/apiClient';
import type {
  User,
  Vacancy,
  VacancyHistoryItem,
  CompatibilityAnalysis,
} from '../types/models';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export interface UseHomeModalControllerArgs {
  user: User | null | undefined;
  locale: string;
  vacancies: Vacancy[];
  setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
  initialSelectedVacancy: Vacancy | null | undefined;
  initialVacancyHistory: VacancyHistoryItem[] | undefined;
  initialVacancyCompatibility: CompatibilityAnalysis | null | undefined;
}

function readSessionFlag(key: string): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function pushVacancyHistoryUrl(
  vacancyId: number,
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams
) {
  const qs = searchParams.toString();
  const targetUrl = qs ? `/vacancies/${vacancyId}?${qs}` : `/vacancies/${vacancyId}`;
  router.push(targetUrl, { scroll: false });
}

function resetRootHistoryUrl(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams
) {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/vacancies/')) {
    router.back();
  } else {
    const qs = searchParams.toString();
    const targetUrl = qs ? `/?${qs}` : '/';
    router.push(targetUrl, { scroll: false });
  }
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

async function fetchVacancyDetailResult(
  vacancy: Vacancy
): Promise<{ notFound: true } | { notFound: false; vacancy: Vacancy }> {
  try {
    const fullVacancy = await vacancyService.getVacancy(vacancy.id);
    return { notFound: false, vacancy: fullVacancy };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { notFound: true };
    }
    return { notFound: false, vacancy };
  }
}

function replaceVacancyNotFoundHistory(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams
) {
  const qs = searchParams.toString();
  const targetUrl = qs ? `/?${qs}` : '/';
  router.replace(targetUrl, { scroll: false });
}

function useVacancyDetailModal({
  locale,
  vacancies,
  setVacancies,
  initialSelectedVacancy,
  initialVacancyHistory,
  initialVacancyCompatibility,
  showToast,
}: {
  locale: string;
  vacancies: Vacancy[];
  setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
  initialSelectedVacancy: Vacancy | null | undefined;
  initialVacancyHistory: VacancyHistoryItem[] | undefined;
  initialVacancyCompatibility: CompatibilityAnalysis | null | undefined;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(
    initialSelectedVacancy || null
  );
  const [selectedVacancyHistory, setSelectedVacancyHistory] = useState(
    initialVacancyHistory
  );
  const [selectedVacancyCompat, setSelectedVacancyCompat] = useState(
    initialVacancyCompatibility
  );

  const isNavigatingHistoryRef = useRef(false);

  const vacancyDisclosure = useDisclosure({
    defaultIsOpen: Boolean(initialSelectedVacancy),
    onClose: () => {
      setSelectedVacancy(null);
      setSelectedVacancyHistory(undefined);
      setSelectedVacancyCompat(undefined);
      if (!isNavigatingHistoryRef.current) {
        resetRootHistoryUrl(router, searchParamsRef.current);
      }
    },
  });

  const handleCloseVacancyModal = useCallback(() => {
    vacancyDisclosure.close();
  }, [vacancyDisclosure]);

  const openVacancyDetail = useCallback(
    (v: Vacancy, pushUrl = true) => {
      setSelectedVacancy(v);
      setSelectedVacancyHistory(undefined);
      setSelectedVacancyCompat(undefined);
      vacancyDisclosure.open();
      if (pushUrl) {
        pushVacancyHistoryUrl(v.id, router, searchParamsRef.current);
      }
    },
    [vacancyDisclosure, router]
  );

  const handleCardClick = useCallback(
    async (vacancy: Vacancy) => {
      if (!vacancy || !vacancy.id) return;
      const result = await fetchVacancyDetailResult(vacancy);
      if (result.notFound) {
        const msg = locale === 'en' ? '404 Vacancy not found' : '404 Вакансия не найдена';
        showToast(msg, 'error');
        setVacancies((prev) => prev.filter((v) => v.id !== vacancy.id));
        replaceVacancyNotFoundHistory(router, searchParamsRef.current);
        return;
      }
      openVacancyDetail(result.vacancy, true);
    },
    [locale, showToast, setVacancies, openVacancyDetail, router]
  );

  const vacanciesRef = useRef(vacancies);
  useEffect(() => {
    vacanciesRef.current = vacancies;
  }, [vacancies]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handlePopState = async () => {
      isNavigatingHistoryRef.current = true;
      try {
        const path = window.location.pathname;
        const match = path.match(/^\/vacancies\/(\d+)/);
        if (match) {
          const id = Number(match[1]);
          const existing = vacanciesRef.current.find((v) => v.id === id);
          if (existing) {
            openVacancyDetail(existing, false);
          } else {
            try {
              const fetched = await vacancyService.getVacancy(id);
              if (fetched) {
                openVacancyDetail(fetched, false);
              }
            } catch {
              vacancyDisclosure.close();
            }
          }
        } else {
          vacancyDisclosure.close();
        }
      } finally {
        isNavigatingHistoryRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [openVacancyDetail, vacancyDisclosure]);

  return {
    selectedVacancy,
    setSelectedVacancy,
    selectedVacancyHistory,
    selectedVacancyCompat,
    isVacancyModalOpen: vacancyDisclosure.isOpen && Boolean(selectedVacancy),
    handleCloseVacancyModal,
    handleCardClick,
  };
}

export function useHomeModalController({
  user,
  locale,
  vacancies,
  setVacancies,
  initialSelectedVacancy,
  initialVacancyHistory,
  initialVacancyCompatibility,
}: UseHomeModalControllerArgs) {
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const detailModal = useVacancyDetailModal({
    locale,
    vacancies,
    setVacancies,
    initialSelectedVacancy,
    initialVacancyHistory,
    initialVacancyCompatibility,
    showToast,
  });

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
      if (window.history?.replaceState) {
        window.history.replaceState({}, document.title);
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

  return { ...detailModal, isBatchOpen, setIsBatchOpen, isQueueOpen, setIsQueueOpen, toast, setToast, showToast, handleAddVacanciesClick, isGuestAuthModalOpen, setIsGuestAuthModalOpen, guestBannerDismissed, dismissGuestBanner };
}
