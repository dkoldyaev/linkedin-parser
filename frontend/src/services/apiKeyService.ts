import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type { ApiKeyItem, CreateApiKeyPayload, CreateApiKeyResponse } from './apiKey.types';

export class ApiKeyService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getApiKeys(): Promise<ApiKeyItem[]> {
    return this.client.get<ApiKeyItem[]>('/api/v2/api-keys');
  }

  createApiKey(payload: CreateApiKeyPayload): Promise<CreateApiKeyResponse> {
    return this.client.post<CreateApiKeyResponse>('/api/v2/api-keys', payload);
  }

  revokeApiKey(id: string | number): Promise<void> {
    return this.client.delete<void>(`/api/v2/api-keys/${encodeURIComponent(id)}`);
  }
}

export const apiKeyService = new ApiKeyService(defaultApiClient);
