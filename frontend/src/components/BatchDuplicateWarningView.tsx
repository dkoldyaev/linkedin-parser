import React from 'react';
import {
  ModalBody,
  ModalFooter,
  Button,
  Text,
  AlertBanner,
  Badge,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface DuplicateVacancyItem {
  id: number | string;
  title?: string;
  company?: string;
  status?: string;
  url: string;
}

export interface DuplicateWarningState {
  duplicates: DuplicateVacancyItem[];
  urls: string[];
  defaultTags: string[];
  requiresExtension?: boolean;
}

export interface BatchDuplicateWarningViewProps {
  duplicates: DuplicateVacancyItem[];
  loading: boolean;
  onCancel: () => void;
  onProceed: () => void;
}

const LIST_STYLE: React.CSSProperties = {
  marginTop: 'var(--ui-space-4)',
  maxHeight: '240px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-space-2)',
};

const ITEM_STYLE: React.CSSProperties = {
  padding: 'var(--ui-space-2-5)',
  background: 'var(--ui-bg-subtle)',
  border: '1px solid var(--ui-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const TRUNCATE_MONO_STYLE: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export default function BatchDuplicateWarningView({
  duplicates,
  loading,
  onCancel,
  onProceed,
}: BatchDuplicateWarningViewProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <ModalBody>
        <AlertBanner
          tone="warning"
          title={t('batchModal.duplicate_warning_title')}
        >
          {t('batchModal.duplicate_warning_desc')}
        </AlertBanner>

        <div style={LIST_STYLE}>
          {duplicates.map((dup) => (
            <div key={dup.id} style={ITEM_STYLE}>
              <Text variant="body" weight="medium">
                {dup.title || dup.url}
              </Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" tone="secondary">
                  {dup.company || 'Unknown'}
                </Text>
                {dup.status && (
                  <Badge variant="outline" size="xs" tone="primary">
                    {dup.status}
                  </Badge>
                )}
              </div>
              <Text variant="mono" tone="muted" style={TRUNCATE_MONO_STYLE}>
                {dup.url}
              </Text>
            </div>
          ))}
        </div>
      </ModalBody>

      <ModalFooter justify="end">
        <ModalFooter.Actions>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {t('batchModal.duplicate_warning_cancel')}
          </Button>
          <Button
            variant="warning"
            onClick={onProceed}
            disabled={loading}
            loading={loading}
          >
            {t('batchModal.duplicate_warning_proceed')}
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </>
  );
}
