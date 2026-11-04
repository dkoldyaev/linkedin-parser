'use client';

import UserManagementPage from '../../views/UserManagementPage';
import { useAuth } from '../../components/AppShell';

export default function UsersRoute() {
  const { user } = useAuth();
  return <UserManagementPage user={user} />;
}
