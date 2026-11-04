'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VacancyModal from '../../../../components/VacancyModal';
import { scheduleRevalidate } from '../../../../utils/revalidate';

export default function InterceptedVacancyModal({ vacancyId }) {
  const router = useRouter();
  const [vacancy, setVacancy] = useState(null);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    let cancelled = false;

    // Load vacancy
    fetch(`/api/vacancies/${vacancyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setVacancy(data);
      })
      .catch((e) => console.error('Failed to load intercepted vacancy', e));

    // Load columns
    fetch('/api/columns')
      .then((res) => (res.ok ? res.json() : []))
      .then((cols) => {
        if (!cancelled && cols) setColumns(cols);
      })
      .catch((e) => console.error('Failed to load columns', e));

    return () => {
      cancelled = true;
    };
  }, [vacancyId]);

  const handleClose = () => {
    router.back();
  };

  const handleUpdate = (updated) => {
    setVacancy(updated);
    scheduleRevalidate({ tag: 'vacancies', path: `/vacancies/${vacancyId}` });
  };

  const handleDelete = () => {
    router.back();
    scheduleRevalidate({ tag: 'vacancies' });
  };

  if (!vacancy) {
    return null;
  }

  return (
    <VacancyModal
      vacancy={vacancy}
      isOpen={true}
      columns={columns}
      onClose={handleClose}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
