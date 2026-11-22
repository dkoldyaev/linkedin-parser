import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { I18nProvider } from '../i18n/I18nContext';
import HomePage from '../views/HomePage';
import RootPage from './page';
import VacancyPage, { generateMetadata } from './vacancies/[id]/page';
import NotFoundPage from './not-found';

const mockNotFound = vi.fn(() => {
  const err = new Error('NEXT_NOT_FOUND') as Error & { digest?: string };
  err.digest = 'NEXT_NOT_FOUND';
  throw err;
});

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
let mockPathname = '/';

vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

const mockFetchServerApi = vi.fn();
vi.mock('../utils/serverApi', () => ({
  fetchServerApi: (...args: unknown[]) => mockFetchServerApi(...args),
}));

describe('Seam 3: SSR Board (/), Vacancy Permalink (/vacancies/[id]) Privacy & 404 Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
    globalThis.EventSource = class {
      close() {}
    } as unknown as typeof EventSource;
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  it('renders initial board state (columns and cards) on the server for / in the user locale', async () => {
    const serverColumns = [
      { id: 'Еще не написал', color: '#6366f1', has_lanes: false, is_base: true },
      { id: 'Отказ', color: '#ef4444', has_lanes: false, is_base: true },
    ];
    const serverVacancies = [
      {
        id: 101,
        title: 'Staff Go Engineer',
        company: 'Stripe',
        url: 'https://linkedin.com/jobs/view/101',
        status: 'Еще не написал',
        calculated_score: 88,
        ai_summary: 'Core payment infrastructure in Go.',
        tech_stack: ['Go', 'PostgreSQL'],
        tags: ['fintech'],
        created_at: '2026-11-18T10:00:00Z',
      },
    ];

    mockFetchServerApi.mockImplementation(async (endpoint: string) => {
      if (endpoint === '/api/v2/auth/me') {
        return new Response(
          JSON.stringify({ id: 1, email: 'user1@test.local', is_anonymous: false, locale: 'en' }),
          { status: 200 }
        );
      }
      if (endpoint === '/api/v2/columns') {
        return new Response(JSON.stringify(serverColumns), { status: 200 });
      }
      if (endpoint === '/api/v2/vacancies') {
        return new Response(JSON.stringify(serverVacancies), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('/api/v2/exchange-rates')) {
        return new Response(JSON.stringify({ rates: {} }), { status: 200 });
      }
      if (String(url).includes('/api/v2/settings')) {
        return new Response(
          JSON.stringify({ locale: 'en', salary_display_format: 'month' }),
          { status: 200 }
        );
      }
      if (String(url).includes('/api/v2/mercure-config')) {
        return new Response(
          JSON.stringify({ mercure_hub_url: '/.well-known/mercure', mercure_topic: 'vacancies:1' }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const element = await RootPage();
    render(
      <I18nProvider initialLocale="en" initialSalaryFormat="month" initialSalaryCurrency="">
        {element}
      </I18nProvider>
    );

    expect(screen.getByText('Staff Go Engineer')).toBeInTheDocument();
    expect(screen.getByText('Core payment infrastructure in Go.')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('Not Contacted')).toBeInTheDocument();
  });

  it('on /vacancies/[id] SSR: fetches ONLY the target card (+ history, compatibility, columns) on the server, renders the opened card immediately, and loads background board cards on client mount', async () => {
    mockPathname = '/vacancies/55';
    const card55 = {
      id: 55,
      title: 'Principal Distributed Systems Engineer',
      company: 'Cloudflare',
      url: 'https://linkedin.com/jobs/view/55',
      status: 'Собеседование',
      calculated_score: 92,
      ai_summary: 'Global edge network routing.',
      description: 'Full description of Cloudflare role',
      tech_stack: ['Rust', 'BGP'],
      tags: ['edge'],
      created_at: '2026-11-19T12:00:00Z',
    };
    const history55 = [
      {
        id: 1,
        from_status: 'Еще не написал',
        to_status: 'Собеседование',
        comment: 'Passed HR screen',
        created_at: '2026-11-19T14:00:00Z',
      },
    ];
    const compat55 = {
      calculated_score: 92,
      summary: 'Strong systems background match.',
      matched_requirements: [
        { requirement: 'Rust production experience', evidence: '5 years Rust' },
      ],
      missing_requirements: [],
      critical_gaps: [],
      recommendations: ['Highlight BGP experience'],
    };
    const serverColumns = [
      { id: 'Еще не написал', color: '#6366f1', has_lanes: false, is_base: true },
      { id: 'Собеседование', color: '#d97706', has_lanes: true, is_base: false },
      { id: 'Отказ', color: '#ef4444', has_lanes: false, is_base: true },
    ];

    const ssrRequestedEndpoints: string[] = [];
    mockFetchServerApi.mockImplementation(async (endpoint: string) => {
      ssrRequestedEndpoints.push(endpoint);
      if (endpoint === '/api/v2/auth/me') {
        return new Response(
          JSON.stringify({ id: 1, email: 'user1@test.local', is_anonymous: false, locale: 'ru' }),
          { status: 200 }
        );
      }
      if (endpoint === '/api/v2/vacancies/55') {
        return new Response(JSON.stringify(card55), { status: 200 });
      }
      if (endpoint === '/api/v2/vacancies/55/history') {
        return new Response(JSON.stringify(history55), { status: 200 });
      }
      if (endpoint === '/api/v2/vacancies/55/compatibility') {
        return new Response(JSON.stringify(compat55), { status: 200 });
      }
      if (endpoint === '/api/v2/columns') {
        return new Response(JSON.stringify(serverColumns), { status: 200 });
      }
      return new Response(JSON.stringify({ detail: 'Unexpected endpoint' }), { status: 500 });
    });

    const clientVacancies = [
      card55,
      {
        id: 56,
        title: 'Background Loaded Vacancy',
        company: 'Datadog',
        url: 'https://linkedin.com/jobs/view/56',
        status: 'Еще не написал',
        ai_summary: 'Loaded asynchronously on client.',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('/api/v2/vacancies') && !String(url).includes('/55')) {
        return new Response(JSON.stringify(clientVacancies), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const element = await VacancyPage({ params: Promise.resolve({ id: '55' }) });

    expect(ssrRequestedEndpoints).not.toContain('/api/v2/vacancies');
    expect(ssrRequestedEndpoints).toContain('/api/v2/vacancies/55');
    expect(ssrRequestedEndpoints).toContain('/api/v2/vacancies/55/history');
    expect(ssrRequestedEndpoints).toContain('/api/v2/vacancies/55/compatibility');

    render(
      <I18nProvider initialLocale="ru" initialSalaryFormat="month" initialSalaryCurrency="">
        {element}
      </I18nProvider>
    );

    expect(
      screen.getAllByText('Principal Distributed Systems Engineer').length
    ).toBeGreaterThan(0);
    expect(screen.getByText('Passed HR screen')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Background Loaded Vacancy')).toBeInTheDocument();
    });
  });

  it('on /vacancies/[id] SSR: when vacancy belongs to another user or does not exist (404/401/403), calls notFound() (HTTP 404), leaks zero metadata, and NotFoundPage renders LoginModal', async () => {
    mockFetchServerApi.mockImplementation(async (endpoint: string) => {
      if (endpoint === '/api/v2/vacancies/999') {
        return new Response(JSON.stringify({ detail: 'Not Found' }), { status: 404 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    const meta = await generateMetadata({ params: Promise.resolve({ id: '999' }) });
    expect(meta.title).toBe('404 — Vacancy Not Found');

    await expect(
      VacancyPage({ params: Promise.resolve({ id: '999' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalledTimes(1);

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ google_configured: false, dev_mode: true }), { status: 200 })
    );

    render(
      <I18nProvider initialLocale="ru" initialSalaryFormat="month" initialSalaryCurrency="">
        <NotFoundPage />
      </I18nProvider>
    );

    expect(screen.getAllByText(/404/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('on frontend navigation to a non-existent vacancy: shows AlertBanner with 404 message on the board without leaving the board', async () => {
    const initialCols = [
      { id: 'Еще не написал', color: '#6366f1', has_lanes: false, is_base: true },
      { id: 'Отказ', color: '#ef4444', has_lanes: false, is_base: true },
    ];
    const ghostCard = {
      id: 4040,
      title: 'Deleted Remote Role',
      company: 'GhostCorp',
      url: 'https://linkedin.com/jobs/view/4040',
      status: 'Еще не написал',
      ai_summary: 'This card was deleted on server.',
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('/api/v2/vacancies/4040')) {
        return new Response(JSON.stringify({ detail: 'Not found' }), { status: 404 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    render(
      <I18nProvider initialLocale="ru" initialSalaryFormat="month" initialSalaryCurrency="">
        <HomePage
          user={{ id: 1, email: 'user1@test.local', is_anonymous: false }}
          initialColumns={initialCols}
          initialVacancies={[ghostCard]}
        />
      </I18nProvider>
    );

    const cardTitle = screen.getByText('Deleted Remote Role');
    fireEvent.click(cardTitle);

    await waitFor(() => {
      expect(screen.getByText(/404/)).toBeInTheDocument();
    });
  });
});
