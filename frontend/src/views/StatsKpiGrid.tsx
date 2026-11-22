'use client';

import React from 'react';
import { Flame, Trophy, CalendarCheck, PlusCircle } from 'lucide-react';
import { Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import StatsKpiCard from './StatsKpiCard';
import type { StatsViewModel } from './statsHelpers';

export interface StatsKpiGridProps {
  view: StatsViewModel;
  doneToday: boolean;
}

const FLAME_ICON = <Icon icon={Flame} size="md" />;
const TROPHY_ICON = <Icon icon={Trophy} size="md" />;
const CALENDAR_ICON = <Icon icon={CalendarCheck} size="md" />;
const PLUS_ICON = <Icon icon={PlusCircle} size="md" />;

export default function StatsKpiGrid({ view, doneToday }: StatsKpiGridProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--ui-space-4)',
      }}
    >
      <StatsKpiCard
        id="stat-streak"
        iconColor={doneToday ? 'var(--ui-success)' : 'var(--ui-warning)'}
        icon={FLAME_ICON}
        label={t('pages.stats.kpi_streak')}
        value={view.streaks.current}
        subtext={doneToday ? t('pages.stats.streak_done') : t('pages.stats.streak_todo')}
      />

      <StatsKpiCard
        id="stat-max-streak"
        iconColor="var(--ui-accent)"
        icon={TROPHY_ICON}
        label={t('pages.stats.kpi_max_streak')}
        value={view.streaks.best}
        subtext={t('pages.stats.best_result')}
      />

      <StatsKpiCard
        id="stat-marked-today"
        iconColor="var(--ui-primary)"
        icon={CALENDAR_ICON}
        label={t('pages.stats.kpi_marked_today')}
        value={view.markedToday}
        subtext={t('pages.stats.moved_today')}
      />

      <StatsKpiCard
        id="stat-added-today"
        iconColor="var(--ui-info, #0284c7)"
        icon={PLUS_ICON}
        label={t('pages.stats.kpi_added_today')}
        value={view.addedToday}
        subtext={t('pages.stats.created_today')}
      />
    </div>
  );
}
