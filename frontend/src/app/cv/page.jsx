'use client';

import React from 'react';
import CVManagementPage from '../../views/CVManagementPage';
import { useAuth } from '../../components/AppShell';

export default function Page() {
  const { user } = useAuth();
  return <CVManagementPage key={user?.id || 'guest'} user={user} />;
}
