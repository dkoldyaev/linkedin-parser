import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { fetchServerApi } from './utils/serverApi';

const mockCookies = vi.fn();
const mockHeaders = vi.fn();

vi.mock('next/headers', () => ({
  cookies: () => mockCookies(),
  headers: () => mockHeaders(),
}));

describe('Seam 2: Next.js Middleware Session Bootstrap, Silent Refresh & serverApi', () => {
  const originalEnv = process.env.BACKEND_INTERNAL_URL;

  beforeEach(() => {
    process.env.BACKEND_INTERNAL_URL = 'http://symfony.internal:8000';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.BACKEND_INTERNAL_URL = originalEnv;
  });

  it('fails fast when BACKEND_INTERNAL_URL is missing in middleware or fetchServerApi', async () => {
    delete process.env.BACKEND_INTERNAL_URL;
    const req = new NextRequest('http://localhost:3000/');
    await expect(middleware(req)).rejects.toThrow(/BACKEND_INTERNAL_URL/);
    await expect(fetchServerApi('/api/v2/vacancies', {})).rejects.toThrow(/BACKEND_INTERNAL_URL/);
  });

  it('creates an anonymous session via /api/v2/auth/me when no cookies exist, forwards Set-Cookie to browser and injects cookies into downstream SSR request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 42, is_anonymous: true, locale: 'ru' }), {
        status: 200,
        headers: [
          ['content-type', 'application/json'],
          ['set-cookie', 'access_token=jwt_anon_42; Path=/; HttpOnly'],
          ['set-cookie', 'refresh_token=rt_anon_42; Path=/api; HttpOnly'],
          ['set-cookie', 'mercureAuthorization=merc_42; Path=/.well-known/mercure; HttpOnly'],
        ],
      })
    );

    const req = new NextRequest('http://localhost:3000/', {
      headers: {
        'accept-language': 'ru-RU,ru;q=0.9',
      },
    });

    const res = await middleware(req);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('http://symfony.internal:8000/api/v2/auth/me');
    expect(calledInit.headers['Accept-Language']).toBe('ru-RU,ru;q=0.9');

    // Browser receives Set-Cookie headers
    const setCookies = res.headers.getSetCookie();
    expect(setCookies.some((c) => c.startsWith('access_token=jwt_anon_42'))).toBe(true);
    expect(setCookies.some((c) => c.startsWith('refresh_token=rt_anon_42'))).toBe(true);
    expect(setCookies.some((c) => c.startsWith('mercureAuthorization=merc_42'))).toBe(true);

    // Downstream SSR request headers receive the newly minted access_token in x-middleware-request-cookie
    const forwardedCookie = res.headers.get('x-middleware-request-cookie');
    expect(forwardedCookie).toContain('access_token=jwt_anon_42');
  });

  it('performs silent refresh via /api/v2/auth/me when access_token is expired but refresh_token is present', async () => {
    // Create an expired JWT (exp in the past)
    const expiredPayload = Buffer.from(JSON.stringify({ sub: 7, exp: Math.floor(Date.now() / 1000) - 120 })).toString('base64url');
    const expiredJwt = `eyJhbGciOiJIUzI1NiJ9.${expiredPayload}.sig`;

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 7, is_anonymous: false, locale: 'en' }), {
        status: 200,
        headers: [
          ['content-type', 'application/json'],
          ['set-cookie', 'access_token=jwt_refreshed_7; Path=/; HttpOnly'],
          ['set-cookie', 'refresh_token=rt_rotated_7; Path=/api; HttpOnly'],
        ],
      })
    );

    const req = new NextRequest('http://localhost:3000/vacancies/15', {
      headers: {
        cookie: `access_token=${expiredJwt}; refresh_token=valid_rt_7`,
        'accept-language': 'en-US,en;q=0.9',
      },
    });

    const res = await middleware(req);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, calledInit] = fetchSpy.mock.calls[0];
    expect(calledInit.headers.Cookie).toContain('refresh_token=valid_rt_7');

    const setCookies = res.headers.getSetCookie();
    expect(setCookies.some((c) => c.startsWith('access_token=jwt_refreshed_7'))).toBe(true);
    const forwardedCookie = res.headers.get('x-middleware-request-cookie');
    expect(forwardedCookie).toContain('access_token=jwt_refreshed_7');
  });

  it('skips /api/v2/auth/me in middleware when access_token is still valid', async () => {
    const validPayload = Buffer.from(JSON.stringify({ sub: 7, exp: Math.floor(Date.now() / 1000) + 1800 })).toString('base64url');
    const validJwt = `eyJhbGciOiJIUzI1NiJ9.${validPayload}.sig`;

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const req = new NextRequest('http://localhost:3000/', {
      headers: {
        cookie: `access_token=${validJwt}`,
      },
    });

    await middleware(req);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetchServerApi forwards Cookie and Accept-Language with cache: no-store', async () => {
    mockCookies.mockResolvedValue({
      toString: () => 'access_token=jwt_123',
    });
    mockHeaders.mockResolvedValue(
      new Headers({
        'accept-language': 'ru-RU,ru;q=0.9',
      })
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    );

    await fetchServerApi('/api/v2/vacancies', {});

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://symfony.internal:8000/api/v2/vacancies',
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.objectContaining({
          Cookie: 'access_token=jwt_123',
          'Accept-Language': 'ru-RU,ru;q=0.9',
        }),
      })
    );
  });
});
