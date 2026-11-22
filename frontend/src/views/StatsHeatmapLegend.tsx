import React from 'react';
import { Text } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

const LEVELS = [0, 1, 2, 3, 4];

export default function StatsHeatmapLegend(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      className="heatmap-legend"
      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
    >
      <Text variant="caption" tone="muted">
        {t('pages.stats.less')}
      </Text>
      {LEVELS.map((l) => (
        <span key={l} className={`heatmap-cell lvl-${l}`} aria-hidden="true" />
      ))}
      <Text variant="caption" tone="muted">
        {t('pages.stats.more')}
      </Text>
    </div>
  );
}
