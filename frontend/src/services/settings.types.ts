import type { BoardColumn } from '../types/models';

export interface RemoteSettingsData {
  locale?: string;
  salary_display_format?: string;
  salary_target_currency?: string | null;
  columns?: BoardColumn[];
}

export interface SaveSettingsPayload {
  locale?: string;
  salary_display_format?: string;
  salary_target_currency?: string | null;
}

export interface ExchangeRatesResponse {
  rates?: Record<string, number>;
}
