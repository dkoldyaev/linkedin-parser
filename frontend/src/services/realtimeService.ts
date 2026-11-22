import { ApiClient, apiClient as defaultApiClient } from './apiClient';

export interface MercureConfig {
  mercure_hub_url: string;
  mercure_topic: string;
}

export class RealtimeService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getConfig(): Promise<MercureConfig> {
    return this.client.get<MercureConfig>('/api/v2/mercure-config', { credentials: 'include' });
  }
}

export const realtimeService = new RealtimeService(defaultApiClient);
