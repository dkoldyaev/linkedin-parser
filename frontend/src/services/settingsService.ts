import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type {
  ExchangeRatesResponse,
  RemoteSettingsData,
  SaveSettingsPayload,
} from './settings.types';

export class SettingsService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getSettings(): Promise<RemoteSettingsData> {
    return this.client.get<RemoteSettingsData>('/api/v2/settings');
  }

  saveSettings(payload: SaveSettingsPayload): Promise<void> {
    return this.client.post<void>('/api/v2/settings', payload);
  }

  getExchangeRates(): Promise<ExchangeRatesResponse> {
    return this.client.get<ExchangeRatesResponse>('/api/v2/exchange-rates');
  }
}

export const settingsService = new SettingsService(defaultApiClient);
