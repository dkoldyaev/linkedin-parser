import type { ApiKeyItem } from '../types/models';

export interface CreateApiKeyPayload {
  name: string;
  expires_in_days?: number | null;
}

export interface CreateApiKeyResponse {
  token?: string;
  key?: ApiKeyItem;
}

export type { ApiKeyItem };
