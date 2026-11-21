import { NextResponse } from 'next/server';

function getBackendUrl() {
  const backendUrl = process.env.BACKEND_INTERNAL_URL;
  if (!backendUrl || backendUrl.trim() === '') {
    throw new Error('Fatal configuration error: BACKEND_INTERNAL_URL environment variable is required and not set.');
  }
  return backendUrl.replace(/\/+$/, '');
}

function isAccessTokenValid(rawToken) {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim() === '') {
    return false;
  }
  const parts = rawToken.split('.');
  if (parts.length !== 3) {
    return false;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    if (typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      // Treat token expiring within 5 seconds as expired
      return payload.exp > nowSec + 5;
    }
    return true;
  } catch {
    return false;
  }
}

function mergeCookiesWithSetCookieHeaders(existingCookieHeader, setCookieHeaders) {
  const cookieMap = new Map();

  if (existingCookieHeader) {
    for (const pair of existingCookieHeader.split(';')) {
      const trimmed = pair.trim();
      if (!trimmed) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const name = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        cookieMap.set(name, value);
      }
    }
  }

  for (const sc of setCookieHeaders) {
    const firstPart = sc.split(';')[0].trim();
    const eqIdx = firstPart.indexOf('=');
    if (eqIdx > 0) {
      const name = firstPart.slice(0, eqIdx).trim();
      const value = firstPart.slice(eqIdx + 1).trim();
      if (value === 'deleted' || sc.toLowerCase().includes('max-age=0')) {
        cookieMap.delete(name);
      } else {
        cookieMap.set(name, value);
      }
    }
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

export async function middleware(request) {
  const backendUrl = getBackendUrl();
  const accessTokenCookie = request.cookies.get('access_token');
  const rawAccessToken = accessTokenCookie ? accessTokenCookie.value : null;

  if (isAccessTokenValid(rawAccessToken)) {
    return NextResponse.next();
  }

  const incomingCookie = request.headers.get('cookie');
  const acceptLanguage = request.headers.get('accept-language');

  const authHeaders = {
    Accept: 'application/json',
    ...(incomingCookie ? { Cookie: incomingCookie } : {}),
    ...(acceptLanguage ? { 'Accept-Language': acceptLanguage } : {}),
  };

  try {
    const authRes = await fetch(`${backendUrl}/api/v2/auth/me`, {
      method: 'GET',
      headers: authHeaders,
      cache: 'no-store',
    });

    const setCookieHeaders = typeof authRes.headers.getSetCookie === 'function'
      ? authRes.headers.getSetCookie()
      : (authRes.headers.get('set-cookie') ? [authRes.headers.get('set-cookie')] : []);

    if (setCookieHeaders.length === 0) {
      return NextResponse.next();
    }

    const updatedCookieHeader = mergeCookiesWithSetCookieHeaders(incomingCookie, setCookieHeaders);
    const requestHeaders = new Headers(request.headers);
    if (updatedCookieHeader) {
      requestHeaders.set('cookie', updatedCookieHeader);
    } else {
      requestHeaders.delete('cookie');
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    for (const sc of setCookieHeaders) {
      response.headers.append('set-cookie', sc);
    }

    return response;
  } catch (err) {
    console.error('Middleware session bootstrap failed:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|admin|bundles|admin-assets|_next/static|_next/image|\\.well-known|favicon\\.svg|icons\\.svg|extension\\.zip).*)',
  ],
};
