import { Badge, Button, Icon, StatusDot, Text } from '../../atoms';
import { Inbox, MoreVertical } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableBody, TableCell, TableCol, TableFooter, TableHeader, TableRow } from './Table';
import { Card } from '../Card';
import { EmptyState } from '../../molecules';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Table> = {
  title: 'Organisms/Table/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Flex-ориентированный табличный организм `Table` (`role="table"`), выровненный по 32px сетке Blueprint. В режиме `layout="columns"` строит горизонтальную Канбан-доску колонок `<TableCol>` с автоматическим квантованием ширины колонок (`quantizeColumns`, `minColGridUnits`, `fluidColumns`) и горизонтальным snap-скроллом (`snapScroll` через `useGridScroll`). В режиме `layout="rows"` строит вертикальную таблицу записей из `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>` и `<TableFooter>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    layout: 'columns',
    fluidColumns: false,
    quantizeColumns: false,
    minColGridUnits: 8,
    snapScroll: true,
    fullHeight: false,
    bordered: true,
  },
  argTypes: {
    layout: {
      control: 'inline-radio',
      options: ['columns', 'rows'],
      description: 'Режим раскладки: `columns` (горизонтальные колонки Канбан-доски) или `rows` (вертикальные строки записей).',
    },
    fluidColumns: {
      control: 'boolean',
      description: 'При `layout="columns"` растягивает дочерние колонки `<TableCol>` на всю доступную ширину.',
    },
    quantizeColumns: {
      control: 'boolean',
      description:
        'Автоматически рассчитывает равную ширину колонок в целых ячейках 32px сетки (`--bp-col-grid-width`), оставляя остаток для боковой рельсы.',
    },
    minColGridUnits: {
      control: { type: 'number', min: 6, max: 16, step: 1 },
      description: 'Минимальная ширина колонки в 32px ячейках при `quantizeColumns={true}` (по умолчанию `8` = 256px).',
    },
    snapScroll: {
      control: 'boolean',
      description: 'Доводит горизонтальный скролл (`layout="columns"`) до ближайшего шага 32px сетки.',
    },
    fullHeight: {
      control: 'boolean',
      description: 'Растягивает таблицу на 100% высоты родительского контейнера.',
    },
    bordered: {
      control: 'boolean',
      description: 'Добавляет внешний 1px контур вокруг таблицы.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Table`. Переключайте `layout` (`columns` / `rows`), `fluidColumns`, `quantizeColumns`, `snapScroll`, `bordered` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Table — Универсальный Flex-организм для Канбан-досок и строковых таблиц
        </Text>
        <Text variant="caption" tone="secondary">
          Текущий режим: layout=&quot;{args.layout}&quot; | bordered={String(args.bordered)}
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        {args.layout === 'rows' ? (
          <Table {...args}>
            <TableHeader size="md">
              <Text as="span" variant="mono" tone="accent">
                ID
              </Text>
              <Text as="span" variant="mono" tone="primary">
                ENTITY TITLE
              </Text>
              <Text as="span" variant="mono" tone="secondary">
                STAGE
              </Text>
            </TableHeader>
            <TableBody padding="none">
              <TableRow interactive bordered>
                <TableCell padding="md">
                  <Text variant="mono">ENT-101</Text>
                </TableCell>
                <TableCell padding="md">
                  <Text variant="body-sm">Principal Design Systems Engineer</Text>
                </TableCell>
                <TableCell padding="md">
                  <Badge tone="info" size="sm">
                    Screening
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow interactive bordered>
                <TableCell padding="md">
                  <Text variant="mono">ENT-102</Text>
                </TableCell>
                <TableCell padding="md">
                  <Text variant="body-sm">Senior React Platform Engineer</Text>
                </TableCell>
                <TableCell padding="md">
                  <Badge tone="success" size="sm">
                    Offer
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter justify="between">
              <Text as="span" variant="caption" tone="secondary">
                Показано 2 активные записи
              </Text>
              <Button variant="ghost" size="sm">
                Показать все
              </Button>
            </TableFooter>
          </Table>
        ) : (
          <Table {...args}>
            <TableCol gridUnits={10}>
              <TableHeader
                actions={
                  <Button variant="ghost" size="icon-sm" aria-label="More actions">
                    <Icon icon={MoreVertical} size="sm" />
                  </Button>
                }
              >
                <Text as="span" variant="mono" weight="semibold" tone="accent">
                  [ 01 ]
                </Text>
                <StatusDot tone="primary" size="md" />
                <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
                  Backlog
                </Text>
                <Badge variant="counter" size="xs" tone="neutral">
                  2
                </Badge>
              </TableHeader>
              <TableBody scrollable snapScroll padding="sm" gap="sm">
                <TableCell padding="none">
                  <Card title="Senior Frontend Engineer" subtitle="Datadog • Paris" tone="success" />
                </TableCell>
                <TableCell padding="none">
                  <Card title="Full Stack Developer" subtitle="Supabase • Remote" tone="warning" />
                </TableCell>
              </TableBody>
            </TableCol>

            <TableCol gridUnits={10}>
              <TableHeader>
                <Text as="span" variant="mono" weight="semibold" tone="accent">
                  [ 02 ]
                </Text>
                <StatusDot tone="info" size="md" />
                <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
                  Screening
                </Text>
                <Badge variant="counter" size="xs" tone="neutral">
                  0
                </Badge>
              </TableHeader>
              <TableBody
                scrollable
                snapScroll
                padding="sm"
                emptyState={
                  <EmptyState
                    icon={<Icon icon={Inbox} size="md" tone="muted" />}
                    title="Пустой этап"
                    description="Перетащите карточку в эту колонку."
                  />
                }
              />
            </TableCol>
          </Table>
        )}
      </div>
    </div>
  ),
};

export const PropLayout: Story = {
  name: 'Пропс: layout (Колонки columns vs Строки rows)',
  args: {
    layout: 'rows',
    bordered: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `layout` переключает направление главного flex-контейнера: `columns` строит горизонтальный ряд колонок `<TableCol>`, а `rows` — вертикальный стек строк `<TableRow>`.',
      },
    },
  },
  render: Base.render,
};

export const PropQuantizeAndFluidColumns: Story = {
  name: 'Пропсы: quantizeColumns, minColGridUnits и fluidColumns',
  args: {
    layout: 'columns',
    quantizeColumns: true,
    minColGridUnits: 8,
    fluidColumns: false,
    bordered: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'При `quantizeColumns={true}` `ResizeObserver` вычисляет доступное количество 32px ячеек контейнера и равномерно распределяет их между колонками (но не менее `minColGridUnits`).',
      },
    },
  },
  render: Base.render,
};
