import { Button, Text } from '../../atoms';
import { Card, Header } from '../../organisms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageLayout, type PageLayoutProps } from './PageLayout';
import { AlertBanner } from '../../molecules';
import React from 'react';

const BANNER_MAP = {
  none: undefined,
  MaintenanceBanner: (
    <AlertBanner tone="info" title="SYSTEM MAINTENANCE NOTICE">
      Плановая оптимизация индексов фонового воркера в 02:00 UTC.
    </AlertBanner>
  ),
  WarningBanner: (
    <AlertBanner tone="warning" title="OFFLINE CACHE MODE">
      Отображаются локально сохраненные данные до восстановления соединения.
    </AlertBanner>
  ),
} as const;

const FOOTER_MAP = {
  none: undefined,
  StandardFooter: (
    <Text variant="mono" tone="muted">
      BLUEPRINT.UI // 32PX ARCHITECTURE GRID // ALL RIGHTS RESERVED
    </Text>
  ),
} as const;

const meta: Meta<typeof PageLayout> = {
  title: 'Layouts/PageLayout',
  component: PageLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Базовый каркас страницы `PageLayout` с фоновой 32px сеткой Blueprint (`bp-page`), автоматическим квантованием ячеек и колонок (`useBlueprintGrid`, `snapToGrid`), доводкой вертикального скролла (`useGridScroll`) и семантическими регионами: `header`, `banner`, `<main>` (`fullBleed`) и `<footer>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    fullBleed: false,
    snapToGrid: true,
    banner: BANNER_MAP.MaintenanceBanner,
    footer: FOOTER_MAP.StandardFooter,
  },
  argTypes: {
    fullBleed: {
      control: 'boolean',
      description: 'Убирает горизонтальные ограничители и внутренние поля у `<main>`, растягивая контент от края до края.',
    },
    snapToGrid: {
      control: 'boolean',
      description: 'Включает автоматическое выравнивание элементов по 32px сетке через `useBlueprintGrid`.',
    },
    banner: {
      control: 'select',
      options: Object.keys(BANNER_MAP),
      mapping: BANNER_MAP,
      description: 'Опциональный слот системного уведомления `<AlertBanner>` под шапкой страницы.',
    },
    footer: {
      control: 'select',
      options: Object.keys(FOOTER_MAP),
      mapping: FOOTER_MAP,
      description: 'Слот нижнего колонтитула `<footer>`, квантованного минимум в 2 ячейки сетки (`data-min-grids="2"`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageLayout>;

function InteractivePageLayoutDemo(args: PageLayoutProps): React.ReactElement {
  return (
    <PageLayout
      {...args}
      header={
        <Header
          title="BLUEPRINT.UI"
          subtitle="PAGE LAYOUT"
          showThemeToggle
          user={{ name: 'Alex Morgan' }}
          actions={
            <Button size="sm" variant="primary">
              Dashboard
            </Button>
          }
        />
      }
    >
      <Card
        title="Application Workspace Overview"
        subtitle={`fullBleed=${String(args.fullBleed)} | snapToGrid=${String(args.snapToGrid)}`}
        tone="accent"
      >
        <Text as="p" variant="body">
          Каркас PageLayout формирует базовую сетку страницы 32px, семантические ориентиры
          header/main/footer и слот для общесистемных уведомлений.
        </Text>
      </Card>
    </PageLayout>
  );
}

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `PageLayout`. Переключайте `fullBleed`, `snapToGrid`, `banner` и `footer` через панель Controls.',
      },
    },
  },
  render: (args) => <InteractivePageLayoutDemo {...args} />,
};

export const PropFullBleedAndSnapToGrid: Story = {
  name: 'Пропсы: fullBleed и snapToGrid (Режим полной ширины и привязка к сетке)',
  args: {
    fullBleed: true,
    snapToGrid: true,
  },
  parameters: {
    controls: { include: ['fullBleed', 'snapToGrid'] },
    docs: {
      description: {
        story:
          'При `fullBleed={true}` основная область `<main>` занимает 100% ширины без центрирующих полей. Доступны только контролы `fullBleed` и `snapToGrid`.',
      },
    },
  },
  render: (args) => (
    <InteractivePageLayoutDemo fullBleed={args.fullBleed} snapToGrid={args.snapToGrid}>
      {null}
    </InteractivePageLayoutDemo>
  ),
};

export const PropBannerAndFooter: Story = {
  name: 'Пропсы: banner и footer (Слоты баннера и подвала страницы)',
  args: {
    banner: BANNER_MAP.WarningBanner,
    footer: FOOTER_MAP.StandardFooter,
  },
  parameters: {
    controls: { include: ['banner', 'footer'] },
    docs: {
      description: {
        story:
          'Пропс `banner` размещает уведомление под `<Header>`, а `footer` рендерит подвал страницы. Доступны только контролы `banner` и `footer`.',
      },
    },
  },
  render: (args) => (
    <InteractivePageLayoutDemo banner={args.banner} footer={args.footer}>
      {null}
    </InteractivePageLayoutDemo>
  ),
};
