import React from 'react';
import { Text } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface StatsStatusRowProps {
  status: string;
  count: number;
  totalVacancies: number;
}

export default function StatsStatusRow({
  status,
  count,
  totalVacancies,
}: StatsStatusRowProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      className="status-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '8px',
      }}
    >
      <Text
        variant="body-sm"
        tone="primary"
        style={{ width: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {t(`kanban.columns.${status}`)}
      </Text>
      <span className="chart-track" aria-label={`${count} / ${totalVacancies}`} style={{ flex: 1 }}>
        <span className="chart-marked" style={{ width: `${(count / Math.max(totalVacancies, 1)) * 100}%` }} />
      </span>
      <Text variant="mono" weight="bold" tone="primary" style={{ width: '40px', textAlign: 'right' }}>
        {count}
      </Text>
    </div>
  );
}
