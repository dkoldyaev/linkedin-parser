import { Icon, StatusDot, TableHeader, Text } from '@blueprint/ui-kit';
import type { LucideIcon } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export interface AboutFeature {
  key: string;
  icon: LucideIcon;
  color: string;
}

export interface AboutFeatureCardProps {
  feature: AboutFeature;
  index: number;
}

export default function AboutFeatureCard({
  feature,
  index,
}: AboutFeatureCardProps): React.ReactElement {
  const { t } = useTranslation();
  const { key, icon: IconComponent, color } = feature;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--ui-bg-card-fill)',
        border: '1px solid var(--ui-border-subtle)',
      }}
    >
      <TableHeader size="sm">
        <Text as="span" variant="mono" weight="semibold" tone="accent">
          {`[ ${String(index + 2).padStart(2, '0')} ]`}
        </Text>
        <StatusDot color={color} size="md" />
        <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
          {t(`pages.about.f_${key}_title`)}
        </Text>
      </TableHeader>
      <div
        style={{
          padding: 'var(--ui-space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ui-space-3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ui-space-3)',
          }}
        >
          <div
            style={{
              padding: 'var(--ui-space-2)',
              backgroundColor: 'var(--ui-bg-surface)',
              border: '1px solid var(--ui-border-subtle)',
              color,
            }}
          >
            <Icon icon={IconComponent} size="md" />
          </div>
          <Text variant="mono" weight="medium" tone="primary">
            {t(`pages.about.f_${key}_headline`)}
          </Text>
        </div>
        <Text variant="body" tone="secondary">
          {t(`pages.about.f_${key}_desc`)}
        </Text>
      </div>
    </div>
  );
}
