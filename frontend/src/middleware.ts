import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  const backendUrl = process.env.BACKEND_INTERNAL_URL;
  if (!backendUrl || backendUrl.trim() === '') {
    throw new Error('Fatal configuration error: BACKEND_INTERNAL_URL environment variable is required and not set.');
  }
  return backendUrl.replace(/\/+$/, '');
}

function decodeBase64Json(base64Url: string): Record<string, unknown> | null {
  try {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(json);
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isAccessTokenValid(rawToken: string | null): boolean {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim() === '') {
    return false;
  }
  const parts = rawToken.split('.');
  if (parts.length !== 3) return false;

  const payload = decodeBase64Json(parts[1]);
  if (!payload) return false;

  if (typeof payload.exp === 'number') {
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp > nowSec + 5;
  }
  return true;
}

function parseExistingCookies(existingCookieHeader: string | null, cookieMap: Map<string, string>): void {
  if (!existingCookieHeader) return;
  for (const pair of existingCookieHeader.split(';')) {
    const trimmed = pair.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      cookieMap.set(trimmed.slice(0, eqIdx).trim(), trimmed.slice(eqIdx + 1).trim());
    }
  }
}

function applySetCookieHeaders(setCookieHeaders: string[], cookieMap: Map<string, string>): void {
  for (const sc of setCookieHeaders) {
    const firstPart = sc.split(';')[0].trim();
    const eqIdx = firstPart.indexOf('=');
    if (eqIdx <= 0) continue;
    const name = firstPart.slice(0, eqIdx).trim();
    const value = firstPart.slice(eqIdx + 1).trim();
    if (value === 'deleted' || sc.toLowerCase().includes('max-age=0')) {
      cookieMap.delete(name);
    } else {
      cookieMap.set(name, value);
    }
  }
}

function mergeCookiesWithSetCookieHeaders(
  existingCookieHeader: string | null,
  setCookieHeaders: string[]
): string {
  const cookieMap = new Map<string, string>();
  parseExistingCookies(existingCookieHeader, cookieMap);
  applySetCookieHeaders(setCookieHeaders, cookieMap);

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function buildAuthFetchHeaders(request: NextRequest): Record<string, string> {
  const incomingCookie = request.headers.get('cookie');
  const acceptLanguage = request.headers.get('accept-language');
  const authHeaders: Record<string, string> = { Accept: 'application/json' };
  if (incomingCookie) authHeaders.Cookie = incomingCookie;
  if (acceptLanguage) authHeaders['Accept-Language'] = acceptLanguage;
  return authHeaders;
}

function extractSetCookieHeaders(authRes: Response): string[] {
  if (typeof authRes.headers.getSetCookie === 'function') {
    return authRes.headers.getSetCookie();
  }
  const single = authRes.headers.get('set-cookie');
  return single ? [single] : [];
}

function buildForwardedNextResponse(
  request: NextRequest,
  incomingCookie: string | null,
  setCookieHeaders: string[]
): NextResponse {
  const updatedCookieHeader = mergeCookiesWithSetCookieHeaders(incomingCookie, setCookieHeaders);
  const requestHeaders = new Headers(request.headers);
  if (updatedCookieHeader) {
    requestHeaders.set('cookie', updatedCookieHeader);
  } else {
    requestHeaders.delete('cookie');
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  for (const sc of setCookieHeaders) {
    response.headers.append('set-cookie', sc);
  }
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const backendUrl = getBackendUrl();
  const accessTokenCookie = request.cookies.get('access_token');
  const rawAccessToken = accessTokenCookie ? accessTokenCookie.value : null;

  if (isAccessTokenValid(rawAccessToken)) {
    return NextResponse.next();
  }

  const incomingCookie = request.headers.get('cookie');
  const authHeaders = buildAuthFetchHeaders(request);

  try {
    const authRes = await fetch(`${backendUrl}/api/v2/auth/me`, {
      method: 'GET',
      headers: authHeaders,
      cache: 'no-store',
    });

    const setCookieHeaders = extractSetCookieHeaders(authRes);
    if (setCookieHeaders.length === 0) {
      return NextResponse.next();
    }

    return buildForwardedNextResponse(request, incomingCookie, setCookieHeaders);
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
