import type { BoardColumn, User, Vacancy } from '../types/models';
import {
  type BoardStoreValue,
  useBoardStoreState,
  useOptionalBoardStore,
} from '../store/BoardStoreContext';
import {
  computeHiddenVacancyIds,
  defaultFilterState,
  type HomeFilterState,
} from './homeFilterHelpers';
import {
  deriveAllCities,
  deriveAllCountries,
  deriveAllSources,
  deriveAllTags,
} from '../store/boardMetadataHelpers';
import { EVENTS, trackEvent } from '../utils/analytics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UseHomeVacanciesDataArgs {
  user: User | null | undefined;
  initialVacancies?: Vacancy[];
  initialColumns?: BoardColumn[];
}

const SEARCH_BURST_MS = 500;

function getSearchParamString(sp: URLSearchParams, key: string): string {
  const val = sp.get(key);
  return val ? val : '';
}

function readFiltersFromSearchParams(sp: URLSearchParams): HomeFilterState {
  return {
    search: getSearchParamString(sp, 'search'),
    selectedTag: getSearchParamString(sp, 'tag'),
    selectedCountry: getSearchParamString(sp, 'country'),
    selectedCity: getSearchParamString(sp, 'city'),
    selectedWorkplaceType: getSearchParamString(sp, 'workplace_type'),
    selectedSource: getSearchParamString(sp, 'source'),
    selectedClosed: getSearchParamString(sp, 'is_closed'),
  };
}

function buildSearchParamsFromFilters(
  currentSp: URLSearchParams,
  nextFilters: HomeFilterState,
): URLSearchParams {
  const sp = new URLSearchParams(currentSp);
  const entries: Array<[string, string]> = [
    ['search', nextFilters.search],
    ['tag', nextFilters.selectedTag],
    ['country', nextFilters.selectedCountry],
    ['city', nextFilters.selectedCity],
    ['workplace_type', nextFilters.selectedWorkplaceType],
    ['source', nextFilters.selectedSource],
    ['is_closed', nextFilters.selectedClosed],
  ];

  for (const [key, val] of entries) {
    const trimmed = val.trim();
    if (trimmed !== '') {
      sp.set(key, trimmed);
    } else {
      sp.delete(key);
    }
  }
  return sp;
}

function useUrlFilterController() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = useMemo(() => readFiltersFromSearchParams(searchParams), [searchParams]);

  const [searchDraft, setSearchDraft] = useState<string>(urlFilters.search);
  const lastCommittedSearchRef = useRef<string>(urlFilters.search);
  const isTypingBurstRef = useRef<boolean>(false);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (urlFilters.search !== lastCommittedSearchRef.current) {
      lastCommittedSearchRef.current = urlFilters.search;
      setSearchDraft(urlFilters.search);
      isTypingBurstRef.current = false;
      clearTimeout(burstTimerRef.current);
    }
  }, [urlFilters.search]);

  useEffect(() => () => clearTimeout(burstTimerRef.current), []);

  const filters: HomeFilterState = useMemo(
    () => ({ ...urlFilters, search: searchDraft }),
    [urlFilters, searchDraft],
  );

  const commitFiltersToUrl = useCallback(
    (nextFilters: HomeFilterState, replaceHistory: boolean) => {
      const nextSp = buildSearchParamsFromFilters(searchParams, nextFilters);
      if (nextSp.toString() === searchParams.toString()) return;
      setSearchParams(nextSp, { replace: replaceHistory });
    },
    [searchParams, setSearchParams],
  );

  const breakSearchBurst = useCallback(() => {
    isTypingBurstRef.current = false;
    clearTimeout(burstTimerRef.current);
  }, []);

  const handleSearchChange = useCallback(
    (val: string) => {
      setSearchDraft(val);
      lastCommittedSearchRef.current = val.trim();
      const shouldReplace = isTypingBurstRef.current;
      isTypingBurstRef.current = true;
      clearTimeout(burstTimerRef.current);
      burstTimerRef.current = setTimeout(() => {
        isTypingBurstRef.current = false;
      }, SEARCH_BURST_MS);
      commitFiltersToUrl({ ...filters, search: val }, shouldReplace);
    },
    [filters, commitFiltersToUrl],
  );

  const resetAllFilters = useCallback(() => {
    breakSearchBurst();
    trackEvent(EVENTS.FILTERS_RESET);
    setSearchDraft('');
    lastCommittedSearchRef.current = '';
    commitFiltersToUrl(defaultFilterState, false);
  }, [breakSearchBurst, commitFiltersToUrl]);

  return { filters, commitFiltersToUrl, breakSearchBurst, handleSearchChange, resetAllFilters };
}

