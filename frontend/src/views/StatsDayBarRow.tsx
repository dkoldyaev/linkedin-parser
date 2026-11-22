import React from 'react';
import { useTranslation } from '../i18n/I18nContext';
import type { DayBarItem } from './statsHelpers';

export interface StatsDayBarRowProps {
  item: DayBarItem;
  barMax: number;
}

export default function StatsDayBarRow({
  item,
  barMax,
}: StatsDayBarRowProps): React.ReactElement {
  const { t, formatDate } = useTranslation();
  const total = item.marked + item.added;
  const width = 20;
  const filled = Math.round((total / barMax) * width);
  const marked = total ? Math.round((item.marked / total) * filled) : 0;

  return (
    <div
      className="ascii-day-row"
      title={`${formatDate(item.date)}: ${t('pages.stats.marked')} ${item.marked}, ${t('pages.stats.added')} ${item.added}`}
    >
      <span className="ascii-day-date">{formatDate(item.date, { day: '2-digit', month: '2-digit' })}</span>
      <span className="chart-track" aria-hidden="true">
        <span className="chart-marked" style={{ width: `${(marked / width) * 100}%` }} />
        <span className="chart-added" style={{ width: `${((filled - marked) / width) * 100}%` }} />
      </span>
      <span className="ascii-day-total">{total}</span>
    </div>
  );
}
