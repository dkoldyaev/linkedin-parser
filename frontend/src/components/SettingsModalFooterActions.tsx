import React from 'react';
import { Button } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface SettingsModalFooterActionsProps {
  activeTab: string;
  loading: boolean;
  onClose: () => void;
}

export default function SettingsModalFooterActions({
  activeTab,
  loading,
  onClose,
}: SettingsModalFooterActionsProps): React.ReactElement {
  const { t } = useTranslation();

  if (activeTab === 'general') {
    return (
      <>
        <Button variant="secondary" onClick={onClose}>
          {t('batchModal.cancel_btn')}
        </Button>
        <Button
          type="submit"
          form="settings-general-form"
          variant="primary"
          loading={loading}
        >
          {t('settingsModal.save_btn')}
        </Button>
      </>
    );
  }

  return (
    <Button variant="secondary" onClick={onClose}>
      {t('batchModal.done_btn')}
    </Button>
  );
}
