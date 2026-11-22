import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Icon, Badge, Text } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import type { ApiKeyItem } from '../types/models';

export interface ApiKeyListItemProps {
  apiKey: ApiKeyItem;
  onRevokeApiKey: (key: ApiKeyItem) => void;
}

const TRASH_ICON = <Icon icon={Trash2} size="xs" />;

export default function ApiKeyListItem({
  apiKey,
  onRevokeApiKey,
}: ApiKeyListItemProps): React.ReactElement {
  const { t } = useTranslation();

  const createdStr = t('settingsModal.key_created_at').replace(
    '{date}',
    new Date(apiKey.created_at).toLocaleDateString()
  );
  const lastUsedStr = apiKey.last_used_at
    ? t('settingsModal.key_last_used').replace(
        '{date}',
        new Date(apiKey.last_used_at).toLocaleDateString()
      )
    : t('settingsModal.key_never_used');

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--ui-space-3) var(--ui-space-4)',
        borderBottom: '1px solid var(--ui-border-subtle)',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
          <Text variant="body" weight="medium" tone="primary">
            {apiKey.name}
          </Text>
          <Badge variant="chip" size="xs" tone="neutral">
            {apiKey.key_prefix}••••••••
          </Badge>
        </div>
        <Text variant="caption" tone="muted">
          {createdStr}
          {' • '}
          {lastUsedStr}
        </Text>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        tone="danger"
        onClick={() => onRevokeApiKey(apiKey)}
        title={t('settingsModal.revoke_key_btn')}
        aria-label={t('settingsModal.revoke_key_btn')}
      >
        {TRASH_ICON}
      </Button>
    </li>
  );
}
