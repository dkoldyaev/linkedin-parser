import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nContext';
import AppRouter from './AppRouter';
import type { Vacancy, BoardColumn, User } from './types/models';

const TEST_USER: User = {
  id: 1,
  email: 'dev@test.local',
  name: 'Dev Tester',
  is_anonymous: false,
  locale: 'ru',
};

const TEST_COLUMNS: BoardColumn[] = [
  { id: 'Еще не написал', color: '#6366f1', has_lanes: false, is_base: true },
  { id: 'Собеседование', color: '#d97706', has_lanes: true, is_base: false },
  { id: 'Отказ', color: '#ef4444', has_lanes: false, is_base: true },
];

const LIGHTWEIGHT_VACANCIES: Vacancy[] = [
  {
    id: 10,
    title: 'Senior Go Engineer',
    company: 'Stripe',
    url: 'https://linkedin.com/jobs/view/10',
    status: 'Еще не написал',
    country: 'Germany',
    city: 'Berlin',
    location: 'Berlin, Germany',
    workplace_type: 'remote',
    source: 'linkedin',
    is_closed: false,
    calculated_score: 91,
    ai_summary: 'Payment core in Go.',
    tech_stack: ['Go', 'PostgreSQL'],
    tags: ['fintech'],
  },
  {
    id: 20,
    title: 'Frontend React Architect',
    company: 'Figma',
    url: 'https://linkedin.com/jobs/view/20',
    status: 'Собеседование',
    country: 'Spain',
    city: 'Madrid',
    location: 'Madrid, Spain',
    workplace_type: 'hybrid',
    source: 'upwork',
    is_closed: true,
    calculated_score: 84,
    ai_summary: 'Canvas rendering in TypeScript.',
    tech_stack: ['React', 'WebGL'],
    tags: ['design'],
  },
];

function createDeferred<T>() {
  let resolve!: (val: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createSpaRouter(initialEntries: string[]) {
  return createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <I18nProvider initialLocale="ru" initialSalaryFormat="month" initialSalaryCurrency="">
            <AppRouter initialUser={TEST_USER} />
          </I18nProvider>
        ),
      },
    ],
    { initialEntries }
  );
}

