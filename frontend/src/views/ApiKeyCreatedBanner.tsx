import React from 'react';
import { Copy, Check } from 'lucide-react';
import { AlertBanner, Input, Button, Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface ApiKeyCreatedBannerProps {
  createdKeyToken: string;
  copiedKey: boolean;
  onCopyToken: () => void;
}

const CHECK_ICON = <Icon icon={Check} size="xs" />;
const COPY_ICON = <Icon icon={Copy} size="xs" />;

export default function ApiKeyCreatedBanner({
  createdKeyToken,
  copiedKey,
  onCopyToken,
}: ApiKeyCreatedBannerProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div style={{ marginTop: 'var(--ui-space-4)' }}>
      <AlertBanner
        tone="warning"
        title={t('settingsModal.new_key_warning')}
      />
      <div style={{ display: 'flex', gap: 'var(--ui-space-2)', marginTop: 'var(--ui-space-2)' }}>
        <Input
          readOnly
          value={createdKeyToken}
          onClick={(e: React.MouseEvent<HTMLInputElement>) => e.currentTarget.select()}
          style={{ flex: 1, fontFamily: 'var(--ui-font-mono)' }}
        />
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onCopyToken}
          startIcon={copiedKey ? CHECK_ICON : COPY_ICON}
        >
          {copiedKey ? t('settingsModal.key_copied') : t('settingsModal.copy_key_btn')}
        </Button>
      </div>
    </div>
  );
}
