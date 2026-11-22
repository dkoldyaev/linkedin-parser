import React from 'react';
import {
  TableHeader,
  Text,
  Badge,
  Textarea,
  StatusDot,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import CVToolbarActions from './CVToolbarActions';
import type { CVSyncStatus, ServerCVData } from './cv.types';

export interface CVEditorSectionProps {
  sourceText: string;
  sourceRevision: number;
  filename: string;
  syncStatus: CVSyncStatus;
  serverCV: ServerCVData | null;
  isSubmitting: boolean;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveToServer: () => void;
  onDeleteServerCV: () => void;
  onClearLocal: () => void;
}

const SECTION_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--ui-bg-card-fill)',
  border: '1px solid var(--ui-border-subtle)',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--ui-font-mono)',
  fontSize: 'var(--ui-font-size-xs)',
};

export default function CVEditorSection({
  sourceText,
  sourceRevision,
  filename,
  syncStatus,
  serverCV,
  isSubmitting,
  onTextChange,
  onFileUpload,
  onSaveToServer,
  onDeleteServerCV,
  onClearLocal,
}: CVEditorSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const headerTitle = sourceText
    ? t('pages.cv.content_header', { filename: filename || t('pages.cv.current_document') })
    : t('pages.cv.no_cv_title');

  return (
    <section style={SECTION_STYLE}>
      <TableHeader
        size="sm"
        actions={
          <CVToolbarActions
            sourceText={sourceText}
            syncStatus={syncStatus}
            serverCV={serverCV}
            isSubmitting={isSubmitting}
            onFileUpload={onFileUpload}
            onSaveToServer={onSaveToServer}
            onDeleteServerCV={onDeleteServerCV}
            onClearLocal={onClearLocal}
          />
        }
      >
        <Text as="span" variant="mono" weight="semibold" tone="accent">
          [ 01 ]
        </Text>
        <StatusDot tone={sourceText ? 'success' : 'neutral'} size="md" />
        <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
          {headerTitle}
        </Text>
        {Boolean(sourceText) && (
          <Badge variant="counter" size="xs" tone="neutral">
            {t('pages.cv.revision', { rev: sourceRevision })}
          </Badge>
        )}
      </TableHeader>

      <div style={{ padding: 'var(--ui-space-4)' }}>
        <Textarea
          value={sourceText}
          onChange={onTextChange}
          placeholder={t('pages.cv.textarea_placeholder')}
          rows={20}
          style={TEXTAREA_STYLE}
        />
      </div>
    </section>
  );
}
