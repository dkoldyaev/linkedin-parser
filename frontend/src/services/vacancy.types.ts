import type { BatchImportResult } from '../components/BatchImportResultView';
import type { DuplicateVacancyItem } from '../components/BatchDuplicateWarningView';

export interface VacancyFilterParams {
  search?: string;
  tag?: string;
  country?: string;
  city?: string;
  workplace_type?: string;
  source?: string;
  is_closed?: string | boolean;
  meta_only?: string | boolean;
  [key: string]: string | number | boolean | null | undefined;
}

export interface VacancyReorderItem {
  id: number;
  order: number;
}

export interface BatchDuplicateCheckResponse {
  has_duplicates?: boolean;
  duplicates?: DuplicateVacancyItem[];
  requires_extension?: boolean;
}

export type { BatchImportResult, DuplicateVacancyItem };
