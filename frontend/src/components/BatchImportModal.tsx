import React from 'react';
import { UploadCloud } from 'lucide-react';
import { Modal, ModalHeader, Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import ExtensionPromptModal from './ExtensionPromptModal';
import BatchDuplicateWarningView from './BatchDuplicateWarningView';
import BatchImportResultView from './BatchImportResultView';
import BatchImportFormView from './BatchImportFormView';
import { useBatchImportController } from './useBatchImportController';

export interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
  queueRemaining?: number;
}

const UPLOAD_ICON = <Icon icon={UploadCloud} size="md" tone="accent" />;

export default function BatchImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: BatchImportModalProps): React.ReactElement | null {
  const { t } = useTranslation();
  const ctrl = useBatchImportController(onClose, onImportComplete);

  if (!isOpen) return null;

  let bodyView = (
    <BatchImportFormView
      urlsText={ctrl.urlsText}
      onUrlsChange={ctrl.setUrlsText}
      tagsInput={ctrl.tagsInput}
      onTagsChange={ctrl.setTagsInput}
      loading={ctrl.loading}
      error={ctrl.error}
      onCancel={ctrl.handleClose}
      onSubmit={ctrl.handleSubmit}
    />
  );

  if (ctrl.duplicateWarning) {
    bodyView = (
      <BatchDuplicateWarningView
        duplicates={ctrl.duplicateWarning.duplicates}
        loading={ctrl.loading}
        onCancel={() => ctrl.setDuplicateWarning(null)}
        onProceed={ctrl.handleProceedDuplicates}
      />
    );
  } else if (ctrl.result) {
    bodyView = <BatchImportResultView result={ctrl.result} onClose={ctrl.handleClose} />;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={ctrl.handleClose} size="lg">
        <ModalHeader
          title={t('batchModal.title')}
          icon={UPLOAD_ICON}
          onClose={ctrl.handleClose}
        />
        {bodyView}
      </Modal>

      {ctrl.showExtModal && (
        <ExtensionPromptModal
          isOpen={ctrl.showExtModal}
          onClose={ctrl.handleExtClose}
          reason={ctrl.extModalInfo?.reason}
          onProceed={ctrl.handleExtProceed}
        />
      )}
    </>
  );
}
