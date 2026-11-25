import type { Vacancy } from '../types/models';

const IGNORED_META_VALUES = new Set(['null', 'none', 'n/a']);

function isMeaningfulMetaString(raw: string | null | undefined): raw is string {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (trimmed === '') return false;
  return !IGNORED_META_VALUES.has(trimmed.toLowerCase());
}

export function deriveAllTags(vacancies: Vacancy[]): string[] {
  const unique = new Set<string>();
  for (const vacancy of vacancies) {
    if (!Array.isArray(vacancy.tags)) continue;
    for (const tag of vacancy.tags) {
      const trimmed = String(tag).trim();
      if (trimmed !== '') {
        unique.add(trimmed);
      }
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

export function deriveAllCountries(vacancies: Vacancy[]): string[] {
  const unique = new Set<string>();
  for (const vacancy of vacancies) {
    if (isMeaningfulMetaString(vacancy.country)) {
      unique.add(vacancy.country.trim());
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

export function deriveAllCities(vacancies: Vacancy[], selectedCountry: string): string[] {
  const normalizedCountry = selectedCountry.trim().toLowerCase();
  const unique = new Set<string>();
  for (const vacancy of vacancies) {
    if (normalizedCountry !== '') {
      const vacancyCountry = (vacancy.country ? vacancy.country : '').trim().toLowerCase();
      if (vacancyCountry !== normalizedCountry) continue;
    }
    if (isMeaningfulMetaString(vacancy.city)) {
      unique.add(vacancy.city.trim());
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

export function deriveAllSources(vacancies: Vacancy[]): string[] {
  const unique = new Set<string>();
  for (const vacancy of vacancies) {
    if (isMeaningfulMetaString(vacancy.source)) {
      unique.add(vacancy.source.trim());
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}
