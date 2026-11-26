import { AlertBanner, PageLayout, Spinner } from '@blueprint/ui-kit';
import { filterUsersByQuery, useUserManagement } from './useUserManagement';
import type { AvailableFeatureFlag } from './userManagement.types';
import { useAuth } from '../components/AppShell';
import type { User } from '../types/models';
import UserManagementAccessDenied from './UserManagementAccessDenied';
import UserManagementHeader from './UserManagementHeader';
import UserManagementTable from './UserManagementTable';
import { useTranslation } from '../i18n/I18nContext';

export interface UserManagementPageProps {
  user?: User | null;
}

function buildAvailableFlags(t: (key: string) => string): AvailableFeatureFlag[] {
  return [
    { key: 'api_access', label: t('settingsModal.feature_api_access_title') || 'api_access' },
    { key: 'admin', label: t('settingsModal.feature_admin_title') || 'admin' },
  ];
}

function hasAdminFeatureFlag(propUser: User | null | undefined, authUser: User | null): boolean {
  const resolved = propUser !== undefined ? propUser : authUser;
  return Boolean(resolved?.feature_flags?.includes('admin'));
}

export default function UserManagementPage({ user }: UserManagementPageProps) {
  const auth = useAuth();
  const { t, locale } = useTranslation();
  const hasAccess = hasAdminFeatureFlag(user, auth.user);

  const {
    users,
    loading,
    search,
    setSearch,
    editingFlags,
    savingUserId,
    statusMsg,
    errorMsg,
    handleToggleFlag,
    handleSaveFlags,
  } = useUserManagement(hasAccess);

  if (!hasAccess) {
    return <UserManagementAccessDenied locale={locale} />;
  }

  const filteredUsers = filterUsersByQuery(users, search);
  const availableFlags = buildAvailableFlags(t);

  return (
    <PageLayout
      gridDeps={[locale]}
      className="user-management-page"
      header={<UserManagementHeader search={search} onSearchChange={setSearch} />}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ui-space-4)',
          padding: 'var(--ui-space-4)',
        }}
      >
        {statusMsg && <AlertBanner tone="success" title={statusMsg} />}
        {errorMsg && <AlertBanner tone="danger" title={errorMsg} />}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--ui-space-8)' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <UserManagementTable
            users={filteredUsers}
            availableFlags={availableFlags}
            editingFlags={editingFlags}
            savingUserId={savingUserId}
            onToggleFlag={handleToggleFlag}
            onSaveFlags={handleSaveFlags}
          />
        )}
      </div>
    </PageLayout>
  );
}
