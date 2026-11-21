'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Columns3, Flame, Puzzle, ArrowRight } from 'lucide-react';
import {
  PageLayout,
  Button,
  Icon,
  Text,
  Badge,
  TableHeader,
  StatusDot,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

const FEATURES = [
  { key: 'ai', icon: Sparkles, color: '#2563eb' },
  { key: 'kanban', icon: Columns3, color: '#0284c7' },
  { key: 'streak', icon: Flame, color: '#d97706' },
  { key: 'extension', icon: Puzzle, color: '#059669' },
];

export default function AboutPage() {
  const { t, locale } = useTranslation();

  return (
    <PageLayout
      gridDeps={[locale]}
      className="about-page"
      header={
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
            <Button
              as={Link}
              href="/howtouse"
              variant="primary"
              size="sm"
              endIcon={<Icon icon={ArrowRight} size="xs" />}
            >
              {t('pages.about.cta')}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-6)', padding: 'var(--ui-space-4)' }}>
        {/* Overview Split Block */}
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

        {/* 4-Column Feature Grid */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--ui-space-4)',
          }}
        >
          {FEATURES.map(({ key, icon: IconComponent, color }, idx) => (
            <div
              key={key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--ui-bg-card-fill)',
                border: '1px solid var(--ui-border-subtle)',
              }}
            >
              <TableHeader size="sm">
                <Text as="span" variant="mono" weight="semibold" tone="accent">
                  {`[ ${String(idx + 2).padStart(2, '0')} ]`}
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
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'var(--ui-bg-subtle)',
                    border: '1px solid var(--ui-border-subtle)',
                  }}
                >
                  <Icon icon={IconComponent} size="sm" style={{ color }} />
                </div>
                <Text variant="body-sm" tone="secondary">
                  {t(`pages.about.f_${key}_desc`)}
                </Text>
              </div>
            </div>
          ))}
        </section>

        {/* Footer CTA Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--ui-space-4)' }}>
          <Button
            as={Link}
            href="/howtouse"
            variant="secondary"
            size="md"
            endIcon={<Icon icon={ArrowRight} size="xs" />}
          >
            {t('pages.about.cta')}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
