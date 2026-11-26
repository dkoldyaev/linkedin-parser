import { Badge, Button, Icon, ModalBody, ModalFooter, Text } from '@blueprint/ui-kit';
import { CheckCircle } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export interface BatchResultItem {
  url: string;
  status: string;
}

export interface BatchImportResult {
  status?: string;
  queued: number;
  results?: BatchResultItem[];
}

export interface BatchImportResultViewProps {
  result: BatchImportResult;
  onClose: () => void;
}

const ITEM_ROW_STYLE: React.CSSProperties = {
  padding: 'var(--ui-space-2)',
  borderBottom: '1px solid var(--ui-border-subtle)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const URL_TEXT_STYLE: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '300px',
};

export default function BatchImportResultView({
  result,
  onClose,
}: BatchImportResultViewProps): React.ReactElement {
  const { t } = useTranslation();
  const items = result.results || [];

  return (
    <>
      <ModalBody>
        <div style={{ textAlign: 'center', padding: 'var(--ui-space-6) 0' }}>
          <Icon
            icon={CheckCircle}
            size="xl"
            tone="success"
            style={{ margin: '0 auto var(--ui-space-4)' }}
          />
          <Text
            as="h3"
            variant="display"
            weight="bold"
            style={{ marginBottom: 'var(--ui-space-2)' }}
          >
            {t('batchModal.success_title')}
          </Text>
          <Text
            variant="body"
            tone="secondary"
            style={{ marginBottom: 'var(--ui-space-4)', display: 'block' }}
          >
            {t('batchModal.success_desc', { count: result.queued })}
          </Text>

          {items.length > 0 && (
            <div
              style={{
                textAlign: 'left',
                marginTop: 'var(--ui-space-4)',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              <Text
                variant="caption"
                weight="bold"
                style={{ marginBottom: 'var(--ui-space-2)', display: 'block' }}
              >
                {t('batchModal.details_label')}
              </Text>
              {items.map((r, i) => (
                <div key={i} style={ITEM_ROW_STYLE}>
                  <Text variant="mono" tone="secondary" style={URL_TEXT_STYLE}>
                    {r.url}
                  </Text>
                  <Badge
                    variant="outline"
                    size="xs"
                    tone={r.status === 'queued' ? 'success' : 'neutral'}
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter justify="end">
        <Button variant="primary" onClick={onClose}>
          {t('batchModal.done_btn')}
        </Button>
      </ModalFooter>
    </>
  );
}
