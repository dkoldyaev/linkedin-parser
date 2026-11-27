import { Badge, Button, Icon, StatusDot, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical, Plus } from 'lucide-react';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { TableHeader } from './TableHeader';

const ACTIONS_MAP = {
  none: undefined,
  MoreButton: (
    <Button variant="ghost" size="icon-sm" aria-label="More actions">
      <Icon icon={MoreVertical} size="sm" />
    </Button>
  ),
  AddButton: (
    <Button variant="ghost" size="icon-sm" aria-label="Add candidate">
      <Icon icon={Plus} size="sm" />
    </Button>
  ),
} as const;

const meta: Meta<typeof TableHeader> = {
  title: 'Organisms/Table/TableHeader',
  component: TableHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент шапки колонки или таблицы `TableHeader` (`Table.Header`, `role="columnheader"`) на 32px сетке Blueprint. Принимает `children` (левая группа: индекс `[ 01 ]`, `<StatusDot>`, название этапа, счетчик `<Badge variant="counter">`), правый слот действий `actions` (кнопки меню) и размер высоты `size` (`sm` или `md`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    size: 'sm',
    actions: ACTIONS_MAP.MoreButton,
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: 'Высота и внутренний масштаб шапки (`sm` — компактная 32px, `md` — увеличенная).',
    },
    actions: {
      control: 'select',
      options: Object.keys(ACTIONS_MAP),
      mapping: ACTIONS_MAP,
      description: 'Правый слот для иконочных кнопок меню или добавления элемента.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableHeader>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `TableHeader`. Настраивайте `size` и `actions` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          TableHeader — Шапка колонки Канбан или строковой таблицы
        </Text>
        <Text variant="caption" tone="secondary">
          Разделяет левую группу заголовка (children) и правую группу кнопок (actions).
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <TableHeader {...args}>
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 01 ]
            </Text>
            <StatusDot tone="primary" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
              Backlog
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              4
            </Badge>
          </TableHeader>
        </div>
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Высота шапки sm / md)',
  args: {
    size: 'md',
    actions: ACTIONS_MAP.AddButton,
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `size` переключает высоту шапки между `sm` и `md`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size (&quot;sm&quot; | &quot;md&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <TableHeader {...args}>
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              STAGE 03
            </Text>
            <StatusDot tone="success" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
              Техническое интервью
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              12
            </Badge>
          </TableHeader>
        </div>
      </div>
    </div>
  ),
};

export const PropActionsAndChildren: Story = {
  name: 'Пропсы: actions и children (Слоты заголовка и кнопок меню)',
  args: {
    size: 'sm',
    actions: ACTIONS_MAP.MoreButton,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `children` формирует основное содержимое шапки, а `actions` добавляет интерактивные контролы справа.',
      },
    },
  },
  render: Base.render,
};
