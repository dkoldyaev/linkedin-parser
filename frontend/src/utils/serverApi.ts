import { cookies, headers } from 'next/headers';

function getBackendUrl(): string {
  const backendUrl = process.env.BACKEND_INTERNAL_URL;
  if (!backendUrl || backendUrl.trim() === '') {
    throw new Error('Fatal configuration error: BACKEND_INTERNAL_URL environment variable is required and not set.');
  }
  return backendUrl.replace(/\/+$/, '');
}

function buildServerRequestHeaders(
  cookieHeader: string,
  acceptLanguage: string | null,
  customHeaders?: HeadersInit
): Record<string, string> {
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (cookieHeader) {
    reqHeaders.Cookie = cookieHeader;
  }
  if (acceptLanguage) {
    reqHeaders['Accept-Language'] = acceptLanguage;
  }
  if (customHeaders && typeof customHeaders === 'object' && !Array.isArray(customHeaders) && !(customHeaders instanceof Headers)) {
    Object.assign(reqHeaders, customHeaders);
  }
  return reqHeaders;
}

export async function fetchServerApi(endpoint: string, options: RequestInit): Promise<Response | null> {
  const backendUrl = getBackendUrl();
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  const cookieHeader = cookieStore.toString();
  const acceptLanguage = headerStore.get('accept-language');
  const reqHeaders = buildServerRequestHeaders(cookieHeader, acceptLanguage, options.headers);

  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${backendUrl}${normalizedPath}`;

  try {
    return await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: reqHeaders,
    });
  } catch (err) {
    console.error(`fetchServerApi error for ${url}:`, err);
    return null;
  }
}
