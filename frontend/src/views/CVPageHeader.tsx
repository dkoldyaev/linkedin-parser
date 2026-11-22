import React from 'react';
import { Text } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import CVSyncStatusBadge from './CVSyncStatusBadge';
import type { CVSyncStatus } from './cv.types';

export interface CVPageHeaderProps {
  syncStatus: CVSyncStatus;
  approvedRevision: number;
}

const SUBBAR_STYLE: React.CSSProperties = {
  height: 'var(--ui-grid-cell)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 var(--ui-space-4)',
  backgroundColor: 'var(--ui-bg-surface)',
  borderBottom: '1px solid var(--ui-pixel-line)',
};

export default function CVPageHeader({
  syncStatus,
  approvedRevision,
}: CVPageHeaderProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="bp-subbar bp-snap" data-min-grids="1" style={SUBBAR_STYLE}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
        <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--ui-primary)' }} />
        <Text variant="mono" weight="bold" tone="primary">
          {t('pages.cv.title')}
        </Text>
        <Text variant="mono" tone="muted">
          /
        </Text>
        <Text variant="caption" tone="secondary">
          {t('pages.cv.subtitle')}
        </Text>
      </div>

      <CVSyncStatusBadge syncStatus={syncStatus} approvedRevision={approvedRevision} />
    </div>
  );
}
