import { PageLayout } from '@blueprint/ui-kit';
import { useAuth } from '../components/AppShell';
import { useTranslation } from '../i18n/I18nContext';
import type { User } from '../types/models';
import { useApiKeys } from './useApiKeys';
import ApiKeyCreateSection from './ApiKeyCreateSection';
import ApiKeysListSection from './ApiKeysListSection';
import ApiKeysHeader from './ApiKeysHeader';
import ApiKeysAccessDenied from './ApiKeysAccessDenied';

export interface ApiKeysPageProps {
  user?: User | null;
}

export default function ApiKeysPage({ user }: ApiKeysPageProps) {
  const auth = useAuth();
  const resolvedUser = user !== undefined ? user : auth.user;
  const { locale } = useTranslation();
  const hasApiAccess = Boolean(resolvedUser?.feature_flags?.includes('api_access'));

  const {
    apiKeys,
    loading,
    newKeyName,
    setNewKeyName,
    generatingKey,
    createdKeyToken,
    copiedKey,
    handleGenerateApiKey,
    handleRevokeApiKey,
    handleCopyToken,
  } = useApiKeys(hasApiAccess);

  return (
    <PageLayout
      gridDeps={[locale]}
      className="api-keys-page"
      header={<ApiKeysHeader hasApiAccess={hasApiAccess} />}
    >
      <div style={{ padding: 'var(--ui-space-4)', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        {!hasApiAccess ? (
          <ApiKeysAccessDenied />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-6)' }}>
            <ApiKeyCreateSection
              newKeyName={newKeyName}
              onNewKeyNameChange={setNewKeyName}
              generatingKey={generatingKey}
              createdKeyToken={createdKeyToken}
              copiedKey={copiedKey}
              onGenerateApiKey={handleGenerateApiKey}
              onCopyToken={handleCopyToken}
            />

            <ApiKeysListSection
              apiKeys={apiKeys}
              loading={loading}
              onRevokeApiKey={handleRevokeApiKey}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
