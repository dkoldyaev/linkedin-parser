import { Button, Icon } from '@blueprint/ui-kit';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { XCircle } from 'lucide-react';

export interface HomeMoveClosedButtonProps {
  selectedClosed: string;
  nonRejectedClosedCount: number;
  isMovingAllRejected: boolean;
  onMoveAllClosedToRejected: () => void;
}

const X_CIRCLE_ICON = <Icon icon={XCircle} size="xs" />;

export default function HomeMoveClosedButton({
  selectedClosed,
  nonRejectedClosedCount,
  isMovingAllRejected,
  onMoveAllClosedToRejected,
}: HomeMoveClosedButtonProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (selectedClosed !== 'true' || nonRejectedClosedCount <= 0) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onMoveAllClosedToRejected}
      disabled={isMovingAllRejected}
      loading={isMovingAllRejected}
      title={t('nav.move_all_to_rejected_confirm', { count: nonRejectedClosedCount })}
      startIcon={X_CIRCLE_ICON}
    >
      {t('nav.move_all_to_rejected')} [{nonRejectedClosedCount}]
    </Button>
  );
}
