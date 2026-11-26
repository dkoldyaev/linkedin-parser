import '@testing-library/jest-dom/vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from './views/HomePage';
import { I18nProvider } from './i18n/I18nContext';
import { MemoryRouter } from 'react-router-dom';
import { OverlayProvider } from '@blueprint/ui-kit';

interface MockEventSourceInstance {
  url: string;
  opts?: EventSourceInit;
  onopen?: () => void;
  onerror?: () => void;
  onmessage?: (event: { data: string }) => void;
  close: () => void;
}

describe('Symfony /api/v2 + Mercure Realtime SPA Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  it('connects to Mercure via /api/v2/mercure-config, triggers /api/v2/queue/sync on open, and retains all cards (including closed) in memory', async () => {
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
          { status: 200 },
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
      <OverlayProvider>
        <MemoryRouter initialEntries={['/?is_closed=false']}>
          <I18nProvider initialLocale="ru" initialSalaryFormat="month" initialSalaryCurrency="">
            <HomePage
              user={{ id: 7, email: 'user7@test.local', is_anonymous: false }}
              initialColumns={cols}
              initialVacancies={[]}
            />
          </I18nProvider>
        </MemoryRouter>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(activeEventSource).not.toBeNull();
    });

    const es = activeEventSource as unknown as MockEventSourceInstance;
    expect(es.url).toContain('topic=vacancies%3A7');

    await act(async () => {
      es.onopen?.();
    });

    expect(requestedUrls.some((r) => r.url === '/api/v2/queue/sync' && r.method === 'POST')).toBe(
      true,
    );

    // 1. Open card arrives via Mercure -> visible on board
    await act(async () => {
      es.onmessage?.({
        data: JSON.stringify({
          type: 'vacancy_created',
          id: 777,
          title: 'Realtime Mercure Rust Engineer',
          company: 'Fly.io',
          url: 'https://linkedin.com/jobs/view/777',
          status: 'Еще не написал',
          is_closed: false,
          calculated_score: 95,
          ai_summary: 'Realtime created card via Mercure.',
        }),
      });
    });

    expect(screen.getByText('Realtime Mercure Rust Engineer')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();

    // 2. Compatibility analyzed updates score
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

    // 3. Card becomes closed while ?is_closed=false is active -> stays in DOM with display: none!
    await act(async () => {
      es.onmessage?.({
        data: JSON.stringify({
          type: 'vacancy_updated',
          id: 777,
          title: 'Realtime Mercure Rust Engineer',
          company: 'Fly.io',
          url: 'https://linkedin.com/jobs/view/777',
          status: 'Еще не написал',
          is_closed: true,
          calculated_score: 99,
        }),
      });
    });

    const cardEl = document.querySelector('[data-bp-card="true"][data-id="777"]') as HTMLElement;
    expect(cardEl).toBeInTheDocument();
    expect(cardEl.style.display).toBe('none');
  });
});
