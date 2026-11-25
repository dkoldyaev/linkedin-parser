import { describe, it, expect } from 'vitest';
import {
  matchesFilters,
  computeHiddenVacancyIds,
  defaultFilterState,
} from './homeFilterHelpers';
import type { Vacancy } from '../types/models';

const mockVacancies: Vacancy[] = [
  {
    id: 1,
    title: 'Senior Python Developer',
    company: 'Acme Corp',
    location: 'Berlin, Germany',
    country: 'Germany',
    city: 'Berlin',
    workplace_type: 'remote',
    source: 'linkedin',
    is_closed: false,
    status: 'new',
    created_at: '2026-01-01',
    tags: ['Python', 'Django'],
  } as unknown as Vacancy,
  {
    id: 2,
    title: 'Frontend React Engineer',
    company: 'Tech Solutions',
    location: 'Paris, France',
    country: 'France',
    city: 'Paris',
    workplace_type: 'hybrid',
    source: 'indeed',
    is_closed: true,
    status: 'interview',
    created_at: '2026-01-02',
    tags: ['React', 'TypeScript'],
  } as unknown as Vacancy,
];

describe('homeFilterHelpers', () => {
  it('matches all when filters are empty', () => {
    expect(matchesFilters(mockVacancies[0], defaultFilterState)).toBe(true);
    expect(matchesFilters(mockVacancies[1], defaultFilterState)).toBe(true);

    const hidden = computeHiddenVacancyIds(mockVacancies, defaultFilterState);
    expect(hidden.size).toBe(0);

    const hiddenPartial = computeHiddenVacancyIds(mockVacancies, {});
    expect(hiddenPartial.size).toBe(0);
  });

  it('filters by country and city', () => {
    expect(matchesFilters(mockVacancies[0], { selectedCountry: 'Germany' })).toBe(true);
    expect(matchesFilters(mockVacancies[1], { selectedCountry: 'Germany' })).toBe(false);

    expect(matchesFilters(mockVacancies[0], { selectedCity: 'Berlin' })).toBe(true);
    expect(matchesFilters(mockVacancies[0], { selectedCity: 'Paris' })).toBe(false);
  });

  it('filters by workplace_type', () => {
    expect(matchesFilters(mockVacancies[0], { selectedWorkplaceType: 'remote' })).toBe(true);
    expect(matchesFilters(mockVacancies[1], { selectedWorkplaceType: 'remote' })).toBe(false);
  });

  it('filters by source and is_closed', () => {
    expect(matchesFilters(mockVacancies[0], { selectedSource: 'linkedin' })).toBe(true);
    expect(matchesFilters(mockVacancies[1], { selectedSource: 'linkedin' })).toBe(false);

    expect(matchesFilters(mockVacancies[0], { selectedClosed: 'false' })).toBe(true);
    expect(matchesFilters(mockVacancies[1], { selectedClosed: 'false' })).toBe(false);
    expect(matchesFilters(mockVacancies[1], { selectedClosed: 'true' })).toBe(true);
  });

  it('filters by search term across title and company', () => {
    expect(matchesFilters(mockVacancies[0], { search: 'python' })).toBe(true);
    expect(matchesFilters(mockVacancies[0], { search: 'acme' })).toBe(true);
    expect(matchesFilters(mockVacancies[1], { search: 'python' })).toBe(false);
    expect(matchesFilters(mockVacancies[1], { search: 'react' })).toBe(true);
  });

  it('filters by tag', () => {
    expect(matchesFilters(mockVacancies[0], { selectedTag: 'Django' })).toBe(true);
    expect(matchesFilters(mockVacancies[1], { selectedTag: 'Django' })).toBe(false);
  });

  it('correctly computes hidden vacancy IDs', () => {
    const hidden = computeHiddenVacancyIds(mockVacancies, { selectedCountry: 'Germany' });
    expect(hidden.has(1)).toBe(false); // Visible
    expect(hidden.has(2)).toBe(true); // Hidden
  });
});
