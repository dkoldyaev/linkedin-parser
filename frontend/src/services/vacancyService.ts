import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type {
  BatchDuplicateCheckResponse,
  BatchImportResult,
  VacancyFilterParams,
} from './vacancy.types';
import type { CompatibilityAnalysis, Vacancy, VacancyHistoryItem } from '../types/models';

export class VacancyService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getVacancies(filters?: VacancyFilterParams): Promise<Vacancy[]> {
    return this.client.get<Vacancy[]>('/api/v2/vacancies', { params: filters });
  }

  getVacancy(id: number): Promise<Vacancy> {
    return this.client.get<Vacancy>(`/api/v2/vacancies/${id}`);
  }

  patchDetail(id: number, payload: Partial<Vacancy> & Record<string, unknown>): Promise<Vacancy> {
    return this.client.patch<Vacancy>(`/api/v2/vacancies/${id}`, payload);
  }

  deleteVacancy(id: number): Promise<void> {
    return this.client.delete<void>(`/api/v2/vacancies/${id}`);
  }

  reorder(status: string, ids: number[], lane: number, movedId: number | null): Promise<Vacancy[]> {
    return this.client.post<Vacancy[]>('/api/v2/vacancies/reorder', {
      status,
      ids,
      lane,
      moved_id: movedId,
    });
  }

  getTags(): Promise<string[]> {
    return this.client.get<string[]>('/api/v2/tags');
  }

  getCountries(): Promise<string[]> {
    return this.client.get<string[]>('/api/v2/countries');
  }

  getCities(country?: string): Promise<string[]> {
    const params = country ? { country } : undefined;
    return this.client.get<string[]>('/api/v2/cities', { params });
  }

  getSources(): Promise<string[]> {
    return this.client.get<string[]>('/api/v2/sources');
  }

  reparse(id: number): Promise<void> {
    return this.client.post<void>(`/api/v2/vacancies/${id}/reparse`);
  }

  reparseAll(): Promise<void> {
    return this.client.post<void>('/api/v2/vacancies/reparse_all');
  }

  getHistory(id: number): Promise<VacancyHistoryItem[]> {
    return this.client.get<VacancyHistoryItem[]>(`/api/v2/vacancies/${id}/history`);
  }

  updateHistoryComment(
    vacancyId: number,
    historyId: number | string,
    comment: string | null,
  ): Promise<VacancyHistoryItem> {
    return this.client.patch<VacancyHistoryItem>(
      `/api/v2/vacancies/${vacancyId}/history/${historyId}`,
      { comment },
    );
  }

  getCompatibility(id: number): Promise<CompatibilityAnalysis> {
    return this.client.get<CompatibilityAnalysis>(`/api/v2/vacancies/${id}/compatibility`);
  }

  triggerCompatibility(id: number, force?: boolean): Promise<CompatibilityAnalysis> {
    const params = force ? { force: true } : undefined;
    return this.client.post<CompatibilityAnalysis>(
      `/api/v2/vacancies/${id}/compatibility`,
      undefined,
      { params },
    );
  }

  resummarize(id: number, language: string): Promise<Vacancy> {
    return this.client.post<Vacancy>(`/api/v2/vacancies/${id}/resummarize`, undefined, {
      params: { language },
    });
  }

  checkBatchDuplicates(urls: string[]): Promise<BatchDuplicateCheckResponse> {
    return this.client.post<BatchDuplicateCheckResponse>('/api/vacancies/batch/check-duplicates', {
      urls,
    });
  }

  batchImport(urls: string[], defaultTags: string[]): Promise<BatchImportResult> {
    return this.client.post<BatchImportResult>('/api/v2/vacancies/batch', {
      urls,
      default_tags: defaultTags,
    });
  }
}

export const vacancyService = new VacancyService(defaultApiClient);
