import { ApiClient, apiClient as defaultApiClient } from './apiClient';
import type { AuthConfig, DevLoginPayload, DevLoginResponse, User } from './auth.types';

export class AuthService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  getMe(): Promise<User> {
    return this.client.get<User>('/api/v2/auth/me');
  }

  getConfig(): Promise<AuthConfig> {
    return this.client.get<AuthConfig>('/api/v2/auth/config');
  }

  devLogin(payload: DevLoginPayload): Promise<DevLoginResponse> {
    return this.client.post<DevLoginResponse>('/api/v2/auth/dev-login', payload);
  }

  logout(): Promise<void> {
    return this.client.post<void>('/api/v2/auth/logout');
  }
}

export const authService = new AuthService(defaultApiClient);
