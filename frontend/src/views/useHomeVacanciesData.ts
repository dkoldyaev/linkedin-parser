'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackEvent, EVENTS } from '../utils/analytics';
import type { User, Vacancy, BoardColumn, QueueTask } from '../types/models';
import {
  type HomeFilterState,
  computeHiddenVacancyIds,
} from './homeFilterHelpers';
import { vacancyService } from '../services/vacancyService';
import { columnService } from '../services/columnService';
import { queueService } from '../services/queueService';

export interface UseHomeVacanciesDataArgs {
  user: User | null | undefined;
  initialVacancies: Vacancy[] | undefined;
  initialColumns: BoardColumn[] | undefined;
  fetchBoardInBackground: boolean;
  initialFilters?: Partial<HomeFilterState>;
  isFilteredSSR?: boolean;
}

function extractQueueRemainingCount(data: unknown): number | null {
  if (Array.isArray(data)) {
    return (data as QueueTask[]).filter(
      (i) => i.status === 'pending' || i.status === 'processing'
    ).length;
  }
  if (data && typeof data === 'object' && 'total_remaining' in data) {
    const val = (data as { total_remaining?: number }).total_remaining;
    return typeof val === 'number' ? val : null;
  }
  return null;
}

function syncFiltersToHistory(
  filters: HomeFilterState,
  router: ReturnType<typeof useRouter>,
  replace = false
) {
  if (typeof window === 'undefined') return;
  const currentUrl = new URL(window.location.href);
  const sp = currentUrl.searchParams;

  const setOrDel = (key: string, val: string) => {
    if (val && val.trim() !== '') {
      sp.set(key, val.trim());
    } else {
      sp.delete(key);
    }
  };

  setOrDel('search', filters.search);
  setOrDel('tag', filters.selectedTag);
  setOrDel('country', filters.selectedCountry);
  setOrDel('city', filters.selectedCity);
  setOrDel('workplace_type', filters.selectedWorkplaceType);
  setOrDel('source', filters.selectedSource);
  setOrDel('is_closed', filters.selectedClosed);

  const qs = sp.toString();
  const targetUrl = qs ? `${currentUrl.pathname}?${qs}` : currentUrl.pathname;

  if (replace) {
    router.replace(targetUrl, { scroll: false });
  } else {
    router.push(targetUrl, { scroll: false });
  }
}

function useHomeFilterState(initial?: Partial<HomeFilterState>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initial?.search || '');
  const [selectedTag, setSelectedTag] = useState(initial?.selectedTag || '');
  const [selectedCountry, setSelectedCountry] = useState(initial?.selectedCountry || '');
  const [selectedCity, setSelectedCity] = useState(initial?.selectedCity || '');
  const [selectedWorkplaceType, setSelectedWorkplaceType] = useState(initial?.selectedWorkplaceType || '');
  const [selectedSource, setSelectedSource] = useState(initial?.selectedSource || '');
  const [selectedClosed, setSelectedClosed] = useState(initial?.selectedClosed || '');

  // Synchronize internal filter state whenever searchParams changes (Next.js navigation / back / forward)
  useEffect(() => {
    if (!searchParams) return;
    setSearch(searchParams.get('search') || '');
    setSelectedTag(searchParams.get('tag') || '');
    setSelectedCountry(searchParams.get('country') || '');
    setSelectedCity(searchParams.get('city') || '');
    setSelectedWorkplaceType(searchParams.get('workplace_type') || '');
    setSelectedSource(searchParams.get('source') || '');
    setSelectedClosed(searchParams.get('is_closed') || '');
  }, [searchParams]);

  const filters: HomeFilterState = useMemo(() => ({
    search,
    selectedTag,
    selectedCountry,
    selectedCity,
    selectedWorkplaceType,
    selectedSource,
    selectedClosed,
  }), [search, selectedTag, selectedCountry, selectedCity, selectedWorkplaceType, selectedSource, selectedClosed]);

  return {
    router,
    filters,
    search,
    setSearch,
    selectedTag,
    setSelectedTag,
    selectedCountry,
    setSelectedCountry,
    selectedCity,
    setSelectedCity,
    selectedWorkplaceType,
    setSelectedWorkplaceType,
    selectedSource,
    setSelectedSource,
    selectedClosed,
    setSelectedClosed,
  };
}

