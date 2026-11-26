import type { ApiErrorDetail, RequestOptions } from './apiClient.types';

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;
  readonly data?: unknown;

  constructor(message: string, status: number, detail?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.data = data;
  }
}

function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null> | undefined,
): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

function serializeRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (typeof body === 'string') {
    return body;
  }
  return JSON.stringify(body);
}

async function parseResponseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as unknown as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

async function handleResponseError(res: Response): Promise<never> {
  let detail: string | undefined;
  let data: unknown;
  try {
    data = await res.json();
    const errorData = data as ApiErrorDetail;
    detail = errorData.detail || errorData.message || errorData.error;
  } catch {
    /* ignore json parse error */
  }
  const message = detail ? detail : `Request failed with status ${res.status}`;
  throw new ApiError(message, res.status, detail, data);
}

function resolveHeaders(initHeaders: HeadersInit | undefined, hasBody: boolean): Headers {
  const headers = new Headers(initHeaders);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

function shouldAttemptSilentRefresh(path: string): boolean {
  if (path.includes('/auth/refresh')) return false;
  if (path.includes('/auth/logout')) return false;
  if (path.includes('/auth/dev-login')) return false;
  if (path.includes('/auth/me')) return false;
  return true;
}

let activeRefreshPromise: Promise<boolean> | null = null;

function executeSilentTokenRefresh(): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }
  activeRefreshPromise = fetch('/api/v2/auth/refresh', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      activeRefreshPromise = null;
    });

  return activeRefreshPromise;
}

async function fetchWithAuthRetry(url: string, path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status !== 401 || !shouldAttemptSilentRefresh(path)) {
    return res;
  }
  const refreshed = await executeSilentTokenRefresh();
  return refreshed ? fetch(url, init) : res;
}

export class ApiClient {
  async request<T>(path: string, options?: RequestOptions): Promise<T> {
    const qs = buildQueryString(options?.params);
    const url = `${path}${qs}`;
    const body = serializeRequestBody(options?.body);
    const headers = resolveHeaders(options?.headers, Boolean(body));

    const init: RequestInit = {
      credentials: 'same-origin',
      ...options,
      headers,
      body,
    };

    const res = await fetchWithAuthRetry(url, path, init);
    if (!res.ok) {
      await handleResponseError(res);
    }
    return parseResponseBody<T>(res);
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
