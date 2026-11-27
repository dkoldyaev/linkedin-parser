import { Badge, Button, StatusDot, Text } from '../../atoms';
import { Card, Header, Table, TableBody, TableCell, TableCol, TableHeader } from '../../organisms';
import { DashboardLayout, type DashboardLayoutProps } from './DashboardLayout';
import { FilterBar, SearchBar } from '../../molecules';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import layoutStyles from '../../stories/StoryLayout.module.css';

const TOOLBAR_MAP = {
  none: undefined,
  BulkActionsToolbar: (
    <div className={layoutStyles.row}>
      <Badge tone="accent" size="sm">
        Выбрано: 3 карточки
      </Badge>
      <Button variant="secondary" size="sm">
        Переместить выбранные
      </Button>
      <Button variant="ghost" size="sm" tone="danger">
        В не подошло
      </Button>
    </div>
  ),
} as const;

const SIDEBAR_MAP = {
  none: undefined,
  QuickNavSidebar: (
    <div className={layoutStyles.box}>
      <div className={layoutStyles.stackSm}>
        <Text variant="mono-label" tone="accent">
          WORKSPACE NAV
        </Text>
        <Badge tone="primary" size="sm">
          01 // Kanban Board
        </Badge>
        <Badge tone="neutral" size="sm">
          02 // Master CV
        </Badge>
        <Badge tone="neutral" size="sm">
          03 // Analytics
        </Badge>
      </div>
    </div>
  ),
} as const;

const FOOTER_MAP = {
  none: undefined,
  StatusFooter: (
    <div className={layoutStyles.box}>
      <Text variant="mono" size="xs" tone="muted">
        BLUEPRINT WORKSPACE // 32PX GRID ACTIVE // MERCURE SSE CONNECTED
      </Text>
    </div>
  ),
} as const;

const meta: Meta<typeof DashboardLayout> = {
  title: 'Layouts/DashboardLayout',
  component: DashboardLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Каркас рабочего пространства `DashboardLayout` для насыщенных данными экранов (Канбан-доски, панели администрирования, таблицы очередей). Включает встроенное квантование по 32px сетке Blueprint (`useBlueprintGrid`, `snapToGrid`) и snap-прокрутку рабочей области и сайдбара (`useGridScroll`). Поддерживает слоты `header`, `filterBar`, `toolbar`, `sidebar`, `footer` и основную область `children` (`<main data-bp-scroller="true">`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    snapToGrid: true,
    sidebarLabel: 'Навигация рабочего пространства',
    toolbar: TOOLBAR_MAP.none,
    sidebar: SIDEBAR_MAP.none,
    footer: FOOTER_MAP.StatusFooter,
  },
  argTypes: {
    snapToGrid: {
      control: 'boolean',
      description: 'Включает автоматическое квантование элементов по 32px сетке через `useBlueprintGrid`.',
    },
    sidebarLabel: {
      control: 'text',
      description: 'Доступная метка `aria-label` для боковой панели `<aside>`.',
    },
    toolbar: {
      control: 'select',
      options: Object.keys(TOOLBAR_MAP),
      mapping: TOOLBAR_MAP,
      description: 'Слот панели инструментов (`<section aria-label="Workspace toolbar">`) под `filterBar`.',
    },
    sidebar: {
      control: 'select',
      options: Object.keys(SIDEBAR_MAP),
      mapping: SIDEBAR_MAP,
      description: 'Слот боковой панели `<aside>` слева от главной рабочей области `<main>`.',
    },
    footer: {
      control: 'select',
      options: Object.keys(FOOTER_MAP),
      mapping: FOOTER_MAP,
      description: 'Слот нижнего колонтитула `<footer>` рабочего пространства.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardLayout>;

function InteractiveDashboardDemo(args: DashboardLayoutProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');

  return (
    <DashboardLayout
      {...args}
      header={
        <Header
          title="BLUEPRINT.UI"
          subtitle="WORKSPACE SHELL"
          search={
            <SearchBar
              value={search}
              onValueChange={setSearch}
              placeholder="Поиск карточек..."
              aria-label="Search workspace"
              expandOnFocus
            />
          }
          showThemeToggle
          user={{ name: 'Alex Morgan' }}
        />
      }
      filterBar={
        <FilterBar
          selects={[
            {
              id: 'region',
              value: region,
              onChange: setRegion,
              options: [
                { value: '', label: 'Все регионы' },
                { value: 'eu', label: 'Europe (EU)' },
                { value: 'us', label: 'North America' },
              ],
            },
          ]}
          tags={[
            { label: 'Core', count: 8 },
            { label: 'Infrastructure', count: 4 },
          ]}
          onReset={() => setRegion('')}
        />
      }
    >
      <Table layout="columns" snapScroll fullHeight>
        <TableCol gridUnits={10}>
          <TableHeader>
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 01 ]
            </Text>
            <StatusDot tone="primary" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary">
              Queued
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              2
            </Badge>
          </TableHeader>
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <Card title="Design Tokens Audit" subtitle="Core System" tone="accent" />
            </TableCell>
            <TableCell padding="none">
              <Card title="Accessibility Verification" subtitle="QA Pipeline" tone="success" />
            </TableCell>
          </TableBody>
        </TableCol>

        <TableCol gridUnits={10}>
          <TableHeader>
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 02 ]
            </Text>
            <StatusDot tone="success" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary">
              Completed
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              1
            </Badge>
          </TableHeader>
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <Card
                title="Standalone Package Build"
                subtitle="@blueprint/ui-kit"
                tone="success"
                footer={
                  <Text variant="caption" tone="muted">
                    Verified
                  </Text>
                }
              />
            </TableCell>
          </TableBody>
        </TableCol>
      </Table>
    </DashboardLayout>
  );
}

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `DashboardLayout`. Переключайте слоты `toolbar`, `sidebar`, `footer` и флаг `snapToGrid` через панель Controls.',
      },
    },
  },
  render: (args) => <InteractiveDashboardDemo {...args} />,
};

export const PropToolbarAndSidebar: Story = {
  name: 'Пропсы: toolbar, sidebar и sidebarLabel (Панель массовых действий и сайдбар)',
  args: {
    toolbar: TOOLBAR_MAP.BulkActionsToolbar,
    sidebar: SIDEBAR_MAP.QuickNavSidebar,
    sidebarLabel: 'Боковая навигация по разделам',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `toolbar` добавляет 32px-квантованную полосу инструментов под `filterBar`, а `sidebar` рендерит боковую колонку `<aside>` слева от рабочей области.',
      },
    },
  },
  render: (args) => <InteractiveDashboardDemo {...args} />,
};

export const PropSnapToGridAndFooter: Story = {
  name: 'Пропсы: snapToGrid и footer (Квантование сетки и нижняя строка статуса)',
  args: {
    snapToGrid: true,
    footer: FOOTER_MAP.StatusFooter,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `snapToGrid` управляет хуком `useBlueprintGrid`, а `footer` выводит нижнюю статусную строку дашборда.',
      },
    },
  },
  render: (args) => <InteractiveDashboardDemo {...args} />,
};
