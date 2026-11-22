import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type { ExtensionChangelog } from '../utils/extension';

export interface BackendExtensionStatus {
  active?: boolean;
  extension_id?: string | null;
  last_known_version?: string | null;
}

export class ExtensionApiService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getChangelog(): Promise<ExtensionChangelog> {
    return this.client.get<ExtensionChangelog>('/api/v2/extension/changelog');
  }

  getStatus(): Promise<BackendExtensionStatus> {
    return this.client.get<BackendExtensionStatus>('/api/v2/extension/status');
  }
}

export const extensionApiService = new ExtensionApiService(defaultApiClient);
