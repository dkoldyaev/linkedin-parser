import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import nextConfig from '../next.config.mjs';
import { I18nProvider } from './i18n/I18nContext';
import HomePage from './views/HomePage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

interface MockEventSourceInstance {
  url: string;
  opts?: EventSourceInit;
  onopen?: () => void;
  onerror?: () => void;
  onmessage?: (event: { data: string }) => void;
  close: () => void;
}

describe('Seam 4: Next.js Rewrites Proxy & Symfony /api/v2 + Mercure Realtime Integration', () => {
  const originalEnv = process.env.BACKEND_INTERNAL_URL;

  beforeEach(() => {
    process.env.BACKEND_INTERNAL_URL = 'http://app:8000';
    vi.clearAllMocks();
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    process.env.BACKEND_INTERNAL_URL = originalEnv;
  });

  it('configures Next.js rewrites to proxy /api/*, /admin*, /bundles/*, /admin-assets/*, /extension.zip and /.well-known/* to BACKEND_INTERNAL_URL and fails fast if missing', async () => {
    const rewritesFn = nextConfig.rewrites as () => Promise<Array<{ source: string; destination: string }>>;
    const rules = await rewritesFn();
    const sources = rules.map((r) => r.source);

    expect(sources).toContain('/api/:path*');
    expect(sources).toContain('/admin');
    expect(sources).toContain('/admin/:path*');
    expect(sources).toContain('/bundles/:path*');
    expect(sources).toContain('/admin-assets/:path*');
    expect(sources).toContain('/extension.zip');
    expect(sources).toContain('/.well-known/:path*');

    const apiRule = rules.find((r) => r.source === '/api/:path*');
    expect(apiRule?.destination).toBe('http://app:8000/api/:path*');

    delete process.env.BACKEND_INTERNAL_URL;
    await expect(rewritesFn()).rejects.toThrow(/BACKEND_INTERNAL_URL/);
  });

  it('connects to Mercure via /api/v2/mercure-config, triggers /api/v2/queue/sync on open, and updates board state on Symfony Mercure events', async () => {
    let activeEventSource: MockEventSourceInstance | null = null;
    globalThis.EventSource = class implements MockEventSourceInstance {
      url: string;
      opts?: EventSourceInit;
      onopen?: () => void;
      onerror?: () => void;
      onmessage?: (event: { data: string }) => void;
      constructor(url: string | URL, opts?: EventSourceInit) {
        this.url = String(url);
        this.opts = opts;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        activeEventSource = this;
      }
      close() {}
    } as unknown as typeof EventSource;

    const requestedUrls: Array<{ url: string; method: string }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const strUrl = String(url);
      requestedUrls.push({ url: strUrl, method: init?.method || 'GET' });
      if (strUrl.includes('/api/v2/mercure-config')) {
        return new Response(
          JSON.stringify({
            mercure_hub_url: '/.well-known/mercure',
            mercure_topic: 'vacancies:7',
          }),
          { status: 200 }
        );
      }
      if (strUrl.includes('/api/v2/queue/sync')) {
        return new Response(null, { status: 202 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const cols = [
      { id: 'Еще не написал', color: '#6366f1', has_lanes: false, is_base: true },
      { id: 'Отказ', color: '#ef4444', has_lanes: false, is_base: true },
    ];

    render(
      <I18nProvider initialLocale="ru" initialSalaryFormat="month" initialSalaryCurrency="">
        <HomePage
          user={{ id: 7, email: 'user7@test.local', is_anonymous: false }}
          initialColumns={cols}
          initialVacancies={[]}
        />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(activeEventSource).not.toBeNull();
    });

    const es = activeEventSource as unknown as MockEventSourceInstance;
    expect(es.url).toContain('topic=vacancies%3A7');

    // Simulate EventSource open -> triggers POST /api/v2/queue/sync
    await act(async () => {
      es.onopen?.();
    });

    expect(
      requestedUrls.some((r) => r.url === '/api/v2/queue/sync' && r.method === 'POST')
    ).toBe(true);

    // Simulate Symfony Mercure vacancy_created event (root payload format)
    await act(async () => {
      es.onmessage?.({
        data: JSON.stringify({
          type: 'vacancy_created',
          id: 777,
          title: 'Realtime Mercure Rust Engineer',
          company: 'Fly.io',
          url: 'https://linkedin.com/jobs/view/777',
          status: 'Еще не написал',
          calculated_score: 95,
          ai_summary: 'Realtime created card via Mercure.',
        }),
      });
    });

    expect(screen.getByText('Realtime Mercure Rust Engineer')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();

    // Simulate compatibility_analyzed event with calculated_score
    await act(async () => {
      es.onmessage?.({
        data: JSON.stringify({
          type: 'compatibility_analyzed',
          vacancy_id: 777,
          calculated_score: 99,
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('99%')).toBeInTheDocument();
    });
  });
});
