'use client';

import StatsPage from '../../views/StatsPage';
import { useAuth } from '../../components/AppShell';

export default function StatRoute() {
  const { user, handleLogout, setUser } = useAuth();
  return (
    <StatsPage
      user={user}
      onLogout={handleLogout}
      onUserUpdated={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
    />
  );
}
