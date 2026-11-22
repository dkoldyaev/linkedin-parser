import { trackEvent, EVENTS } from '../utils/analytics';
import type { Vacancy } from '../types/models';

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export interface HomeFilterState {
  search: string;
  selectedTag: string;
  selectedCountry: string;
  selectedCity: string;
  selectedWorkplaceType: string;
  selectedSource: string;
  selectedClosed: string;
}

export interface HomeMetadataLists {
  allTags: string[];
  allCountries: string[];
  allCities: string[];
  allSources: string[];
}

export interface HomeFilterHandlers {
  onCountryChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onWorkplaceChange: (val: string) => void;
  onSourceChange: (val: string) => void;
  onClosedChange: (val: string) => void;
}

function appendParamIfNonEmpty(params: URLSearchParams, key: string, value: string) {
  if (value !== '') {
    params.append(key, value);
  }
}

export function buildVacanciesUrl(filters: HomeFilterState): string {
  const params = new URLSearchParams();
  appendParamIfNonEmpty(params, 'search', filters.search.trim());
  appendParamIfNonEmpty(params, 'tag', filters.selectedTag);
  appendParamIfNonEmpty(params, 'country', filters.selectedCountry);
  appendParamIfNonEmpty(params, 'city', filters.selectedCity);
  appendParamIfNonEmpty(params, 'workplace_type', filters.selectedWorkplaceType);
  appendParamIfNonEmpty(params, 'source', filters.selectedSource);
  appendParamIfNonEmpty(params, 'is_closed', filters.selectedClosed);
  const query = params.toString();
  return query ? `/api/v2/vacancies?${query}` : '/api/v2/vacancies';
}

export function hasAnyNonSearchFilter(filters: HomeFilterState): boolean {
  const values = [
    filters.selectedTag,
    filters.selectedCountry,
    filters.selectedCity,
    filters.selectedWorkplaceType,
    filters.selectedSource,
    filters.selectedClosed,
  ];
  return values.some((val) => val !== '');
}

export function hasAnyActiveFilter(filters: HomeFilterState): boolean {
  if (filters.search.trim() !== '') return true;
  return hasAnyNonSearchFilter(filters);
}

export function shouldShowFilterBar(
  filters: HomeFilterState,
  meta: HomeMetadataLists
): boolean {
  const totalMetaItems =
    meta.allCountries.length +
    meta.allCities.length +
    meta.allSources.length +
    meta.allTags.length;
  if (totalMetaItems > 0) return true;
  return hasAnyNonSearchFilter(filters);
}

interface DynamicListSelectConfig {
  id: string;
  labelKey: string;
  items: string[];
  selectedValue: string;
  onChange: (val: string) => void;
  t: TranslateFn;
}

function buildDynamicListSelect(cfg: DynamicListSelectConfig) {
  if (cfg.items.length === 0 && !cfg.selectedValue) return null;
  const baseLabel = cfg.t(cfg.labelKey);
  const allLabel = `${baseLabel} [${cfg.items.length}]`;
  return {
    id: cfg.id,
    ariaLabel: baseLabel,
    placeholder: allLabel,
    value: cfg.selectedValue,
    options: [
      { value: '', label: allLabel },
      ...cfg.items.map((item) => ({ value: item, label: item })),
    ],
    onChange: cfg.onChange,
  };
}

function buildWorkplaceSelect(
  selectedWorkplaceType: string,
  onWorkplaceChange: (val: string) => void,
  t: TranslateFn
) {
  return {
    id: 'workplace',
    ariaLabel: t('nav.filter_all_workplaces'),
    placeholder: t('nav.filter_all_workplaces'),
    value: selectedWorkplaceType,
    options: [
      { value: '', label: t('nav.filter_all_workplaces') },
      { value: 'remote', label: t('workplace.remote') },
      { value: 'hybrid', label: t('workplace.hybrid') },
      { value: 'on-site', label: t('workplace.on-site') },
    ],
    onChange: (val: string) => {
      trackEvent(EVENTS.FILTER_WORKPLACE, { workplace_type: val || 'all' });
      onWorkplaceChange(val);
    },
  };
}

function buildClosedSelect(
  selectedClosed: string,
  onClosedChange: (val: string) => void,
  t: TranslateFn
) {
  return {
    id: 'closed',
    ariaLabel: t('nav.filter_all_closed'),
    placeholder: t('nav.filter_all_closed'),
    value: selectedClosed,
    options: [
      { value: '', label: t('nav.filter_all_closed') },
      { value: 'false', label: t('nav.filter_open') },
      { value: 'true', label: t('nav.filter_closed') },
    ],
    onChange: (val: string) => {
      trackEvent(EVENTS.FILTER_CLOSED, { is_closed: val || 'all' });
      onClosedChange(val);
    },
  };
}

export function buildFilterSelects(
  filters: HomeFilterState,
  meta: HomeMetadataLists,
  handlers: HomeFilterHandlers,
  t: TranslateFn
) {
  const countrySelect = buildDynamicListSelect({
    id: 'country',
    labelKey: 'nav.filter_all_countries',
    items: meta.allCountries,
    selectedValue: filters.selectedCountry,
    onChange: handlers.onCountryChange,
    t,
  });
  const citySelect = buildDynamicListSelect({
    id: 'city',
    labelKey: 'nav.filter_all_cities',
    items: meta.allCities,
    selectedValue: filters.selectedCity,
    onChange: (val: string) => {
      trackEvent(EVENTS.FILTER_CITY, { city: val || 'all' });
      handlers.onCityChange(val);
    },
    t,
  });
  const workplaceSelect = buildWorkplaceSelect(
    filters.selectedWorkplaceType,
    handlers.onWorkplaceChange,
    t
  );
  const sourceSelect = buildDynamicListSelect({
    id: 'source',
    labelKey: 'nav.filter_all_sources',
    items: meta.allSources,
    selectedValue: filters.selectedSource,
    onChange: (val: string) => {
      trackEvent(EVENTS.FILTER_SOURCE, { source: val || 'all' });
      handlers.onSourceChange(val);
    },
    t,
  });
  const closedSelect = buildClosedSelect(
    filters.selectedClosed,
    handlers.onClosedChange,
    t
  );

  return [countrySelect, citySelect, workplaceSelect, sourceSelect, closedSelect].filter(
    (item): item is NonNullable<typeof item> => item !== null
  );
}

export function matchesClosedFilter(vacancy: Vacancy, selectedClosed: string): boolean {
  if (selectedClosed === 'false') return !vacancy.is_closed;
  if (selectedClosed === 'true') return Boolean(vacancy.is_closed);
  return true;
}

export function upsertVacancyInList(list: Vacancy[], incoming: Vacancy): Vacancy[] {
  const exists = list.some((v) => v.id === incoming.id);
  if (exists) {
    return list.map((v) => (v.id === incoming.id ? incoming : v));
  }
  return [incoming, ...list];
}

export function applyVacancyUpdateToList(
  list: Vacancy[],
  updated: Vacancy,
  selectedClosed: string
): Vacancy[] {
  if (!matchesClosedFilter(updated, selectedClosed)) {
    return list.filter((v) => v.id !== updated.id);
  }
  return list.map((v) => (v.id === updated.id ? updated : v));
}
