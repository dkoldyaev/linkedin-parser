import ApiKeysDocLinks from './ApiKeysDocLinks';
import React from 'react';
import { Text } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface ApiKeysHeaderProps {
  hasApiAccess: boolean;
}

export default function ApiKeysHeader({ hasApiAccess }: ApiKeysHeaderProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      className="bp-subbar bp-snap"
      data-min-grids="1"
      style={{
        height: 'var(--ui-grid-cell)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--ui-space-4)',
        backgroundColor: 'var(--ui-bg-surface)',
        borderBottom: '1px solid var(--ui-pixel-line)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
        <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--ui-primary)' }} />
        <Text variant="mono" weight="bold" tone="primary">
          {t('settingsModal.api_keys_tab')}
        </Text>
        <Text variant="mono" tone="muted">
          /
        </Text>
        <Text variant="caption" tone="secondary">
          REST API v1
        </Text>
      </div>

      {hasApiAccess && <ApiKeysDocLinks />}
    </div>
  );
}
