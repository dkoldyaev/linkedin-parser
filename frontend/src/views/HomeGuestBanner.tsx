import React from 'react';
import { AlertBanner, Button } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import type { User } from '../types/models';

export interface HomeGuestBannerProps {
  user: User | null | undefined;
  vacancyCount: number;
  guestBannerDismissed: boolean;
  onDismiss: () => void;
  onOpenAuth: () => void;
}

export default function HomeGuestBanner({
  user,
  vacancyCount,
  guestBannerDismissed,
  onDismiss,
  onOpenAuth,
}: HomeGuestBannerProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (!user?.is_anonymous || vacancyCount < 2 || guestBannerDismissed) {
    return null;
  }

  return (
    <AlertBanner
      tone="info"
      onDismiss={onDismiss}
      style={{ width: '100%', borderRadius: 0 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--ui-space-3)',
          width: '100%',
        }}
      >
        <span>{t('auth.guest_banner_text')}</span>
        <Button variant="primary" size="sm" onClick={onOpenAuth}>
          {t('auth.guest_banner_btn')}
        </Button>
      </div>
    </AlertBanner>
  );
}
