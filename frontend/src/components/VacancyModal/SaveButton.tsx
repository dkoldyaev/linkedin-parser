import { Button, Icon } from '@blueprint/ui-kit';
import { Check, Cross } from 'lucide-react';
import React from 'react';
import type { SaveStatus } from './useSave';
import { useTranslation } from '../../i18n/I18nContext';

export interface SaveButtonProps {
  status?: SaveStatus;
  onClick: () => void;
  disabled?: boolean;
}

const TONE_BY_STATUS: Partial<Record<NonNullable<SaveStatus>, 'danger' | 'success'>> = {
  error: 'danger',
  success: 'success',
};

const LABEL_KEY_BY_STATUS: Partial<Record<NonNullable<SaveStatus>, string>> = {
  error: 'common.retry',
  success: 'common.saved',
};

export function SaveButton({ status, onClick, disabled }: SaveButtonProps): React.ReactElement {
  const { t } = useTranslation();
  const isSaving = status === 'saving';
  const tone = status ? TONE_BY_STATUS[status] : undefined;
  const labelKey = (status && LABEL_KEY_BY_STATUS[status]) || 'common.save';
  const showStatusIcon = Boolean(status && !isSaving);

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={isSaving}
      disabled={disabled}
      tone={tone}
      startIcon={showStatusIcon && <Icon icon={status === 'error' ? Cross : Check} size="xs" />}
      onClick={onClick}
    >
      {t(labelKey)}
    </Button>
  );
}
