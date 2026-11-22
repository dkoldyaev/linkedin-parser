'use client';

import { useMemo } from 'react';
import {
  PageLayout,
  Spinner,
  AlertBanner,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { useGridScroll } from '../utils/useGridScroll';
import { buildStatsViewModel } from './statsHelpers';
import { useStatsData } from './useStatsData';
import StatsHeader from './StatsHeader';
import StatsKpiGrid from './StatsKpiGrid';
import StatsHeatmapSection from './StatsHeatmapSection';
import StatsBarChartSection from './StatsBarChartSection';
import StatsByStatusSection from './StatsByStatusSection';

export default function StatsPage() {
  const { t, locale } = useTranslation();
  const { data, error } = useStatsData();
  const snapScroll = useGridScroll();

  const view = useMemo(() => buildStatsViewModel(data), [data]);

  if (error) {
    return (
      <PageLayout gridDeps={[locale]} className="stats-page">
        <div style={{ padding: 'var(--ui-space-4)' }}>
          <AlertBanner tone="danger" title={t('pages.stats.error')} />
        </div>
      </PageLayout>
    );
  }

  if (!view || !data) {
    return (
      <PageLayout gridDeps={[locale]} className="stats-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(8 * var(--ui-grid-cell))' }}>
          <Spinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  const doneToday = view.markedToday + view.addedToday > 0;

  return (
    <PageLayout
      gridDeps={[locale]}
      className="stats-page"
      header={<StatsHeader doneToday={doneToday} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-6)', padding: 'var(--ui-space-4)' }}>
        <StatsKpiGrid view={view} doneToday={doneToday} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--ui-space-4)',
          }}
        >
          <StatsHeatmapSection view={view} totalVacancies={data.total} snapScroll={snapScroll} />
          <StatsBarChartSection view={view} snapScroll={snapScroll} />
          <StatsByStatusSection view={view} totalVacancies={data.total} snapScroll={snapScroll} />
        </div>
      </div>
    </PageLayout>
  );
}
