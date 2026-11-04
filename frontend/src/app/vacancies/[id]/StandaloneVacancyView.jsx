'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import VacancyModal from '../../../components/VacancyModal';
import { scheduleRevalidate } from '../../../utils/revalidate';

export default function StandaloneVacancyView({ vacancyId, initialVacancy, initialColumns = [], isUnauthorized = false }) {
  const router = useRouter();
  const [vacancy, setVacancy] = useState(initialVacancy);

  // If initial load was unauthorized on server but client logged in, fetch vacancy
  React.useEffect(() => {
    if (!vacancy && vacancyId) {
      fetch(`/api/vacancies/${vacancyId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setVacancy(data);
        })
        .catch(() => {});
    }
  }, [vacancy, vacancyId]);

  const handleClose = () => {
    router.push('/');
  };

  const handleUpdate = (updated) => {
    setVacancy(updated);
    scheduleRevalidate({ tag: 'vacancies', path: `/vacancies/${updated.id}` });
  };

  const handleDelete = () => {
    scheduleRevalidate({ tag: 'vacancies' });
    router.push('/');
  };

  if (!vacancy) {
    return (
      <div className="standalone-vacancy-container" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        {/* Modal will open once vacancy is loaded; if unauthorized, AppShell renders LoginModal */}
      </div>
    );
  }

  return (
    <div className="standalone-vacancy-container" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <VacancyModal
        vacancy={vacancy}
        isOpen={true}
        columns={initialColumns}
        onClose={handleClose}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
