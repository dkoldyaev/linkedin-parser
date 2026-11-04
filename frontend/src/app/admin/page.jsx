'use client';

import AdminPage from '../../views/AdminPage';
import { useAuth } from '../../components/AppShell';

export default function AdminRoute() {
  const { user } = useAuth();
  return <AdminPage user={user} />;
}