describe('Pure Client SPA: Single Startup Load, URL Modal Routing, Skeletons, 404 & CSS display:none History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.EventSource = class {
      close() {}
    } as unknown as typeof EventSource;
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  it('loads GET /api/v2/vacancies strictly ONCE without filter query params even when booting with filters and navigating across SPA tabs', async () => {
    const vacancyListCalls: string[] = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith('/api/v2/vacancies') && !url.includes('/api/v2/vacancies/')) {
        vacancyListCalls.push(url);
        return new Response(JSON.stringify(LIGHTWEIGHT_VACANCIES), { status: 200 });
      }
      if (url === '/api/v2/columns') {
        return new Response(JSON.stringify(TEST_COLUMNS), { status: 200 });
      }
      if (url === '/api/v2/settings') {
        return new Response(JSON.stringify({ locale: 'ru', salary_display_format: 'month' }), {
          status: 200,
        });
      }
      if (url === '/api/v2/exchange-rates') {
        return new Response(JSON.stringify({ rates: {} }), { status: 200 });
      }
      if (url === '/api/v2/mercure-config') {
        return new Response(
          JSON.stringify({ mercure_hub_url: '/.well-known/mercure', mercure_topic: 'vacancies:1' }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const router = createSpaRouter(['/?country=Germany&workplace_type=remote']);
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Senior Go Engineer')).toBeInTheDocument();
    });

    // Strict check: called exactly ONCE and WITHOUT any query parameters!
    expect(vacancyListCalls).toEqual(['/api/v2/vacancies']);

    // Card 10 (Germany, remote) is visible; Card 20 (Spain, hybrid) stays in DOM with display: none
    const card10 = document.querySelector('[data-bp-card="true"][data-id="10"]') as HTMLElement;
    const card20 = document.querySelector('[data-bp-card="true"][data-id="20"]') as HTMLElement;
    expect(card10).toBeInTheDocument();
    expect(card20).toBeInTheDocument();
    expect(card10.style.display).toBe('');
    expect(card20.style.display).toBe('none');

    // Column 'Собеседование' has 1 card (#20) which is hidden via display:none -> must remain blank (no EmptyState)
    expect(screen.queryByText('Нет вакансий')).not.toBeInTheDocument();

    // Navigate to /about and back to / -> must NOT refetch /api/v2/vacancies
    await act(async () => {
      await router.navigate('/about');
    });
    await act(async () => {
      await router.navigate('/');
    });

    expect(screen.getByText('Senior Go Engineer')).toBeInTheDocument();
    expect(vacancyListCalls).toEqual(['/api/v2/vacancies']);
  });

  it('opens card with push URL, shows skeletons while fetching /api/v2/vacancies/:id, pushes / on close, and re-fetches via skeleton on Back/Forward (no cache)', async () => {
    let detailCallCount = 0;
    let pendingDetail = createDeferred<Response>();

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url === '/api/v2/vacancies') {
        return new Response(JSON.stringify(LIGHTWEIGHT_VACANCIES), { status: 200 });
      }
      if (url === '/api/v2/vacancies/10') {
        detailCallCount += 1;
        return pendingDetail.promise;
      }
      if (url === '/api/v2/vacancies/10/compatibility') {
        return new Response(JSON.stringify(null), { status: 200 });
      }
      if (url === '/api/v2/columns') {
        return new Response(JSON.stringify(TEST_COLUMNS), { status: 200 });
      }
      if (url === '/api/v2/mercure-config') {
        return new Response(
          JSON.stringify({ mercure_hub_url: '/.well-known/mercure', mercure_topic: 'vacancies:1' }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const router = createSpaRouter(['/?country=Germany']);
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('Senior Go Engineer')).toBeInTheDocument();
    });

    // 1. Click card #10 -> URL pushes to /vacancies/10?country=Germany immediately, skeletons shown!
    fireEvent.click(screen.getByText('Senior Go Engineer'));

    expect(router.state.location.pathname).toBe('/vacancies/10');
    expect(router.state.location.search).toBe('?country=Germany');
    expect(screen.getByTestId('vacancy-company-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('vacancy-history-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('vacancy-notes-skeleton')).toBeInTheDocument();
    expect(detailCallCount).toBe(1);

    // 2. Resolve detail request -> skeletons disappear, loaded details appear
    await act(async () => {
      pendingDetail.resolve(
        new Response(
          JSON.stringify({
            ...LIGHTWEIGHT_VACANCIES[0],
            company_info: 'Global fintech infrastructure leader',
            description: 'Deep distributed systems role in Go',
            notes: 'Referral submitted via Alex',
            history: [
              {
                id: 501,
                from_status: null,
                to_status: 'Еще не написал',
                comment: 'Initial import comment',
                created_at: '2026-11-20T10:00:00Z',
              },
            ],
          }),
          { status: 200 }
        )
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('vacancy-company-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText('Global fintech infrastructure leader')).toBeInTheDocument();
      expect(screen.getByText('Initial import comment')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Referral submitted via Alex')).toBeInTheDocument();
    });

    // 3. Close modal via Close button -> pushes /?country=Germany (preserving query params!)
    const closeButtons = screen.getAllByRole('button', { name: /закрыть|close/i });
    fireEvent.click(closeButtons[closeButtons.length - 1]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
      expect(router.state.location.search).toBe('?country=Germany');
      expect(screen.queryByText('Global fintech infrastructure leader')).not.toBeInTheDocument();
    });

    // 4. Browser BACK -> returns to /vacancies/10?country=Germany, NO detail cache: shows skeletons again & fetches fresh!
    pendingDetail = createDeferred<Response>();
    await act(async () => {
      await router.navigate(-1);
    });

    expect(router.state.location.pathname).toBe('/vacancies/10');
    expect(detailCallCount).toBe(2);
    expect(screen.getByTestId('vacancy-company-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Global fintech infrastructure leader')).not.toBeInTheDocument();

    await act(async () => {
      pendingDetail.resolve(
        new Response(
          JSON.stringify({
            ...LIGHTWEIGHT_VACANCIES[0],
            company_info: 'Refreshed company bio on Back',
            notes: 'Updated note',
            history: [],
          }),
          { status: 200 }
        )
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Refreshed company bio on Back')).toBeInTheDocument();
    });

    // 5. Browser FORWARD -> closes modal automatically back to /?country=Germany
    await act(async () => {
      await router.navigate(1);
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
      expect(screen.queryByText('Refreshed company bio on Back')).not.toBeInTheDocument();
    });
  });

  it('supports direct link /vacancies/:id open and renders 404 NotFoundPage on missing/foreign vacancy without changing URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url === '/api/v2/vacancies') {
        return new Response(JSON.stringify(LIGHTWEIGHT_VACANCIES), { status: 200 });
      }
      if (url === '/api/v2/vacancies/20') {
        return new Response(
          JSON.stringify({
            ...LIGHTWEIGHT_VACANCIES[1],
            company_info: 'Collaborative design platform',
            notes: 'Direct permalink note',
            history: [],
          }),
          { status: 200 }
        );
      }
      if (url === '/api/v2/vacancies/9999') {
        return new Response(JSON.stringify({ detail: 'Not found' }), { status: 404 });
      }
      if (url === '/api/v2/columns') {
        return new Response(JSON.stringify(TEST_COLUMNS), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    // Direct open on existing vacancy /vacancies/20
    const routerOk = createSpaRouter(['/vacancies/20']);
    const { unmount } = render(<RouterProvider router={routerOk} />);

    await waitFor(() => {
      expect(screen.getByText('Collaborative design platform')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Direct permalink note')).toBeInTheDocument();
    });
    unmount();

    // Direct open on non-existent / foreign vacancy /vacancies/9999 -> renders 404 page & preserves URL
    const router404 = createSpaRouter(['/vacancies/9999']);
    render(<RouterProvider router={router404} />);

    await waitFor(() => {
      expect(screen.getByText(/404/)).toBeInTheDocument();
      expect(screen.getByText(/Вернуться на доску/)).toBeInTheDocument();
    });
    expect(router404.state.location.pathname).toBe('/vacancies/9999');
  });

  it('synchronizes search burst history and tag filters with browser Back/Forward and toggles display:none', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url === '/api/v2/vacancies') {
        return new Response(JSON.stringify(LIGHTWEIGHT_VACANCIES), { status: 200 });
      }
      if (url === '/api/v2/columns') {
        return new Response(JSON.stringify(TEST_COLUMNS), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    try {
      const router = createSpaRouter(['/']);
      render(<RouterProvider router={router} />);

      await waitFor(() => {
        expect(screen.getByText('Senior Go Engineer')).toBeInTheDocument();
        expect(screen.getByText('Frontend React Architect')).toBeInTheDocument();
      });

      const card10 = document.querySelector('[data-bp-card="true"][data-id="10"]') as HTMLElement;
      const card20 = document.querySelector('[data-bp-card="true"][data-id="20"]') as HTMLElement;
      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;

      // Rapid typing burst 's', 'st', 'stripe' -> single history step (?search=stripe), hides card20 immediately
      fireEvent.change(searchInput, { target: { value: 's' } });
      fireEvent.change(searchInput, { target: { value: 'st' } });
      fireEvent.change(searchInput, { target: { value: 'stripe' } });

      expect(router.state.location.search).toBe('?search=stripe');
      expect(card10.style.display).toBe('');
      expect(card20.style.display).toBe('none');

      // Advance past 500ms burst window, then type a second distinct query 'figma' -> new history step!
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      fireEvent.change(searchInput, { target: { value: 'fig' } });
      fireEvent.change(searchInput, { target: { value: 'figma' } });

      expect(router.state.location.search).toBe('?search=figma');
      expect(card10.style.display).toBe('none');
      expect(card20.style.display).toBe('');

      // Browser BACK once -> reverts whole phrase to '?search=stripe' (NOT 'fig'!)
      await act(async () => {
        await router.navigate(-1);
      });

      expect(router.state.location.search).toBe('?search=stripe');
      expect(searchInput.value).toBe('stripe');
      expect(card10.style.display).toBe('');
      expect(card20.style.display).toBe('none');

      // Browser BACK again -> reverts to '/' (unfiltered, all cards visible!)
      await act(async () => {
        await router.navigate(-1);
      });

      expect(router.state.location.search).toBe('');
      expect(searchInput.value).toBe('');
      expect(card10.style.display).toBe('');
      expect(card20.style.display).toBe('');

      // Browser FORWARD -> re-applies '?search=stripe' and hides card20!
      await act(async () => {
        await router.navigate(1);
      });

      expect(router.state.location.search).toBe('?search=stripe');
      expect(searchInput.value).toBe('stripe');
      expect(card10.style.display).toBe('');
      expect(card20.style.display).toBe('none');
    } finally {
      vi.useRealTimers();
    }
  });
});
