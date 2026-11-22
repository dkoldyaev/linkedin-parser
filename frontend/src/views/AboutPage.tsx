'use client';

import Link from 'next/link';
import { Sparkles, Columns3, Flame, Puzzle, ArrowRight } from 'lucide-react';
import {
  PageLayout,
  Button,
  Icon,
  Text,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import AboutOverviewSection from './AboutOverviewSection';
import AboutFeatureCard from './AboutFeatureCard';

const FEATURES = [
  { key: 'ai', icon: Sparkles, color: '#2563eb' },
  { key: 'kanban', icon: Columns3, color: '#0284c7' },
  { key: 'streak', icon: Flame, color: '#d97706' },
  { key: 'extension', icon: Puzzle, color: '#059669' },
];

const ARROW_RIGHT_ICON = <Icon icon={ArrowRight} size="xs" />;

export default function AboutPage() {
  const { t, locale } = useTranslation();

  const headerContent = (
    <div
      className="bp-subbar bp-snap"
      data-min-grids="1"
      style={{
        height: 'var(--ui-grid-cell)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--ui-space-4)',
        backgroundColor: 'var(--ui-bg-surface)',
        borderBottom: '1px solid var(--ui-pixel-line)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
        <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--ui-primary)' }} />
        <Text variant="mono" weight="bold" tone="primary">
          {t('pages.about.title')}
        </Text>
        <Text variant="mono" tone="muted">
          /
        </Text>
        <Text variant="caption" tone="secondary">
          {t('pages.about.subtitle')}
        </Text>
      </div>
      <div>
        <Button asChild variant="primary" size="sm">
          <Link href="/howtouse" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>{t('pages.about.cta')}</span>
            {ARROW_RIGHT_ICON}
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <PageLayout gridDeps={[locale]} className="about-page" header={headerContent}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-6)', padding: 'var(--ui-space-4)' }}>
        <AboutOverviewSection />
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--ui-space-4)',
          }}
        >
          {FEATURES.map((feature, idx) => (
            <AboutFeatureCard key={feature.key} feature={feature} index={idx} />
          ))}
        </section>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--ui-space-4)' }}>
          <Button asChild variant="secondary" size="md">
            <Link href="/howtouse" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>{t('pages.about.cta')}</span>
              {ARROW_RIGHT_ICON}
            </Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
