'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { trackEvent, EVENTS } from '../utils/analytics';
import type { User, Vacancy, BoardColumn, QueueTask } from '../types/models';
import type { HomeFilterState } from './homeFilterHelpers';
import { vacancyService } from '../services/vacancyService';
import type { VacancyFilterParams } from '../services/vacancy.types';
import { columnService } from '../services/columnService';
import { queueService } from '../services/queueService';

export interface UseHomeVacanciesDataArgs {
  user: User | null | undefined;
  initialVacancies: Vacancy[] | undefined;
  initialColumns: BoardColumn[] | undefined;
  fetchBoardInBackground: boolean;
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

function useHomeFilterState() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedWorkplaceType, setSelectedWorkplaceType] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedClosed, setSelectedClosed] = useState('');

  const filters: HomeFilterState = {
    search,
    selectedTag,
    selectedCountry,
    selectedCity,
    selectedWorkplaceType,
    selectedSource,
    selectedClosed,
  };

  return {
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

function useHomeVacanciesEffects({
  user,
  initialColumns,
  initialVacancies,
  fetchBoardInBackground,
  selectedCountry,
  fetchColumns,
  fetchVacancies,
  fetchTags,
  fetchCountries,
  fetchCities,
  fetchSources,
  fetchQueueStatus,
  vacancyRequest,
}: {
  user: User | null | undefined;
  initialColumns: BoardColumn[] | undefined;
  initialVacancies: Vacancy[] | undefined;
  fetchBoardInBackground: boolean;
  selectedCountry: string;
  fetchColumns: () => void;
  fetchVacancies: () => void;
  fetchTags: () => void;
  fetchCountries: () => void;
  fetchCities: (c: string) => void;
  fetchSources: () => void;
  fetchQueueStatus: () => void;
  vacancyRequest: React.MutableRefObject<number>;
}) {
  useEffect(() => {
    if (!user) return;
    if (!Array.isArray(initialColumns) || initialColumns.length === 0) {
      fetchColumns();
    }
    fetchTags();
    fetchCountries();
    fetchCities(selectedCountry);
    fetchSources();
    fetchQueueStatus();
  }, [
    user,
    initialColumns,
    fetchColumns,
    fetchTags,
    fetchCountries,
    fetchCities,
    fetchSources,
    fetchQueueStatus,
    selectedCountry,
  ]);

  const hasMountedFilterRef = useRef(false);
  useEffect(() => {
    if (!hasMountedFilterRef.current) {
      hasMountedFilterRef.current = true;
      if (fetchBoardInBackground || !Array.isArray(initialVacancies)) {
        fetchVacancies();
      }
      return undefined;
    }
    const timer = setTimeout(fetchVacancies, 150);
    return () => {
      clearTimeout(timer);
      vacancyRequest.current += 1;
    };
  }, [fetchVacancies, fetchBoardInBackground, initialVacancies, vacancyRequest]);
}

function toOptionalFilter(val: string): string | undefined {
  const trimmed = val.trim();
  return trimmed ? trimmed : undefined;
}

function buildVacancyFilterParams(f: HomeFilterState): VacancyFilterParams {
  return {
    search: toOptionalFilter(f.search),
    tag: toOptionalFilter(f.selectedTag),
    country: toOptionalFilter(f.selectedCountry),
    city: toOptionalFilter(f.selectedCity),
    workplace_type: toOptionalFilter(f.selectedWorkplaceType),
    source: toOptionalFilter(f.selectedSource),
    is_closed: toOptionalFilter(f.selectedClosed),
  };
}

export function useHomeVacanciesData({
  user,
  initialVacancies,
  initialColumns,
  fetchBoardInBackground,
}: UseHomeVacanciesDataArgs) {
  const [vacancies, setVacancies] = useState<Vacancy[]>(Array.isArray(initialVacancies) ? initialVacancies : []);
  const [columns, setColumns] = useState<BoardColumn[]>(Array.isArray(initialColumns) ? initialColumns : []);
  const filterState = useHomeFilterState();
  const meta = useMetadataFetchers(user);

  const vacancyRequest = useRef(0);
  const fetchVacancies = useCallback(async () => {
    const requestId = ++vacancyRequest.current;
    if (!user) return;
    try {
      const params = buildVacancyFilterParams(filterState.filters);
      const data = await vacancyService.getVacancies(params);
      if (requestId === vacancyRequest.current && data) setVacancies(data);
    } catch (err) {
      console.error('Failed to fetch vacancies', err);
    }
  }, [user, filterState.filters]);

  const fetchColumns = useCallback(async () => {
    if (!user) return;
    try {
      const data = await columnService.getColumns();
      if (data && data.length > 0) setColumns(data);
    } catch (err) {
      console.error('Failed to fetch columns', err);
    }
  }, [user]);

  const handleCountryChange = useCallback(
    (country: string) => {
      trackEvent(EVENTS.FILTER_COUNTRY, { country: country || 'all' });
      filterState.setSelectedCountry(country);
      filterState.setSelectedCity('');
      meta.fetchCities(country);
    },
    [filterState, meta]
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
  }, [filterState, meta]);

  useHomeVacanciesEffects({
    user, initialColumns, initialVacancies, fetchBoardInBackground,
    selectedCountry: filterState.selectedCountry,
    fetchColumns, fetchVacancies,
    fetchTags: meta.fetchTags, fetchCountries: meta.fetchCountries,
    fetchCities: meta.fetchCities, fetchSources: meta.fetchSources,
    fetchQueueStatus: meta.fetchQueueStatus, vacancyRequest,
  });

  return { vacancies, setVacancies, columns, setColumns, ...filterState, ...meta, fetchVacancies, fetchColumns, handleCountryChange, resetAllFilters };
}
