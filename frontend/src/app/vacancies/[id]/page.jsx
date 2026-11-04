import { fetchServerApi } from '../../../utils/serverApi';
import StandaloneVacancyView from './StandaloneVacancyView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetchServerApi(`/api/vacancies/${id}`, {
      next: { tags: [`vacancy-${id}`, 'vacancies'] },
      cache: 'no-store',
    });
    if (res && res.ok) {
      const v = await res.json();
      return {
        title: `${v.title || 'Vacancy'} | ${v.company || 'Tracker'}`,
        description: v.summary || v.notes || `Vacancy details for ${v.title}`,
      };
    }
  } catch (e) {
    // ignore
  }
  return {
    title: `Vacancy #${id}`,
  };
}

export default async function VacancyStandalonePage({ params }) {
  const { id } = await params;
  let vacancy = null;
  let columns = [];

  try {
    const [vacRes, colRes] = await Promise.all([
      fetchServerApi(`/api/vacancies/${id}`, {
        next: { tags: [`vacancy-${id}`, 'vacancies'] },
        cache: 'no-store',
      }),
      fetchServerApi('/api/columns', {
        next: { tags: ['columns'] },
        cache: 'no-store',
      }),
    ]);

    if (vacRes && vacRes.ok) {
      vacancy = await vacRes.json();
    }
    if (colRes && colRes.ok) {
      columns = await colRes.json();
    }
  } catch (err) {
    console.error('Failed to SSR vacancy page', err);
  }

  if (!vacancy) {
    return notFound();
  }

  return <StandaloneVacancyView initialVacancy={vacancy} initialColumns={columns} />;
}