function useDiscreteFilterHandlers(
  filters: HomeFilterState,
  commitFiltersToUrl: (nextFilters: HomeFilterState, replaceHistory: boolean) => void,
  breakSearchBurst: () => void,
) {
  const applySelectPatch = useCallback(
    (patch: Partial<HomeFilterState>) => {
      breakSearchBurst();
      commitFiltersToUrl({ ...filters, ...patch }, false);
    },
    [filters, commitFiltersToUrl, breakSearchBurst],
  );

  const handleCountryChange = useCallback(
    (country: string) => {
      trackEvent(EVENTS.FILTER_COUNTRY, { country: country ? country : 'all' });
      applySelectPatch({ selectedCountry: country, selectedCity: '' });
    },
    [applySelectPatch],
  );

  return {
    handleCountryChange,
    handleCityChange: useCallback(
      (city: string) => applySelectPatch({ selectedCity: city }),
      [applySelectPatch],
    ),
    handleWorkplaceChange: useCallback(
      (wp: string) => applySelectPatch({ selectedWorkplaceType: wp }),
      [applySelectPatch],
    ),
    handleSourceChange: useCallback(
      (src: string) => applySelectPatch({ selectedSource: src }),
      [applySelectPatch],
    ),
    handleClosedChange: useCallback(
      (cl: string) => applySelectPatch({ selectedClosed: cl }),
      [applySelectPatch],
    ),
    handleTagChange: useCallback(
      (tag: string) => applySelectPatch({ selectedTag: tag }),
      [applySelectPatch],
    ),
  };
}

function useResolvedBoardStore(args: UseHomeVacanciesDataArgs): BoardStoreValue {
  const contextStore = useOptionalBoardStore();
  const hasExplicitSeeds =
    Array.isArray(args.initialVacancies) || Array.isArray(args.initialColumns);
  const fallbackUser = contextStore && !hasExplicitSeeds ? null : args.user;
  const fallbackStore = useBoardStoreState(
    fallbackUser,
    args.initialVacancies,
    args.initialColumns,
  );
  return contextStore && !hasExplicitSeeds ? contextStore : fallbackStore;
}

export function useHomeVacanciesData(args: UseHomeVacanciesDataArgs) {
  const store = useResolvedBoardStore(args);
  const urlCtrl = useUrlFilterController();
  const discreteHandlers = useDiscreteFilterHandlers(
    urlCtrl.filters,
    urlCtrl.commitFiltersToUrl,
    urlCtrl.breakSearchBurst,
  );

  const allTags = useMemo(() => deriveAllTags(store.vacancies), [store.vacancies]);
  const allCountries = useMemo(() => deriveAllCountries(store.vacancies), [store.vacancies]);
  const allCities = useMemo(
    () => deriveAllCities(store.vacancies, urlCtrl.filters.selectedCountry),
    [store.vacancies, urlCtrl.filters.selectedCountry],
  );
  const allSources = useMemo(() => deriveAllSources(store.vacancies), [store.vacancies]);
  const hiddenVacancyIds = useMemo(
    () => computeHiddenVacancyIds(store.vacancies, urlCtrl.filters),
    [store.vacancies, urlCtrl.filters],
  );

  return {
    ...store,
    filters: urlCtrl.filters,
    search: urlCtrl.filters.search,
    selectedTag: urlCtrl.filters.selectedTag,
    selectedCountry: urlCtrl.filters.selectedCountry,
    selectedCity: urlCtrl.filters.selectedCity,
    selectedWorkplaceType: urlCtrl.filters.selectedWorkplaceType,
    selectedSource: urlCtrl.filters.selectedSource,
    selectedClosed: urlCtrl.filters.selectedClosed,
    allTags,
    allCountries,
    allCities,
    allSources,
    hiddenVacancyIds,
    ...discreteHandlers,
    handleSearchChange: urlCtrl.handleSearchChange,
    resetAllFilters: urlCtrl.resetAllFilters,
  };
}
