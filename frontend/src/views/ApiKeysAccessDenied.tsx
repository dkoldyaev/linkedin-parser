import { Icon, Text } from '@blueprint/ui-kit';
import { Lock } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export default function ApiKeysAccessDenied(): React.ReactElement {
  const { t } = useTranslation();

  return (
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
      <div style={{ color: 'var(--ui-warning)', marginBottom: 'var(--ui-space-3)' }}>
        <Icon icon={Lock} size="lg" />
      </div>
      <Text
        variant="title"
        weight="bold"
        tone="primary"
        style={{ marginBottom: 'var(--ui-space-2)' }}
      >
        {t('settingsModal.feature_locked_title')}
      </Text>
      <Text variant="body" tone="secondary">
        {t('settingsModal.feature_locked_desc')}
      </Text>
    </div>
  );
}
