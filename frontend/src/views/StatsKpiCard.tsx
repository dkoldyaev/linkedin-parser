import React from 'react';
import { Text } from '@blueprint/ui-kit';

export interface StatsKpiCardProps {
  id?: string;
  iconColor: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
}

const KPI_CARD_STYLE: React.CSSProperties = {
  padding: 'var(--ui-space-4)',
  backgroundColor: 'var(--ui-bg-card-fill)',
  border: '1px solid var(--ui-border-subtle)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ui-space-3)',
};

export default function StatsKpiCard({
  id,
  iconColor,
  icon,
  label,
  value,
  subtext,
}: StatsKpiCardProps): React.ReactElement {
  return (
    <div id={id} style={KPI_CARD_STYLE}>
      <div style={{ color: iconColor }}>
        {icon}
      </div>
      <div>
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
        <Text variant="title" weight="bold" tone="primary">
          {value}
        </Text>
        <Text variant="caption" tone="muted">
          {subtext}
        </Text>
      </div>
    </div>
  );
}
