import { Icon, PageLayout, Text } from '@blueprint/ui-kit';
import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export interface UserManagementAccessDeniedProps {
  locale: string;
}

export default function UserManagementAccessDenied({
  locale,
}: UserManagementAccessDeniedProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <PageLayout gridDeps={[locale]} className="user-management-page">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--ui-space-12)',
          textAlign: 'center',
        }}
      >
        <div style={{ color: 'var(--ui-danger)', marginBottom: 'var(--ui-space-3)' }}>
          <Icon icon={ShieldAlert} size="lg" />
        </div>
        <Text
          variant="title"
          weight="bold"
          tone="primary"
          style={{ marginBottom: 'var(--ui-space-2)' }}
        >
          {t('pages.userManagement.access_denied')}
        </Text>
        <Text variant="body" tone="secondary">
          {t('pages.userManagement.admin_only')}
        </Text>
      </div>
    </PageLayout>
  );
}
