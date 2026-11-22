import HomePage from '../views/HomePage';
import { fetchServerApi } from '../utils/serverApi';
import type { User, Vacancy, BoardColumn } from '../types/models';

export const dynamic = 'force-dynamic';

async function parseArrayFromResponse<T>(res: Response | null): Promise<T[]> {
  if (!res || !res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function Page() {
  let initialVacancies: Vacancy[] = [];
  let initialColumns: BoardColumn[] = [];
  let initialUser: User | null = null;

  try {
    const [meRes, vacRes, colRes] = await Promise.all([
      fetchServerApi('/api/v2/auth/me', {}),
      fetchServerApi('/api/v2/vacancies', {}),
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
    />
  );
}
