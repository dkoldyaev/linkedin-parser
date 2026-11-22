'use client';

import React from 'react';
import {
  TableHeader,
  Badge,
  Text,
  StatusDot,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { HEATMAP_WEEKS, level } from './statsHelpers';
import StatsHeatmapLegend from './StatsHeatmapLegend';
import StatsSummaryList from './StatsSummaryList';
import type { StatsViewModel } from './statsHelpers';

export interface StatsHeatmapSectionProps {
  view: StatsViewModel;
  totalVacancies: number;
  snapScroll: (event: React.UIEvent<HTMLElement>, axis?: 'x' | 'y') => void;
}

export default function StatsHeatmapSection({
  view,
  totalVacancies,
  snapScroll,
}: StatsHeatmapSectionProps): React.ReactElement {
  const { t, formatDate } = useTranslation();

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--ui-bg-card-fill)',
        border: '1px solid var(--ui-border-subtle)',
      }}
    >
      <TableHeader size="sm" actions={<StatsHeatmapLegend />}>
        <Text as="span" variant="mono" weight="semibold" tone="accent">
          [ 01 ]
        </Text>
        <StatusDot tone="success" size="md" />
        <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
          {t('pages.stats.activity')}
        </Text>
        <Badge variant="counter" size="xs" tone="neutral">
          {`${HEATMAP_WEEKS}w`}
        </Badge>
      </TableHeader>

      <div className="bp-heatmap-box bp-snap" data-min-grids="4" style={{ padding: 'var(--ui-space-4)', borderBottom: '1px solid var(--ui-border-subtle)' }}>
        <div className="heatmap" id="stat-heatmap" onScroll={(event) => snapScroll(event, 'x')}>
          {view.weeks.map((col, i) => (
            <div className="heatmap-col" key={i}>
              {col.map((c) => {
                const lvlClass = c.future ? 'future' : level(c.count, view.max);
                const todayClass = c.key === view.todayKey ? 'today' : '';
                return (
                  <div
                    key={c.key}
                    className={`heatmap-cell lvl-${lvlClass} ${todayClass}`}
                    title={`${formatDate(c.date, { day: 'numeric', month: 'long', year: 'numeric' })}: ${c.count}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <TableHeader size="sm">
        <Text as="span" variant="mono" weight="semibold" tone="accent">
          [ 02 ]
        </Text>
        <StatusDot tone="accent" size="md" />
        <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
          {t('pages.stats.summary')}
        </Text>
      </TableHeader>

      <StatsSummaryList
        totalVacancies={totalVacancies}
        last7={view.last7}
        last30={view.last30}
        activeDays={view.activeDays}
      />
    </section>
  );
}
