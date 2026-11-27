import { Badge, Icon, Text } from '../../atoms';
import { FileText, History, Shield } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Tabs, type TabsProps } from './Tabs';
import layoutStyles from '../../stories/StoryLayout.module.css';

const SAMPLE_TAB_ITEMS = [
  {
    value: 'overview',
    label: 'Описание и детали',
    icon: <Icon icon={FileText} size="xs" />,
    accessory: (
      <Badge variant="counter" size="xs" tone="primary">
        14
      </Badge>
    ),
    content: (
      <Text as="p" variant="body">
        Извлеченные ключевые слова, стек технологий, зарплатная вилка и AI-саммари вакансии.
      </Text>
    ),
  },
  {
    value: 'compatibility',
    label: 'Совместимость с CV',
    icon: <Icon icon={Shield} size="xs" />,
    accessory: (
      <Badge variant="solid" size="xs" tone="success">
        92%
      </Badge>
    ),
    content: (
      <Text as="p" variant="body">
        Подробный отчет сопоставления требований вакансии с опытом кандидата в резюме.
      </Text>
    ),
  },
  {
    value: 'history',
    label: 'История версий',
    icon: <Icon icon={History} size="xs" />,
    align: 'right' as const,
    content: (
      <Text as="p" variant="body">
        Журнал адаптированных версий резюме и сопроводительных писем.
      </Text>
    ),
  },
];

const meta: Meta<typeof Tabs> = {
  title: 'Molecules/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Доступная молекула вкладок `Tabs` на базе `@radix-ui/react-tabs` с полной навигацией клавишами-стрелками, квантованием ширины вкладок по 32px сетке Blueprint (`useBlueprintGrid`, `data-bp-snap-width`) и поддержкой иконок (`icon`), бейджей-аксессуаров (`accessory`) и выравнивания (`align: "left" | "right"`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    defaultValue: 'overview',
    ariaLabel: 'Разделы карточки вакансии',
    items: SAMPLE_TAB_ITEMS,
  },
  argTypes: {
    value: {
      control: 'select',
      options: [undefined, 'overview', 'compatibility', 'history'],
      description: 'Контролируемый идентификатор активной вкладки.',
    },
    defaultValue: {
      control: 'select',
      options: ['overview', 'compatibility', 'history'],
      description: 'Идентификатор активной вкладки по умолчанию в неконтролируемом режиме.',
    },
    items: {
      control: 'object',
      description:
        'Массив конфигураций вкладок `TabItem[]` (`value`, `label`, `icon`, `accessory`, `disabled`, `content`, `align`).',
    },
    ariaLabel: {
      control: 'text',
      description: 'Доступная подпись `aria-label` для списка триггеров `role="tablist"`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Tabs`. Переключайте вкладки кликом, клавишами стрелок или через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Tabs — Навигационные вкладки с квантованием по 32px сетке
        </Text>
        <Text variant="caption" tone="secondary">
          Ширина каждого триггера автоматически выравнивается кратно ячейке 32px.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Tabs {...args} />
      </div>
    </div>
  ),
};

export const PropItemsWithIconsAndAccessories: Story = {
  name: 'Пропс: items (Слоты icon, accessory, align и disabled)',
  args: {
    defaultValue: 'tab-1',
    items: [
      {
        value: 'tab-1',
        label: 'Активная вкладка',
        icon: <Icon icon={FileText} size="xs" />,
        accessory: (
          <Badge variant="counter" size="xs" tone="accent">
            8
          </Badge>
        ),
        content: <Text variant="body-sm">Контент первой вкладки со счетчиком и иконкой.</Text>,
      },
      {
        value: 'tab-2',
        label: 'Неактивная (disabled)',
        disabled: true,
        content: <Text variant="body-sm">Этот контент недоступен.</Text>,
      },
      {
        value: 'tab-3',
        label: 'Прижата вправо (align=right)',
        align: 'right',
        accessory: (
          <Badge variant="solid" size="xs" tone="success">
            OK
          </Badge>
        ),
        content: <Text variant="body-sm">Контент вкладки, выровненной по правому краю.</Text>,
      },
    ],
  },
  parameters: {
    controls: { include: ['items'] },
    docs: {
      description: {
        story:
          'Каждый элемент массива `items` поддерживает `icon` (иконка слева), `accessory` (бейдж или счетчик справа), `disabled` (блокировка вкладки) и `align: "right"` (прижатие к правому краю полосы вкладок). Доступен только контрол `items`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: items (TabItem: icon, accessory, disabled, align) — Контролы: [items]
        </Text>
        <Text variant="caption" tone="secondary">
          Демонстрация возможностей конфигурации элементов TabItem:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Tabs items={args.items} defaultValue="tab-1" />
      </div>
    </div>
  ),
};

function ControlledTabsStory(args: TabsProps): React.ReactElement {
  const [active, setActive] = useState(args.value ?? 'compatibility');

  React.useEffect(() => {
    if (args.value !== undefined) {
      setActive(args.value);
    }
  }, [args.value]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: value &amp; onValueChange (Контролируемый режим: {active}) — Контролы: [value]
        </Text>
        <Text variant="caption" tone="secondary">
          Текущая вкладка контролируется внешним React-состоянием или контролом value.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Tabs items={SAMPLE_TAB_ITEMS} value={active} onValueChange={setActive} />
      </div>
    </div>
  );
}

export const PropValueAndOnValueChange: Story = {
  name: 'Пропсы: value и onValueChange (Контролируемое переключение)',
  args: {
    value: 'compatibility',
  },
  parameters: {
    controls: { include: ['value'] },
    docs: {
      description: {
        story:
          'Пропсы `value` и `onValueChange` позволяют синхронизировать активную вкладку с URL-роутером или родительским состоянием (например в `Modal.Header`). Доступен только контрол `value`.',
      },
    },
  },
  render: (args) => <ControlledTabsStory items={SAMPLE_TAB_ITEMS} value={args.value} />,
};
