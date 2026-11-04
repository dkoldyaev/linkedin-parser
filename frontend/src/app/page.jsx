import HomePage from '../views/HomePage';
import { fetchServerApi } from '../utils/serverApi';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialVacancies = [];
  let initialColumns = [];

  try {
    const [vacRes, colRes] = await Promise.all([
      fetchServerApi('/api/vacancies', { next: { tags: ['vacancies'] }, cache: 'no-store' }),
      fetchServerApi('/api/columns', { next: { tags: ['columns'] }, cache: 'no-store' }),
    ]);

    if (vacRes && vacRes.ok) {
      initialVacancies = await vacRes.json();
    }
    if (colRes && colRes.ok) {
      initialColumns = await colRes.json();
    }
  } catch (err) {
    console.error('Error fetching server data for homepage:', err);
  }

  return (
    <HomePage
      initialVacancies={initialVacancies}
      initialColumns={initialColumns}
    />
  );
}
