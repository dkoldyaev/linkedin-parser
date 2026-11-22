export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export interface ApiErrorDetail {
  detail?: string;
  message?: string;
  error?: string;
}
