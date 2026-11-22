import React from 'react';
import { Badge, Icon } from '@blueprint/ui-kit';
import { Ban } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export interface KanbanCardStatusIndicatorsProps {
  stageLabel?: string;
  isClosed?: boolean;
}

const BAN_ICON = <Icon icon={Ban} size="2xs" />;

export default function KanbanCardStatusIndicators({
  stageLabel,
  isClosed,
}: KanbanCardStatusIndicatorsProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      {stageLabel ? (
        <Badge variant="outline" size="xs" tone="info">
          {stageLabel}
        </Badge>
      ) : null}
      {isClosed ? (
        <Badge variant="solid" size="xs" tone="danger" icon={BAN_ICON}>
          {t('kanban.closed')}
        </Badge>
      ) : null}
    </>
  );
}
