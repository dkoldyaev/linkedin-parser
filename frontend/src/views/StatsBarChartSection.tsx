import { StatusDot, TableHeader, Text } from '@blueprint/ui-kit';
import { BAR_DAYS } from './statsHelpers';
import React from 'react';
import StatsDayBarRow from './StatsDayBarRow';
import type { StatsViewModel } from './statsHelpers';
import { useTranslation } from '../i18n/I18nContext';

export interface StatsBarChartSectionProps {
  view: StatsViewModel;
  snapScroll: (event: React.UIEvent<HTMLElement>, axis?: 'x' | 'y') => void;
}

export default function StatsBarChartSection({ view, snapScroll }: StatsBarChartSectionProps) {
  const { t } = useTranslation();

  const legendActions = (
    <div className="bars-legend" style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
      <Text variant="caption" tone="secondary">
        <b className="chart-key chart-marked" /> {t('pages.stats.marked')}
      </Text>
      <Text variant="caption" tone="secondary">
        <b className="chart-key chart-added" /> {t('pages.stats.added')}
      </Text>
    </div>
  );

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--ui-bg-card-fill)',
        border: '1px solid var(--ui-border-subtle)',
      }}
    >
      <TableHeader size="sm" actions={legendActions}>
        <Text as="span" variant="mono" weight="semibold" tone="accent">
          [ 03 ]
        </Text>
        <StatusDot tone="accent" size="md" />
        <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
          {t('pages.stats.chart_title', { days: BAR_DAYS })}
        </Text>
      </TableHeader>

      <div
        className="ascii-bars-box bp-snap"
        data-min-grids="4"
        style={{
          padding: 'var(--ui-space-4)',
          overflowY: 'auto',
          maxHeight: 'calc(8 * var(--ui-grid-cell))',
        }}
        onScroll={(event) => snapScroll(event, 'y')}
      >
        {view.bars.map((b) => (
          <StatsDayBarRow key={b.key} item={b} barMax={view.barMax} />
        ))}
      </div>
    </section>
  );
}
