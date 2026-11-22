import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type { BoardColumn, ColumnCreatePayload, ColumnUpdatePayload } from './column.types';

export class ColumnService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getColumns(): Promise<BoardColumn[]> {
    return this.client.get<BoardColumn[]>('/api/v2/columns');
  }

  createColumn(payload: ColumnCreatePayload): Promise<BoardColumn[]> {
    return this.client.post<BoardColumn[]>('/api/v2/columns', payload);
  }

  updateColumn(id: string, payload: ColumnUpdatePayload): Promise<BoardColumn[]> {
    return this.client.patch<BoardColumn[]>(`/api/v2/columns/${encodeURIComponent(id)}`, payload);
  }

  deleteColumn(id: string, migrateTo: string): Promise<BoardColumn[]> {
    const url = `/api/v2/columns/${encodeURIComponent(id)}`;
    return this.client.delete<BoardColumn[]>(url, {
      params: { migrate_to: migrateTo },
    });
  }

  reorderColumns(columns: BoardColumn[]): Promise<BoardColumn[]> {
    return this.client.put<BoardColumn[]>('/api/v2/columns/order', { columns });
  }
}

export const columnService = new ColumnService(defaultApiClient);
