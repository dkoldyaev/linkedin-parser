import { Button, Icon } from '@blueprint/ui-kit';
import { CheckCircle2, Trash2 } from 'lucide-react';
import type { CVSyncStatus, ServerCVData } from './cv.types';
import CVUploadButton from './CVUploadButton';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export interface CVToolbarActionsProps {
  sourceText: string;
  syncStatus: CVSyncStatus;
  serverCV: ServerCVData | null;
  isSubmitting: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveToServer: () => void;
  onDeleteServerCV: () => void;
  onClearLocal: () => void;
}

const CHECK_ICON = <Icon icon={CheckCircle2} size="xs" />;
const TRASH_ICON = <Icon icon={Trash2} size="xs" />;

function computeToolbarVisibility(syncStatus: CVSyncStatus, sourceText: string) {
  const trimmed = sourceText.trim();
  return {
    hasSource: Boolean(sourceText),
    showSaveBtn: syncStatus !== 'approved' && Boolean(trimmed),
    showResetBtn: Boolean(sourceText) && syncStatus !== 'none',
  };
}

export default function CVToolbarActions({
  sourceText,
  syncStatus,
  serverCV,
  isSubmitting,
  onFileUpload,
  onSaveToServer,
  onDeleteServerCV,
  onClearLocal,
}: CVToolbarActionsProps): React.ReactElement {
  const { t } = useTranslation();
  const { hasSource, showSaveBtn, showResetBtn } = computeToolbarVisibility(syncStatus, sourceText);
  const saveLabel = isSubmitting ? t('pages.cv.saving') : t('pages.cv.save_server_btn');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
      <CVUploadButton hasSource={hasSource} onFileUpload={onFileUpload} />

      {showSaveBtn && (
        <Button
          variant="primary"
          tone="success"
          size="sm"
          disabled={isSubmitting}
          onClick={onSaveToServer}
          startIcon={CHECK_ICON}
        >
          {saveLabel}
        </Button>
      )}

      {serverCV && (
        <Button
          variant="danger"
          size="sm"
          disabled={isSubmitting}
          onClick={onDeleteServerCV}
          startIcon={TRASH_ICON}
        >
          {t('pages.cv.delete_server_btn')}
        </Button>
      )}

      {showResetBtn && (
        <Button variant="ghost" size="sm" onClick={onClearLocal}>
          {t('pages.cv.reset_draft_btn')}
        </Button>
      )}
    </div>
  );
}