function useMetadataFetchers(user: User | null | undefined) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allCountries, setAllCountries] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allSources, setAllSources] = useState<string[]>([]);
  const [queueRemaining, setQueueRemaining] = useState(0);

  const fetchTags = useCallback(async () => {
    if (!user) return;
    try {
      const data = await vacancyService.getTags();
      if (data) setAllTags(data);
    } catch (err) {
      console.error('Failed to fetch tags', err);
    }
  }, [user]);

  const fetchCountries = useCallback(async () => {
    if (!user) return;
    try {
      const data = await vacancyService.getCountries();
      if (data) setAllCountries(data);
    } catch (err) {
      console.error('Failed to fetch countries', err);
    }
  }, [user]);

  const fetchCities = useCallback(async (countryFilter: string) => {
    if (!user) return;
    try {
      const data = await vacancyService.getCities(countryFilter || undefined);
      if (data) setAllCities(data);
    } catch (err) {
      console.error('Failed to fetch cities', err);
    }
  }, [user]);

  const fetchSources = useCallback(async () => {
    if (!user) return;
    try {
      const data = await vacancyService.getSources();
      if (data) setAllSources(data);
    } catch (err) {
      console.error('Failed to fetch sources', err);
    }
  }, [user]);

  const fetchQueueStatus = useCallback(async () => {
    if (!user) return;
    try {
      const data = await queueService.getTasks();
      const count = extractQueueRemainingCount(data);
      if (count !== null) setQueueRemaining(count);
    } catch (err) {
      console.debug('Failed to fetch queue status', err);
    }
  }, [user]);

  return {
    allTags,
    allCountries,
    allCities,
    allSources,
    queueRemaining,
    setQueueRemaining,
    fetchTags,
    fetchCountries,
    fetchCities,
    fetchSources,
    fetchQueueStatus,
  };
}

