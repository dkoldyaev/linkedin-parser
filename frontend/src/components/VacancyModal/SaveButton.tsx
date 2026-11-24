import React from 'react';
import { Button, Icon } from '@blueprint/ui-kit';
import { Check, Cross } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import type { SaveStatus } from './useSave';

export interface SaveButtonProps {
  status?: SaveStatus;
  onClick: () => void;
  disabled?: boolean;
}

export function SaveButton({ status, onClick, disabled }: SaveButtonProps): React.ReactElement {
  const { t } = useTranslation();
  const isSaving = status === 'saving';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={isSaving}
      disabled={disabled}
      tone={isError ? 'danger' : isSuccess ? 'success' : undefined}
      startIcon={
        status && !isSaving && (
          <Icon icon={isError ? Cross : Check} size="xs" />
        )
      }
      onClick={onClick}
    >
      {isError ? t('common.retry') : isSuccess ? t('common.saved') : t('common.save')}
    </Button>
  );
}
