'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import VacancyModal from '../../../components/VacancyModal';
import { scheduleRevalidate } from '../../../utils/revalidate';

export default function StandaloneVacancyView({ initialVacancy, initialColumns = [] }) {
  const router = useRouter();
  const [vacancy, setVacancy] = useState(initialVacancy);

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
