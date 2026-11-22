import type { User } from '../types/models';

export interface AuthConfig {
  google_configured: boolean;
  dev_mode: boolean;
}

export interface DevLoginPayload {
  name: string;
  email: string;
}

export interface DevLoginResponse {
  user: User;
}

export type { User };
