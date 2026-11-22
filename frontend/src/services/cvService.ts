import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type { ServerCVData, SaveCVPayload } from './cvService.types';

export class CvService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async getCV(): Promise<ServerCVData | null> {
    try {
      return await this.client.get<ServerCVData>('/api/v2/cv');
    } catch {
      return null;
    }
  }

  saveCV(payload: SaveCVPayload): Promise<ServerCVData & { revision: number }> {
    return this.client.post<ServerCVData & { revision: number }>('/api/v2/cv', payload);
  }

  deleteCV(): Promise<void> {
    return this.client.delete<void>('/api/v2/cv');
  }
}

export const cvService = new CvService(defaultApiClient);
