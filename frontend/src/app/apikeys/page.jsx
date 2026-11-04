'use client';

import ApiKeysPage from '../../views/ApiKeysPage';
import { useAuth } from '../../components/AppShell';

export default function ApiKeysRoute() {
  const { user } = useAuth();
  return <ApiKeysPage user={user} />;
}
