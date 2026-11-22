import React from 'react';
import { AlertBanner } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface VacancyReparseBannerProps {
  error: string | null;
  success: boolean;
}

const BANNER_STYLE = { marginBottom: 'var(--ui-space-3)' };

export default function VacancyReparseBanner({
  error,
  success,
}: VacancyReparseBannerProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (error) {
    return <AlertBanner tone="danger" title={error} style={BANNER_STYLE} />;
  }
  if (success) {
    return (
      <AlertBanner
        tone="success"
        title={t('vacancyModal.reparse_success')}
        style={BANNER_STYLE}
      />
    );
  }
  return null;
}
