import {
  Badge,
  Card,
  COLOR_TOKENS,
  Icon,
  SearchBar,
  SPACING_TOKENS,
  Text,
  TYPOGRAPHY_TOKENS,
  useCopyToClipboard,
} from '../index';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useMemo, useState } from 'react';
import { icons as lucideIcons } from 'lucide-react';
import styles from './Foundations.module.css';

const meta: Meta = {
  title: 'Foundations (Tokens)',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

const PREVIEW_CLASS_MAP: Record<string, string> = {
  '--ui-bg-main': styles['bg-primary'],
  '--ui-bg-surface': styles['bg-surface'],
  '--ui-bg-subtle': styles['bg-elevated'],
  '--ui-text-primary': styles['text-primary'],
  '--ui-text-secondary': styles['text-secondary'],
  '--ui-text-muted': styles['text-muted'],
  '--ui-border-subtle': styles['border-default'],
  '--ui-border-strong': styles['border-strong'],
  '--ui-pixel-line': styles['border-strong'],
  '--ui-primary': styles['accent-primary'],
  '--ui-success': styles['status-success'],
  '--ui-warning': styles['status-warning'],
  '--ui-danger': styles['status-danger'],
  '--ui-info': styles['status-info'],
};

const SPACING_CLASS_MAP: Record<string, string> = {
  '--ui-space-0': styles['space-0'],
  '--ui-space-0-5': styles['space-0-5'],
  '--ui-space-1': styles['space-1'],
  '--ui-space-1-5': styles['space-1-5'],
  '--ui-space-2': styles['space-2'],
  '--ui-space-2-5': styles['space-2-5'],
  '--ui-space-3': styles['space-3'],
  '--ui-space-3-5': styles['space-3-5'],
  '--ui-space-4': styles['space-4'],
  '--ui-space-5': styles['space-5'],
  '--ui-space-6': styles['space-6'],
  '--ui-space-8': styles['space-8'],
  '--ui-space-10': styles['space-10'],
  '--ui-space-12': styles['space-12'],
  '--ui-space-16': styles['space-16'],
};

function ColorsCatalog(): React.ReactElement {
  const { copiedValue, copy } = useCopyToClipboard(2000);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Text as="h2" variant="heading">
          Color Tokens (Click any card to copy CSS variable)
        </Text>
        <Text variant="caption" tone="secondary">
          Unified semantic palette replacing fragmented hex/rgba literals across index.css,
          design-system.css, and LandingPage.css.
        </Text>
      </div>
      <div className={styles.grid}>
        {COLOR_TOKENS.map((token) => {
          const isCopied = copiedValue === `var(${token.cssVar})`;
          return (
            <button
              key={token.cssVar}
              type="button"
              className={styles.swatchCard}
              onClick={() => void copy(`var(${token.cssVar})`)}
            >
              <div className={`${styles.swatchPreview} ${PREVIEW_CLASS_MAP[token.cssVar] ?? ''}`} />
              <div className={styles.swatchMeta}>
                <Badge size="sm" tone={isCopied ? 'success' : 'accent'}>
                  {isCopied ? 'COPIED TO CLIPBOARD' : token.name}
                </Badge>
                <Text variant="mono" weight="semibold">
                  {token.cssVar}
                </Text>
                <Text variant="caption" tone="secondary">
                  {token.description}
                </Text>
                <Text variant="mono" tone="muted">
                  Dark: {token.darkValue} | Light: {token.lightValue}
                </Text>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const Colors: StoryObj = {
  render: () => <ColorsCatalog />,
};

function TypographyCatalog(): React.ReactElement {
  const { copiedValue, copy } = useCopyToClipboard(2000);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Text as="h2" variant="heading">
          Typography Scale (Inter + JetBrains Mono)
        </Text>
        <Text variant="caption" tone="secondary">
          Click any row to copy the typography CSS custom property.
        </Text>
      </div>
      <div className={styles.spacingList}>
        {TYPOGRAPHY_TOKENS.map((token) => {
          const isCopied = copiedValue === `var(${token.cssVar})`;
          return (
            <Card
              key={token.cssVar}
              interactive
              onClick={() => void copy(`var(${token.cssVar})`)}
              title={token.cssVar}
              subtitle={`${token.rem} (${token.pxApprox}) — ${token.usage}`}
              headerActions={
                <Badge size="sm" tone={isCopied ? 'success' : 'neutral'}>
                  {isCopied ? 'Copied!' : 'Click to copy'}
                </Badge>
              }
            >
              <Text
                variant={
                  token.cssVar.includes('font-mono') || token.cssVar.includes('xs')
                    ? 'mono-label'
                    : token.cssVar.includes('2xl')
                      ? 'display'
                      : token.cssVar.includes('xl')
                        ? 'heading'
                        : 'body'
                }
              >
                CV.ALTER // Blueprint Architecture Grid — 0123456789
              </Text>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export const Typography: StoryObj = {
  render: () => <TypographyCatalog />,
};

function SpacingCatalog(): React.ReactElement {
  const { copiedValue, copy } = useCopyToClipboard(2000);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Text as="h2" variant="heading">
          Spacing & 32px Blueprint Grid
        </Text>
        <Text variant="caption" tone="secondary">
          All interactive controls snap to multiples of --ui-grid-unit (8px) and --ui-grid-cell
          (32px). Click any bar to copy.
        </Text>
      </div>
      <div className={styles.spacingList}>
        {SPACING_TOKENS.map((token) => {
          const isCopied = copiedValue === `var(${token.cssVar})`;
          return (
            <button
              key={token.cssVar}
              type="button"
              className={styles.spacingRow}
              onClick={() => void copy(`var(${token.cssVar})`)}
            >
              <Text variant="mono" weight="semibold">
                {token.cssVar}
              </Text>
              <div className={`${styles.spacingBar} ${SPACING_CLASS_MAP[token.cssVar] ?? ''}`} />
              {isCopied && (
                <Badge size="xs" tone="success">
                  Copied!
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const SpacingAnd32pxGrid: StoryObj = {
  name: 'Spacing & 32px Grid',
  render: () => <SpacingCatalog />,
};

const SHADOW_ITEMS = [
  {
    cssVar: '--ui-shadow-sm',
    label: 'Subtle Surface Elevation',
    className: styles.shadowSm,
  },
  {
    cssVar: '--ui-shadow-md',
    label: 'Dropdown & Card Elevation',
    className: styles.shadowMd,
  },
  {
    cssVar: '--ui-shadow-lg',
    label: 'Modal Dialog Elevation',
    className: styles.shadowLg,
  },
  {
    cssVar: '--ui-shadow-glow-primary',
    label: 'Blueprint Primary Focus Glow',
    className: styles.shadowGlowBlue,
  },
  {
    cssVar: '--ui-shadow-glow-success',
    label: 'Blueprint Success Active Glow',
    className: styles.shadowGlowMint,
  },
  {
    cssVar: '--ui-shadow-glow-danger',
    label: 'Blueprint Danger Alert Glow',
    className: styles.shadowGlowDanger,
  },
] as const;

function ShadowsCatalog(): React.ReactElement {
  const { copiedValue, copy } = useCopyToClipboard(2000);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Text as="h2" variant="heading">
          Shadows, Glows & Zero-Radius Borders
        </Text>
        <Text variant="caption" tone="secondary">
          Click any elevation box to copy its shadow token.
        </Text>
      </div>
      <div className={styles.grid}>
        {SHADOW_ITEMS.map((item) => {
          const isCopied = copiedValue === `var(${item.cssVar})`;
          return (
            <button
              key={item.cssVar}
              type="button"
              className={`${styles.shadowBox} ${item.className}`}
              onClick={() => void copy(`var(${item.cssVar})`)}
            >
              <Badge size="sm" tone={isCopied ? 'success' : 'accent'}>
                {isCopied ? 'Copied!' : '0px Radius'}
              </Badge>
              <Text variant="mono" weight="semibold">
                {item.cssVar}
              </Text>
              <Text variant="caption" tone="secondary">
                {item.label}
              </Text>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const ShadowsAndBorders: StoryObj = {
  name: 'Shadows & Borders',
  render: () => <ShadowsCatalog />,
};

const ALL_LUCIDE_ICON_ENTRIES = Object.entries(lucideIcons).map(([name, icon]) => ({
  name,
  icon,
}));

function IconsCatalog(): React.ReactElement {
  const { copiedValue, copy } = useCopyToClipboard(2000);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return ALL_LUCIDE_ICON_ENTRIES;
    }
    return ALL_LUCIDE_ICON_ENTRIES.filter((entry) => entry.name.toLowerCase().includes(normalized));
  }, [searchQuery]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Text as="h2" variant="heading">
          Icon System — Все иконки из библиотеки lucide-react ({ALL_LUCIDE_ICON_ENTRIES.length})
        </Text>
        <Text variant="body-sm" tone="secondary">
          Все представленные ниже иконки импортируются напрямую из библиотеки{' '}
          <strong>lucide-react</strong> и оборачиваются в атомарный компонент{' '}
          <code>{'<Icon icon={...} />'}</code> дизайн-системы Blueprint. Кликните по любой карточке,
          чтобы скопировать готовый JSX-код.
        </Text>
      </div>

      <div className={styles.iconToolbar}>
        <div className={styles.iconSearchBox}>
          <SearchBar
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Поиск иконки из lucide-react по названию..."
            aria-label="Search lucide-react icons"
          />
        </div>
        <Badge size="md" tone="accent">
          {`lucide-react: показано ${filteredIcons.length} из ${ALL_LUCIDE_ICON_ENTRIES.length}`}
        </Badge>
      </div>

      <div className={styles.iconGrid}>
        {filteredIcons.map((entry) => {
          const snippet = `<Icon icon={${entry.name}} size="md" />`;
          const isCopied = copiedValue === snippet;
          return (
            <button
              key={entry.name}
              type="button"
              className={styles.iconCard}
              onClick={() => void copy(snippet)}
            >
              <Icon icon={entry.icon} size="lg" tone={isCopied ? 'success' : 'accent'} />
              <Text variant="mono" size="xs">
                {entry.name}
              </Text>
              <Badge size="xs" tone={isCopied ? 'success' : 'neutral'}>
                {isCopied ? 'Copied JSX' : 'lucide-react'}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const Icons: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          'Полный интерактивный каталог всех иконок из библиотеки `lucide-react`, поддерживаемых атомарным компонентом `<Icon />`.',
      },
    },
  },
  render: () => <IconsCatalog />,
};
