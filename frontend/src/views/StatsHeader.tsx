import { Badge, Icon, Text } from '@blueprint/ui-kit';
import { Flame } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export interface StatsHeaderProps {
  doneToday: boolean;
}

const FLAME_ICON = <Icon icon={Flame} size="xs" />;

export default function StatsHeader({ doneToday }: StatsHeaderProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      className="bp-subbar bp-snap"
      data-min-grids="1"
      style={{
        height: 'var(--ui-grid-cell)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--ui-space-4)',
        backgroundColor: 'var(--ui-bg-surface)',
        borderBottom: '1px solid var(--ui-pixel-line)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
        <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--ui-success)' }} />
        <Text variant="mono" weight="bold" tone="primary">
          {t('pages.stats.title')}
        </Text>
        <Text variant="mono" tone="muted">
          /
        </Text>
        <Text variant="caption" tone="secondary">
          {t('pages.stats.subtitle')}
        </Text>
      </div>
      <div>
        <Badge
          variant={doneToday ? 'solid' : 'outline'}
          tone={doneToday ? 'success' : 'warning'}
          size="sm"
          icon={FLAME_ICON}
        >
          {doneToday ? t('pages.stats.streak_done') : t('pages.stats.streak_todo')}
        </Badge>
      </div>
    </div>
  );
}
