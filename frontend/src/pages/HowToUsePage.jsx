import React from 'react';
import { Download } from 'lucide-react';
import {
  PageLayout,
  Button,
  Icon,
  Text,
  Badge,
  TableHeader,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

const INSTALL_STEPS = [1, 2, 3, 4, 5];
const USE_STEPS = [1, 2, 3, 4];
const TROUBLE = [1, 2, 3, 4, 5];

export default function HowToUsePage() {
  const { t, locale } = useTranslation();

  return (
    <PageLayout
      gridDeps={[locale]}
      className="howto-page"
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
              {t('pages.howto.title')}
            </Text>
            <Text variant="mono" tone="muted">
              /
            </Text>
            <Text variant="caption" tone="secondary">
              {t('pages.howto.subtitle')}
            </Text>
          </div>
          <div>
            <Button
              as="a"
              href="/extension.zip"
              download
              variant="primary"
              size="sm"
              startIcon={<Icon icon={Download} size="xs" />}
            >
              {t('pages.howto.download')}
            </Button>
          </div>
        </div>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--ui-space-4)',
          padding: 'var(--ui-space-4)',
        }}
      >
        {/* Column 1: Extension Installation */}
        <section
          id="howto-install"
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--ui-bg-card-fill)',
            border: '1px solid var(--ui-border-subtle)',
          }}
        >
          <TableHeader
            size="sm"
            index="[ 01 ]"
            indicatorTone="accent"
            title={t('pages.howto.install_title')}
            badge={INSTALL_STEPS.length}
            actions={
              <Badge variant="outline" size="xs" tone="accent">
                INSTALL
              </Badge>
            }
          />

          <div style={{ padding: 'var(--ui-space-4)', borderBottom: '1px solid var(--ui-border-subtle)' }}>
            <Text variant="body-sm" tone="secondary">
              {t('pages.howto.install_intro')}
            </Text>
          </div>

          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {INSTALL_STEPS.map((n) => (
              <li
                key={n}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--ui-space-3)',
                  padding: 'var(--ui-space-3) var(--ui-space-4)',
                  borderBottom: '1px solid var(--ui-border-subtle)',
                }}
              >
                <Badge variant="outline" size="xs" tone="accent" style={{ flexShrink: 0 }}>
                  {String(n).padStart(2, '0')}
                </Badge>
                <Text variant="body-sm" tone="primary">
                  {t(`pages.howto.install_${n}`)}
                </Text>
              </li>
            ))}
          </ol>

          <div style={{ padding: 'var(--ui-space-4)', marginTop: 'auto' }}>
            <Button
              as="a"
              href="/extension.zip"
              download
              variant="primary"
              size="sm"
              startIcon={<Icon icon={Download} size="xs" />}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {t('pages.howto.download')}
            </Button>
          </div>
        </section>

        {/* Column 2: Workflow */}
        <section
          id="howto-use"
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--ui-bg-card-fill)',
            border: '1px solid var(--ui-border-subtle)',
          }}
        >
          <TableHeader
            size="sm"
            index="[ 02 ]"
            indicatorTone="success"
            title={t('pages.howto.use_title')}
            badge={USE_STEPS.length}
            actions={
              <Badge variant="outline" size="xs" tone="success">
                WORKFLOW
              </Badge>
            }
          />

          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {USE_STEPS.map((n) => (
              <li
                key={n}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--ui-space-3)',
                  padding: 'var(--ui-space-3) var(--ui-space-4)',
                  borderBottom: '1px solid var(--ui-border-subtle)',
                }}
              >
                <Badge variant="outline" size="xs" tone="success" style={{ flexShrink: 0 }}>
                  {String(n).padStart(2, '0')}
                </Badge>
                <Text variant="body-sm" tone="primary">
                  {t(`pages.howto.use_${n}`)}
                </Text>
              </li>
            ))}
          </ol>
        </section>

        {/* Column 3: Troubleshooting */}
        <section
          id="howto-trouble"
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--ui-bg-card-fill)',
            border: '1px solid var(--ui-border-subtle)',
          }}
        >
          <TableHeader
            size="sm"
            index="[ 03 ]"
            indicatorTone="warning"
            title={t('pages.howto.trouble_title')}
            badge={TROUBLE.length}
            actions={
              <Badge variant="outline" size="xs" tone="warning">
                SUPPORT
              </Badge>
            }
          />

          <div style={{ padding: 'var(--ui-space-4)', borderBottom: '1px solid var(--ui-border-subtle)' }}>
            <Text variant="body-sm" tone="secondary">
              {t('pages.howto.trouble_intro')}
            </Text>
          </div>

          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {TROUBLE.map((n) => (
              <li
                key={n}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--ui-space-3)',
                  padding: 'var(--ui-space-3) var(--ui-space-4)',
                  borderBottom: '1px solid var(--ui-border-subtle)',
                }}
              >
                <Badge variant="outline" size="xs" tone="warning" style={{ flexShrink: 0 }}>
                  {String(n).padStart(2, '0')}
                </Badge>
                <Text variant="body-sm" tone="primary">
                  {t(`pages.howto.trouble_${n}`)}
                </Text>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PageLayout>
  );
}
