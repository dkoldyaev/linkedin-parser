import React from 'react';
import {
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Input,
  Text,
  AlertBanner,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface BatchImportFormViewProps {
  urlsText: string;
  onUrlsChange: (val: string) => void;
  tagsInput: string;
  onTagsChange: (val: string) => void;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BatchImportFormView({
  urlsText,
  onUrlsChange,
  tagsInput,
  onTagsChange,
  loading,
  error,
  onCancel,
  onSubmit,
}: BatchImportFormViewProps): React.ReactElement {
  const { t } = useTranslation();
  const isSubmitDisabled = loading || !urlsText.trim();

  return (
    <form onSubmit={onSubmit}>
      <ModalBody>
        {error && (
          <AlertBanner
            tone="danger"
            title={error}
            style={{ marginBottom: 'var(--ui-space-4)' }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1)' }}>
            <Text as="label" variant="caption" weight="medium">
              {t('batchModal.urls_label')}
            </Text>
            <Textarea
              value={urlsText}
              onChange={(e) => onUrlsChange(e.target.value)}
              placeholder={t('batchModal.urls_placeholder')}
              rows={6}
              disabled={loading}
              autoFocus
            />
            <Text variant="caption" tone="muted">
              {t('batchModal.urls_hint')}
            </Text>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1)' }}>
            <Text as="label" variant="caption" weight="medium">
              {t('batchModal.tags_label')}
            </Text>
            <Input
              type="text"
              value={tagsInput}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder={t('batchModal.tags_placeholder')}
              disabled={loading}
            />
            <Text variant="caption" tone="muted">
              {t('batchModal.tags_hint')}
            </Text>
          </div>
        </div>
      </ModalBody>

      <ModalFooter justify="end">
        <ModalFooter.Actions>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {t('batchModal.cancel_btn')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitDisabled}
            loading={loading}
          >
            {t('batchModal.submit_btn')}
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </form>
  );
}
