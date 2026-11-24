import HomePage from '../views/HomePage';
import { fetchServerApi } from '../utils/serverApi';
import type { User, Vacancy, BoardColumn } from '../types/models';
import type { HomeFilterState } from '../views/homeFilterHelpers';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

async function parseArrayFromResponse<T>(res: Response | null): Promise<T[]> {
  if (!res || !res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function Page({ searchParams }: PageProps = {}) {
  let initialVacancies: Vacancy[] = [];
  let initialColumns: BoardColumn[] = [];
  let initialUser: User | null = null;

  const resolvedParams = searchParams ? await searchParams : {};
  const getParam = (k: string): string => {
    const val = resolvedParams[k];
    if (Array.isArray(val)) return val[0] || '';
    return typeof val === 'string' ? val : '';
  };

  const initialFilters: Partial<HomeFilterState> = {
    search: getParam('search'),
    selectedTag: getParam('tag'),
    selectedCountry: getParam('country'),
    selectedCity: getParam('city'),
    selectedWorkplaceType: getParam('workplace_type'),
    selectedSource: getParam('source'),
    selectedClosed: getParam('is_closed'),
  };

  const params = new URLSearchParams();
  if (initialFilters.search) params.set('search', initialFilters.search);
  if (initialFilters.selectedTag) params.set('tag', initialFilters.selectedTag);
  if (initialFilters.selectedCountry) params.set('country', initialFilters.selectedCountry);
  if (initialFilters.selectedCity) params.set('city', initialFilters.selectedCity);
  if (initialFilters.selectedWorkplaceType) params.set('workplace_type', initialFilters.selectedWorkplaceType);
  if (initialFilters.selectedSource) params.set('source', initialFilters.selectedSource);
  if (initialFilters.selectedClosed) params.set('is_closed', initialFilters.selectedClosed);

  const qs = params.toString();
  const vacanciesEndpoint = qs ? `/api/v2/vacancies?${qs}` : '/api/v2/vacancies';
  const isFilteredSSR = Boolean(qs);

  try {
    const [meRes, vacRes, colRes] = await Promise.all([
      fetchServerApi('/api/v2/auth/me', {}),
      fetchServerApi(vacanciesEndpoint, {}),
      fetchServerApi('/api/v2/columns', {}),
    ]);

    if (meRes && meRes.ok) {
      initialUser = await meRes.json();
    }
    initialVacancies = await parseArrayFromResponse<Vacancy>(vacRes);
    initialColumns = await parseArrayFromResponse<BoardColumn>(colRes);
  } catch (err) {
    console.error('Error fetching SSR data for homepage:', err);
  }

  return (
    <HomePage
      user={initialUser || undefined}
      initialVacancies={initialVacancies}
      initialColumns={initialColumns}
      initialFilters={initialFilters}
      isFilteredSSR={isFilteredSSR}
    />
  );
}
