import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000';

export async function fetchServerApi(endpoint, options = {}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const headers = {
    'Content-Type': 'application/json',
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(options.headers || {}),
  };

  const url = `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    return res;
  } catch (err) {
    console.error(`fetchServerApi error for ${url}:`, err);
    return null;
  }
}
