import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type { QueueTask } from '../types/models';

export class QueueService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getTasks(): Promise<QueueTask[]> {
    return this.client.get<QueueTask[]>('/api/v2/queue/links');
  }

  cancelTask(taskId: string | number): Promise<void> {
    return this.client.delete<void>(`/api/v2/queue/links/${encodeURIComponent(taskId)}`);
  }

  sync(): Promise<void> {
    return this.client.post<void>('/api/v2/queue/sync', undefined, { credentials: 'include' });
  }
}

export const queueService = new QueueService(defaultApiClient);
