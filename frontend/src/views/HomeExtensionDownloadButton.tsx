import React from 'react';
import { Download } from 'lucide-react';
import { Button, Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

const DOWNLOAD_ICON = <Icon icon={Download} size="xs" />;

export default function HomeExtensionDownloadButton(): React.ReactElement {
  const { t } = useTranslation();
  const title = t('nav.download_extension');

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      title={title}
    >
      <a
        href="/extension.zip"
        download
        aria-label={title}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {DOWNLOAD_ICON}
      </a>
    </Button>
  );
}
