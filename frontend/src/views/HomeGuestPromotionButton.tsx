import React from 'react';
import { LogIn } from 'lucide-react';
import { Button, Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface HomeGuestPromotionButtonProps {
  isAnonymous?: boolean;
  onOpenGuestAuth: () => void;
}

const LOGIN_ICON = <Icon icon={LogIn} size="xs" />;

export default function HomeGuestPromotionButton({
  isAnonymous,
  onOpenGuestAuth,
}: HomeGuestPromotionButtonProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (!isAnonymous) return null;

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onOpenGuestAuth}
      startIcon={LOGIN_ICON}
    >
      {t('auth.save_progress_btn')}
    </Button>
  );
}
