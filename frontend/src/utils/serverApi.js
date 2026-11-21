import { cookies, headers } from 'next/headers';

function getBackendUrl() {
  const backendUrl = process.env.BACKEND_INTERNAL_URL;
  if (!backendUrl || backendUrl.trim() === '') {
    throw new Error('Fatal configuration error: BACKEND_INTERNAL_URL environment variable is required and not set.');
  }
  return backendUrl.replace(/\/+$/, '');
}

export async function fetchServerApi(endpoint, options) {
  const backendUrl = getBackendUrl();
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  const cookieHeader = cookieStore.toString();
  const acceptLanguage = headerStore.get('accept-language');
  const opts = options || {};

  const reqHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(acceptLanguage ? { 'Accept-Language': acceptLanguage } : {}),
    ...(opts.headers ? opts.headers : {}),
  };

  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${backendUrl}${normalizedPath}`;

  try {
    return await fetch(url, {
      ...opts,
      cache: 'no-store',
      headers: reqHeaders,
    });
  } catch (err) {
    console.error(`fetchServerApi error for ${url}:`, err);
    return null;
  }
}