export function useHomeVacanciesData({
  user,
  initialVacancies,
  initialColumns,
  fetchBoardInBackground,
  initialFilters,
  isFilteredSSR,
}: UseHomeVacanciesDataArgs) {
  const [vacancies, setVacancies] = useState<Vacancy[]>(
    Array.isArray(initialVacancies) ? initialVacancies : []
  );
  const [columns, setColumns] = useState<BoardColumn[]>(
    Array.isArray(initialColumns) ? initialColumns : []
  );

  const filterState = useHomeFilterState(initialFilters);
  const meta = useMetadataFetchers(user);

  const fetchVacancies = useCallback(async () => {
    if (!user) return;
    try {
      const data = await vacancyService.getVacancies();
      if (data) setVacancies(data);
    } catch (err) {
      console.error('Failed to fetch vacancies', err);
    }
  }, [user]);

  const fetchColumns = useCallback(async () => {
    if (!user) return;
    try {
      const data = await columnService.getColumns();
      if (data && data.length > 0) setColumns(data);
    } catch (err) {
      console.error('Failed to fetch columns', err);
    }
  }, [user]);

  // Initial effect for metadata and background full board loading
  useEffect(() => {
    if (!user) return;
    if (!Array.isArray(initialColumns) || initialColumns.length === 0) {
      fetchColumns();
    }
    meta.fetchTags();
    meta.fetchCountries();
    meta.fetchCities(filterState.selectedCountry);
    meta.fetchSources();
    meta.fetchQueueStatus();
  }, [user, initialColumns, fetchColumns]);

  // Two-stage hydration swap:
  // If SSR rendered a pre-filtered list OR fetchBoardInBackground was set (e.g. permalink page),
  // seamlessly fetch the full board in the background on client mount without query parameters!
  useEffect(() => {
    if (fetchBoardInBackground || isFilteredSSR || !Array.isArray(initialVacancies)) {
      fetchVacancies();
    }
  }, [fetchBoardInBackground, isFilteredSSR, initialVacancies, fetchVacancies]);

  // Discrete filter change handlers: router.push to browser history
  const handleCountryChange = useCallback(
    (country: string) => {
      trackEvent(EVENTS.FILTER_COUNTRY, { country: country || 'all' });
      filterState.setSelectedCountry(country);
      filterState.setSelectedCity('');
      meta.fetchCities(country);
      syncFiltersToHistory(
        {
          ...filterState.filters,
          selectedCountry: country,
          selectedCity: '',
        },
        filterState.router,
        false
      );
    },
    [filterState, meta]
  );

  const handleCityChange = useCallback(
    (city: string) => {
      filterState.setSelectedCity(city);
      syncFiltersToHistory(
        {
          ...filterState.filters,
          selectedCity: city,
        },
        filterState.router,
        false
      );
    },
    [filterState]
  );

  const handleWorkplaceChange = useCallback(
    (wp: string) => {
      filterState.setSelectedWorkplaceType(wp);
      syncFiltersToHistory(
        {
          ...filterState.filters,
          selectedWorkplaceType: wp,
        },
        filterState.router,
        false
      );
    },
    [filterState]
  );

  const handleSourceChange = useCallback(
    (src: string) => {
      filterState.setSelectedSource(src);
      syncFiltersToHistory(
        {
          ...filterState.filters,
          selectedSource: src,
        },
        filterState.router,
        false
      );
    },
    [filterState]
  );

  const handleClosedChange = useCallback(
    (cl: string) => {
      filterState.setSelectedClosed(cl);
      syncFiltersToHistory(
        {
          ...filterState.filters,
          selectedClosed: cl,
        },
        filterState.router,
        false
      );
    },
    [filterState]
  );

  const handleTagChange = useCallback(
    (tag: string) => {
      filterState.setSelectedTag(tag);
      syncFiltersToHistory(
        {
          ...filterState.filters,
          selectedTag: tag,
        },
        filterState.router,
        false
      );
    },
    [filterState]
  );

  // Search input handler: router.replace in history to not pollute history stack
  const handleSearchChange = useCallback(
    (val: string) => {
      filterState.setSearch(val);
      syncFiltersToHistory(
        {
          ...filterState.filters,
          search: val,
        },
        filterState.router,
        true
      );
    },
    [filterState]
  );

  const resetAllFilters = useCallback(() => {
    trackEvent(EVENTS.FILTERS_RESET);
    filterState.setSelectedTag('');
    filterState.setSelectedCountry('');
    filterState.setSelectedCity('');
    filterState.setSelectedWorkplaceType('');
    filterState.setSelectedSource('');
    filterState.setSelectedClosed('');
    filterState.setSearch('');
    meta.fetchCities('');
    syncFiltersToHistory(
      {
        search: '',
        selectedTag: '',
        selectedCountry: '',
        selectedCity: '',
        selectedWorkplaceType: '',
        selectedSource: '',
        selectedClosed: '',
      },
      filterState.router,
      false
    );
  }, [filterState, meta]);

  // Pure in-memory CSS-based hidden cards calculation
  const hiddenVacancyIds = useMemo(
    () => computeHiddenVacancyIds(vacancies, filterState.filters),
    [vacancies, filterState.filters]
  );

  return {
    vacancies,
    setVacancies,
    columns,
    setColumns,
    hiddenVacancyIds,
    ...filterState,
    ...meta,
    fetchVacancies,
    fetchColumns,
    handleCountryChange,
    handleCityChange,
    handleWorkplaceChange,
    handleSourceChange,
    handleClosedChange,
    handleTagChange,
    handleSearchChange,
    resetAllFilters,
  };
}
