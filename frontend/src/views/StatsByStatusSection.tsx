import { Badge, StatusDot, TableHeader, Text } from '@blueprint/ui-kit';
import React from 'react';
import StatsStatusRow from './StatsStatusRow';
import type { StatsViewModel } from './statsHelpers';
import { useTranslation } from '../i18n/I18nContext';

export interface StatsByStatusSectionProps {
  view: StatsViewModel;
  totalVacancies: number;
  snapScroll: (event: React.UIEvent<HTMLElement>, axis?: 'x' | 'y') => void;
}

export default function StatsByStatusSection({
  view,
  totalVacancies,
  snapScroll,
}: StatsByStatusSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--ui-bg-card-fill)',
        border: '1px solid var(--ui-border-subtle)',
      }}
    >
      <TableHeader size="sm">
        <Text as="span" variant="mono" weight="semibold" tone="accent">
          [ 04 ]
        </Text>
        <StatusDot tone="accent" size="md" />
        <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
          {t('pages.stats.by_status')}
        </Text>
        <Badge variant="counter" size="xs" tone="neutral">
          {totalVacancies}
        </Badge>
      </TableHeader>

      <div
        className="by-status-box bp-snap"
        data-min-grids="4"
        style={{
          padding: 'var(--ui-space-4)',
          overflowY: 'auto',
          maxHeight: 'calc(8 * var(--ui-grid-cell))',
        }}
        onScroll={(event) => snapScroll(event, 'y')}
      >
        {view.statuses.map(([status, count]) => (
          <StatsStatusRow
            key={status}
            status={status}
            count={count}
            totalVacancies={totalVacancies}
          />
        ))}
      </div>
    </section>
  );
}
