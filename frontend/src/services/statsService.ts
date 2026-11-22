import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type { StatsApiData } from '../views/statsHelpers';

export class StatsService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getStats(): Promise<StatsApiData> {
    return this.client.get<StatsApiData>('/api/v2/stats');
  }
}

export const statsService = new StatsService(defaultApiClient);
