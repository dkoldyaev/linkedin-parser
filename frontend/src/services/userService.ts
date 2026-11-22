import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type { User } from '../types/models';

export class UserService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getUsers(): Promise<User[]> {
    return this.client.get<User[]>('/api/v2/users');
  }

  updateFeatureFlags(userId: number, featureFlags: string[]): Promise<void> {
    return this.client.put<void>(`/api/v2/users/${userId}/feature-flags`, {
      feature_flags: featureFlags,
    });
  }
}

export const userService = new UserService(defaultApiClient);
