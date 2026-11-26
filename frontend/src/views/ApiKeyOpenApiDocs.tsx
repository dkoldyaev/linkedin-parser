import { Button, Icon, Text } from '@blueprint/ui-kit';
import { ExternalLink } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

const EXTERNAL_LINK_ICON = <Icon icon={ExternalLink} size="xs" />;

export default function ApiKeyOpenApiDocs(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      style={{
        padding: 'var(--ui-space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ui-space-3)',
      }}
    >
      <Text variant="body-sm" tone="secondary">
        {t('settingsModal.openapi_docs_desc')}
      </Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ui-space-2)' }}>
        <Button asChild variant="secondary" size="sm">
          <a
            href="/api/v1/docs"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {EXTERNAL_LINK_ICON}
            <span>{t('settingsModal.openapi_swagger_btn')}</span>
          </a>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <a
            href="/api/v1/redoc"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {EXTERNAL_LINK_ICON}
            <span>{t('settingsModal.openapi_redoc_btn')}</span>
          </a>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <a
            href="/api/v1/openapi.json"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {EXTERNAL_LINK_ICON}
            <span>{t('settingsModal.openapi_json_btn')}</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
