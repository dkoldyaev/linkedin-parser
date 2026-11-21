import React from 'react';
import HomePage from '../views/HomePage';
import { fetchServerApi } from '../utils/serverApi';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialVacancies = [];
  let initialColumns = [];
  let initialUser = null;

  try {
    const [meRes, vacRes, colRes] = await Promise.all([
      fetchServerApi('/api/v2/auth/me', {}),
      fetchServerApi('/api/v2/vacancies', {}),
      fetchServerApi('/api/v2/columns', {}),
    ]);

    if (meRes && meRes.ok) {
      initialUser = await meRes.json();
    }
    if (vacRes && vacRes.ok) {
      const vacData = await vacRes.json();
      if (Array.isArray(vacData)) {
        initialVacancies = vacData;
      }
    }
    if (colRes && colRes.ok) {
      const colData = await colRes.json();
      if (Array.isArray(colData)) {
        initialColumns = colData;
      }
    }
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
