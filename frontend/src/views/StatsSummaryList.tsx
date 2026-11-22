import React from 'react';
import { Text } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface StatsSummaryListProps {
  totalVacancies: number;
  last7: number;
  last30: number;
  activeDays: number;
}

const SUMMARY_ITEM_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: 'var(--ui-space-2) var(--ui-space-4)',
  borderBottom: '1px solid var(--ui-border-subtle)',
};

export default function StatsSummaryList({
  totalVacancies,
  last7,
  last30,
  activeDays,
}: StatsSummaryListProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <ul className="summary-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <li style={SUMMARY_ITEM_STYLE}>
        <Text variant="body-sm" tone="secondary">{t('pages.stats.total_vacancies')}</Text>
        <Text variant="mono" weight="bold" tone="primary">{totalVacancies}</Text>
      </li>
      <li style={SUMMARY_ITEM_STYLE}>
        <Text variant="body-sm" tone="secondary">{t('pages.stats.last7')}</Text>
        <Text variant="mono" weight="bold" tone="primary">{last7}</Text>
      </li>
      <li style={SUMMARY_ITEM_STYLE}>
        <Text variant="body-sm" tone="secondary">{t('pages.stats.last30')}</Text>
        <Text variant="mono" weight="bold" tone="primary">{last30}</Text>
      </li>
      <li style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--ui-space-2) var(--ui-space-4)' }}>
        <Text variant="body-sm" tone="secondary">{t('pages.stats.active_days')}</Text>
        <Text variant="mono" weight="bold" tone="primary">{activeDays}</Text>
      </li>
    </ul>
  );
}
