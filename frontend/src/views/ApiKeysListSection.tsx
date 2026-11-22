'use client';

import { Key } from 'lucide-react';
import {
  TableHeader,
  Icon,
  Badge,
  Text,
  EmptyState,
  Spinner,
  StatusDot,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import ApiKeyListItem from './ApiKeyListItem';
import type { ApiKeyItem } from '../types/models';

export interface ApiKeysListSectionProps {
  apiKeys: ApiKeyItem[];
  loading: boolean;
  onRevokeApiKey: (key: ApiKeyItem) => void;
}

const KEY_MD_ICON = <Icon icon={Key} size="md" />;

export default function ApiKeysListSection({
  apiKeys,
  loading,
  onRevokeApiKey,
}: ApiKeysListSectionProps) {
  const { t } = useTranslation();

  let listBody: React.ReactNode = (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {apiKeys.map((k) => (
        <ApiKeyListItem
          key={k.id}
          apiKey={k}
          onRevokeApiKey={onRevokeApiKey}
        />
      ))}
    </ul>
  );

  if (loading) {
    listBody = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--ui-space-8)' }}>
        <Spinner size="lg" />
      </div>
    );
  } else if (apiKeys.length === 0) {
    listBody = (
      <EmptyState
        icon={KEY_MD_ICON}
        title={t('settingsModal.no_keys_title')}
        description={t('settingsModal.no_keys_desc')}
      />
    );
  }

  return (
    <div style={{ border: '1px solid var(--ui-border-subtle)', background: 'var(--ui-bg-surface)' }}>
      <TableHeader size="sm">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
          <StatusDot tone="accent" size="sm" />
          <Text variant="mono" weight="bold">
            {t('settingsModal.active_keys_title').toUpperCase()}
          </Text>
          <Badge variant="subtle" size="sm">
            {apiKeys.length}
          </Badge>
        </div>
      </TableHeader>

      {listBody}
    </div>
  );
}
