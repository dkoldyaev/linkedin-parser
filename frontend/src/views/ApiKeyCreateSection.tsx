
import React from 'react';
import { Key } from 'lucide-react';
import {
  TableHeader,
  Button,
  Icon,
  Input,
  Text,
  StatusDot,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import ApiKeyCreatedBanner from './ApiKeyCreatedBanner';
import ApiKeyOpenApiDocs from './ApiKeyOpenApiDocs';

export interface ApiKeyCreateSectionProps {
  newKeyName: string;
  onNewKeyNameChange: (name: string) => void;
  generatingKey: boolean;
  createdKeyToken: string | null;
  copiedKey: boolean;
  onGenerateApiKey: (e: React.FormEvent) => void;
  onCopyToken: () => void;
}

const KEY_ICON = <Icon icon={Key} size="xs" />;

export default function ApiKeyCreateSection({
  newKeyName,
  onNewKeyNameChange,
  generatingKey,
  createdKeyToken,
  copiedKey,
  onGenerateApiKey,
  onCopyToken,
}: ApiKeyCreateSectionProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div style={{ border: '1px solid var(--ui-border-subtle)', background: 'var(--ui-bg-surface)' }}>
      <TableHeader size="sm">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
          <StatusDot tone="accent" size="sm" />
          <Text variant="mono" weight="bold">
            {t('settingsModal.create_key_title').toUpperCase()}
          </Text>
        </div>
      </TableHeader>

      <div style={{ padding: 'var(--ui-space-4)', borderBottom: '1px solid var(--ui-border-subtle)' }}>
        <Text variant="body-sm" tone="secondary" style={{ marginBottom: 'var(--ui-space-3)' }}>
          {t('settingsModal.create_key_desc')}
        </Text>

        <form onSubmit={onGenerateApiKey} style={{ display: 'flex', gap: 'var(--ui-space-2)' }}>
          <Input
            value={newKeyName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNewKeyNameChange(e.target.value)}
            placeholder={t('settingsModal.key_name_placeholder')}
            required
            style={{ flex: 1 }}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={generatingKey}
            disabled={generatingKey || !newKeyName.trim()}
            startIcon={KEY_ICON}
          >
            {generatingKey ? t('settingsModal.generating_key') : t('settingsModal.generate_key_btn')}
          </Button>
        </form>

        {createdKeyToken && (
          <ApiKeyCreatedBanner
            createdKeyToken={createdKeyToken}
            copiedKey={copiedKey}
            onCopyToken={onCopyToken}
          />
        )}
      </div>

      <ApiKeyOpenApiDocs />
    </div>
  );
}
