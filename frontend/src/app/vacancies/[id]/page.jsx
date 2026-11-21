import React from 'react';
import { notFound } from 'next/navigation';
import HomePage from '../../../views/HomePage';
import { fetchServerApi } from '../../../utils/serverApi';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetchServerApi(`/api/v2/vacancies/${id}`, {});
    if (res && res.ok) {
      const v = await res.json();
      return {
        title: `${v.title || 'Vacancy'} | ${v.company || 'Tracker'}`,
        description: v.ai_summary || v.notes || `Vacancy details for ${v.title}`,
      };
    }
  } catch {
    // ignore
  }
  return {
    title: '404 — Vacancy Not Found',
  };
}

export default async function VacancyStandalonePage({ params }) {
  const { id } = await params;
  let vacancy = null;
  let history = [];
  let compatibility = null;
  let columns = [];
  let initialUser = null;

  try {
    const [meRes, vacRes, histRes, compatRes, colRes] = await Promise.all([
      fetchServerApi('/api/v2/auth/me', {}),
      fetchServerApi(`/api/v2/vacancies/${id}`, {}),
      fetchServerApi(`/api/v2/vacancies/${id}/history`, {}),
      fetchServerApi(`/api/v2/vacancies/${id}/compatibility`, {}),
      fetchServerApi('/api/v2/columns', {}),
    ]);

    if (!vacRes || !vacRes.ok) {
      return notFound();
    }

    vacancy = await vacRes.json();

    if (meRes && meRes.ok) {
      initialUser = await meRes.json();
    }
    if (histRes && histRes.ok) {
      const hData = await histRes.json();
      if (Array.isArray(hData)) {
        history = hData;
      }
    }
    if (compatRes && compatRes.ok) {
      compatibility = await compatRes.json();
    }
    if (colRes && colRes.ok) {
      const cData = await colRes.json();
      if (Array.isArray(cData)) {
        columns = cData;
      }
    }
  } catch (err) {
    if (err && (err.digest === 'NEXT_NOT_FOUND' || err.message === 'NEXT_NOT_FOUND')) {
      throw err;
    }
    console.error('Failed to SSR vacancy page:', err);
    return notFound();
  }

  if (!vacancy) {
    return notFound();
  }

  const enrichedVacancy = {
    ...vacancy,
    history,
  };

  return (
    <HomePage
      user={initialUser || undefined}
      initialColumns={columns}
      initialVacancies={[enrichedVacancy]}
      initialSelectedVacancy={enrichedVacancy}
      initialVacancyHistory={history}
      initialVacancyCompatibility={compatibility}
      fetchBoardInBackground={true}
    />
  );
}
