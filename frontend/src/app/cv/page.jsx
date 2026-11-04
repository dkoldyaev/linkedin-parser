'use client';

import CVManagementPage from '../../views/CVManagementPage';
import { useAuth } from '../../components/AppShell';

export default function CVRoute() {
  const { user } = useAuth();
  return <CVManagementPage user={user} />;
}
