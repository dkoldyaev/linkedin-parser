'use client';

import {
  Text,
  Badge,
  TableHeader,
  StatusDot,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export default function AboutOverviewSection() {
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
          [ 01 ]
        </Text>
        <StatusDot tone="accent" size="md" />
        <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
          OVERVIEW
        </Text>
      </TableHeader>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 0,
        }}
      >
        <div
          style={{
            padding: 'var(--ui-space-4)',
            borderRight: '1px solid var(--ui-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ui-space-2)',
          }}
        >
          <Badge variant="outline" size="xs" tone="accent">
            01.1
          </Badge>
          <Text variant="body" tone="secondary">
            {t('pages.about.p1')}
          </Text>
        </div>
        <div
          style={{
            padding: 'var(--ui-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ui-space-2)',
          }}
        >
          <Badge variant="outline" size="xs" tone="accent">
            01.2
          </Badge>
          <Text variant="body" tone="secondary">
            {t('pages.about.p2')}
          </Text>
        </div>
      </div>
    </section>
  );
}
