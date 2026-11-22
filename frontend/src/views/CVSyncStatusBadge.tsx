import React from 'react';
import { CheckCircle2, AlertTriangle, Edit3 } from 'lucide-react';
import { Badge, Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import type { CVSyncStatus } from './cv.types';

export interface CVSyncStatusBadgeProps {
  syncStatus: CVSyncStatus;
  approvedRevision: number;
}

const CHECK_ICON_2XS = <Icon icon={CheckCircle2} size="2xs" />;
const ALERT_ICON_2XS = <Icon icon={AlertTriangle} size="2xs" />;
const EDIT_ICON_2XS = <Icon icon={Edit3} size="2xs" />;

export default function CVSyncStatusBadge({
  syncStatus,
  approvedRevision,
}: CVSyncStatusBadgeProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (syncStatus === 'approved') {
    return (
      <Badge variant="solid" tone="success" size="xs" icon={CHECK_ICON_2XS}>
        {t('pages.cv.saved_on_server', { rev: approvedRevision })}
      </Badge>
    );
  }
  if (syncStatus === 'outdated') {
    return (
      <Badge variant="outline" tone="warning" size="xs" icon={ALERT_ICON_2XS}>
        {t('pages.cv.modified_locally')}
      </Badge>
    );
  }
  if (syncStatus === 'draft') {
    return (
      <Badge variant="outline" tone="accent" size="xs" icon={EDIT_ICON_2XS}>
        {t('pages.cv.local_draft')}
      </Badge>
    );
  }
  return null;
}
