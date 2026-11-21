'use client';

import React from 'react';
import ApiKeysPage from '../../views/ApiKeysPage';
import { useAuth } from '../../components/AppShell';

export default function Page() {
  const { user } = useAuth();
  return <ApiKeysPage user={user} />;
}
