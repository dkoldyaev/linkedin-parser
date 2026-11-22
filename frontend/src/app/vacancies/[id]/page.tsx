import { notFound } from 'next/navigation';
import HomePage from '../../../views/HomePage';
import { fetchServerApi } from '../../../utils/serverApi';
import type {
  User,
  Vacancy,
  BoardColumn,
  VacancyHistoryItem,
  CompatibilityAnalysis,
} from '../../../types/models';

export const dynamic = 'force-dynamic';

export interface VacancyRouteProps {
  params: Promise<{ id: string }> | { id: string };
}

function buildMetadataFromVacancy(v: Vacancy) {
  return {
    title: `${v.title || 'Vacancy'} | ${v.company || 'Tracker'}`,
    description: v.ai_summary || v.notes || `Vacancy details for ${v.title}`,
  };
}

export async function generateMetadata({ params }: VacancyRouteProps) {
  const { id } = await params;
  try {
    const res = await fetchServerApi(`/api/v2/vacancies/${id}`, {});
    if (res && res.ok) {
      const v: Vacancy = await res.json();
      return buildMetadataFromVacancy(v);
    }
  } catch {
    // ignore
  }
  return {
    title: '404 — Vacancy Not Found',
  };
}

function isNextNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const candidate = err as { digest?: string; message?: string };
  return candidate.digest === 'NEXT_NOT_FOUND' || candidate.message === 'NEXT_NOT_FOUND';
}

async function parseOptionalJson<T>(res: Response | null): Promise<T | null> {
  if (!res || !res.ok) return null;
  return res.json();
}

async function parseOptionalArray<T>(res: Response | null): Promise<T[]> {
  const data = await parseOptionalJson<unknown>(res);
  return Array.isArray(data) ? (data as T[]) : [];
}

async function loadVacancySsrBundle(id: string) {
  const [meRes, vacRes, histRes, compatRes, colRes] = await Promise.all([
    fetchServerApi('/api/v2/auth/me', {}),
    fetchServerApi(`/api/v2/vacancies/${id}`, {}),
    fetchServerApi(`/api/v2/vacancies/${id}/history`, {}),
    fetchServerApi(`/api/v2/vacancies/${id}/compatibility`, {}),
    fetchServerApi('/api/v2/columns', {}),
  ]);

  if (!vacRes || !vacRes.ok) {
    return null;
  }

  const vacancy: Vacancy | null = await vacRes.json();
  if (!vacancy) return null;

  const [initialUser, history, compatibility, columns] = await Promise.all([
    parseOptionalJson<User>(meRes),
    parseOptionalArray<VacancyHistoryItem>(histRes),
    parseOptionalJson<CompatibilityAnalysis>(compatRes),
    parseOptionalArray<BoardColumn>(colRes),
  ]);

  return {
    vacancy,
    initialUser,
    history,
    compatibility,
    columns,
  };
}

export default async function VacancyStandalonePage({ params }: VacancyRouteProps) {
  const { id } = await params;
  let bundle: Awaited<ReturnType<typeof loadVacancySsrBundle>> = null;

  try {
    bundle = await loadVacancySsrBundle(id);
  } catch (err) {
    if (isNextNotFoundError(err)) {
      throw err;
    }
    console.error('Failed to SSR vacancy page:', err);
    return notFound();
  }

  if (!bundle) {
    return notFound();
  }

  const enrichedVacancy: Vacancy = {
    ...bundle.vacancy,
    history: bundle.history,
  };

  return (
    <HomePage
      user={bundle.initialUser || undefined}
      initialColumns={bundle.columns}
      initialVacancies={[enrichedVacancy]}
      initialSelectedVacancy={enrichedVacancy}
      initialVacancyHistory={bundle.history}
      initialVacancyCompatibility={bundle.compatibility}
      fetchBoardInBackground
    />
  );
}
