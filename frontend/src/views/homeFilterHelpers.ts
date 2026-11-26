import { EVENTS, trackEvent } from '../utils/analytics';
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

export const defaultFilterState: HomeFilterState = {
  search: '',
  selectedTag: '',
  selectedCountry: '',
  selectedCity: '',
  selectedWorkplaceType: '',
  selectedSource: '',
  selectedClosed: '',
};

export function hasAnyNonSearchFilter(filters: Partial<HomeFilterState> | undefined): boolean {
  if (!filters) return false;
  const values = [
    filters.selectedTag,
    filters.selectedCountry,
    filters.selectedCity,
    filters.selectedWorkplaceType,
    filters.selectedSource,
    filters.selectedClosed,
  ];
  return values.some((val) => typeof val === 'string' && val.trim() !== '');
}

export function hasAnyActiveFilter(filters: Partial<HomeFilterState> | undefined): boolean {
  if (!filters) return false;
  if (typeof filters.search === 'string' && filters.search.trim() !== '') return true;
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

function buildSelectOptionItems(items: string[], selectedValue: string): string[] {
  const trimmedSelected = selectedValue.trim();
  if (trimmedSelected === '' || items.includes(trimmedSelected)) {
    return items;
  }
  return [trimmedSelected, ...items];
}

function buildDynamicListSelect(cfg: DynamicListSelectConfig) {
  if (cfg.items.length === 0 && !cfg.selectedValue) return null;
  const baseLabel = cfg.t(cfg.labelKey);
  const allLabel = `${baseLabel} [${cfg.items.length}]`;
  const optionItems = buildSelectOptionItems(cfg.items, cfg.selectedValue);
  return {
    id: cfg.id,
    ariaLabel: baseLabel,
    placeholder: allLabel,
    value: cfg.selectedValue,
    options: [
      { value: '', label: allLabel },
      ...optionItems.map((item) => ({ value: item, label: item })),
    ],
    onChange: cfg.onChange,
  };
}

function buildWorkplaceSelect(
  selectedWorkplaceType: string,
  onWorkplaceChange: (val: string) => void,
  t: TranslateFn,
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
      trackEvent(EVENTS.FILTER_WORKPLACE, { workplace_type: val ? val : 'all' });
      onWorkplaceChange(val);
    },
  };
}

function buildClosedSelect(
  selectedClosed: string,
  onClosedChange: (val: string) => void,
  t: TranslateFn,
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
      trackEvent(EVENTS.FILTER_CLOSED, { is_closed: val ? val : 'all' });
      onClosedChange(val);
    },
  };
}

export function buildFilterSelects(
  filters: HomeFilterState,
  meta: HomeMetadataLists,
  handlers: HomeFilterHandlers,
  t: TranslateFn,
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
      trackEvent(EVENTS.FILTER_CITY, { city: val ? val : 'all' });
      handlers.onCityChange(val);
    },
    t,
  });
  const workplaceSelect = buildWorkplaceSelect(
    filters.selectedWorkplaceType,
    handlers.onWorkplaceChange,
    t,
  );
  const sourceSelect = buildDynamicListSelect({
    id: 'source',
    labelKey: 'nav.filter_all_sources',
    items: meta.allSources,
    selectedValue: filters.selectedSource,
    onChange: (val: string) => {
      trackEvent(EVENTS.FILTER_SOURCE, { source: val ? val : 'all' });
      handlers.onSourceChange(val);
    },
    t,
  });
  const closedSelect = buildClosedSelect(filters.selectedClosed, handlers.onClosedChange, t);

  return [countrySelect, citySelect, workplaceSelect, sourceSelect, closedSelect].filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
}

export function matchesClosedFilter(vacancy: Vacancy, selectedClosed: string): boolean {
  if (selectedClosed === 'false') return !vacancy.is_closed;
  if (selectedClosed === 'true') return Boolean(vacancy.is_closed);
  return true;
}

function matchesCaseInsensitiveField(
  fieldValue: string | null | undefined,
  filterValue: string | undefined,
): boolean {
  if (!filterValue || filterValue.trim() === '') return true;
  const actual = (fieldValue ? fieldValue : '').trim().toLowerCase();
  return actual === filterValue.trim().toLowerCase();
}

function matchesTagFilter(vacancy: Vacancy, selectedTag: string | undefined): boolean {
  if (!selectedTag || selectedTag.trim() === '') return true;
  const tags = Array.isArray(vacancy.tags) ? vacancy.tags : [];
  return tags.includes(selectedTag.trim());
}

function buildSearchableCardHaystack(vacancy: Vacancy): string {
  const parts: Array<string | null | undefined> = [
    vacancy.title,
    vacancy.company,
    vacancy.ai_summary,
    vacancy.location,
    vacancy.city,
    vacancy.country,
    vacancy.source,
    Array.isArray(vacancy.tags) ? vacancy.tags.join(' ') : '',
    Array.isArray(vacancy.tech_stack) ? vacancy.tech_stack.join(' ') : '',
  ];
  return parts
    .filter((p): p is string => typeof p === 'string' && p !== '')
    .join('\n')
    .toLowerCase();
}

function matchesSearchQuery(vacancy: Vacancy, search: string | undefined): boolean {
  if (!search || search.trim() === '') return true;
  const query = search.trim().toLowerCase();
  return buildSearchableCardHaystack(vacancy).includes(query);
}

function matchesSelectFilters(vacancy: Vacancy, filters: Partial<HomeFilterState>): boolean {
  const closedVal = filters.selectedClosed ? filters.selectedClosed : '';
  if (!matchesClosedFilter(vacancy, closedVal)) return false;
  if (!matchesTagFilter(vacancy, filters.selectedTag)) return false;
  if (!matchesCaseInsensitiveField(vacancy.country, filters.selectedCountry)) return false;
  if (!matchesCaseInsensitiveField(vacancy.city, filters.selectedCity)) return false;
  if (!matchesCaseInsensitiveField(vacancy.workplace_type, filters.selectedWorkplaceType))
    return false;
  return matchesCaseInsensitiveField(vacancy.source, filters.selectedSource);
}

export function matchesFilters(
  vacancy: Vacancy,
  filters: Partial<HomeFilterState> | undefined,
): boolean {
  if (!vacancy) return false;
  if (!filters) return true;
  if (!matchesSelectFilters(vacancy, filters)) return false;
  return matchesSearchQuery(vacancy, filters.search);
}

export function computeHiddenVacancyIds(
  vacancies: Vacancy[],
  filters: Partial<HomeFilterState> | undefined,
): Set<number> {
  if (!filters || !hasAnyActiveFilter(filters)) {
    return new Set<number>();
  }
  const hidden = new Set<number>();
  for (const v of vacancies) {
    if (!matchesFilters(v, filters)) {
      hidden.add(v.id);
    }
  }
  return hidden;
}

export function upsertVacancyInList(list: Vacancy[], incoming: Vacancy): Vacancy[] {
  const exists = list.some((v) => v.id === incoming.id);
  if (exists) {
    return list.map((v) => (v.id === incoming.id ? { ...v, ...incoming } : v));
  }
  return [incoming, ...list];
}

export function applyVacancyUpdateToList(list: Vacancy[], updated: Vacancy): Vacancy[] {
  return list.map((v) => (v.id === updated.id ? { ...v, ...updated } : v));
}
