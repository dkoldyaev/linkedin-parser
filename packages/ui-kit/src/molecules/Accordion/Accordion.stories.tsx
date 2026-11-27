import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from './Accordion';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const SAMPLE_ITEMS = [
  {
    id: 'item-1',
    title: '6+ лет коммерческого опыта разработки на React и TypeScript',
    actionLabel: 'Доказательства',
    content:
      '8 лет проектирования веб-приложений на React, Redux, Zustand, Radix UI и Storybook. Создание независимых UI-китов.',
  },
  {
    id: 'item-2',
    title: 'Проектирование дизайн-систем и компонентных библиотек с нуля',
    actionLabel: 'Доказательства',
    content:
      'Разработка архитектуры Blueprint Design System с каноническими CSS-токенами, темной/светлой темой и автопроверкой линтером.',
  },
  {
    id: 'item-3',
    title: 'Оптимизация Core Web Vitals и производительности рендеринга',
    actionLabel: 'Доказательства',
    content:
      'Улучшение LCP с 3.8s до 1.1s на дашбордах с виртуализацией таблиц и строгими CSS-слоями.',
  },
] as const;

const meta: Meta<typeof Accordion> = {
  title: 'Molecules/Accordion/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула `Accordion` — раскрывающийся список секций, квантованный по 32px сетке Blueprint (`useBlueprintGrid`). Поддерживает как декларативную передачу массива `items`, так и композицию через дочерние элементы `<Accordion.Item>`. Управление состоянием раскрытых секций (`expandedIds` / `defaultExpandedIds`) построено на `useControllableState`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    items: SAMPLE_ITEMS,
    defaultExpandedIds: ['item-1'],
    defaultActionLabel: 'Подробности',
    bullet: true,
    multiple: true,
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Массив объектов `AccordionItem` (`id`, `title`, `content`, `actionLabel`, `bullet`, `disabled`, `defaultExpanded`).',
    },
    defaultExpandedIds: {
      control: 'object',
      description: 'Массив `id` элементов, которые раскрыты по умолчанию в неконтролируемом режиме.',
    },
    expandedIds: {
      control: 'object',
      description: 'Контролируемый массив `id` раскрытых элементов аккордеона.',
    },
    defaultActionLabel: {
      control: 'text',
      description: 'Текст кнопки раскрытия справа по умолчанию для всех пунктов (если у пункта не задан свой `actionLabel`).',
    },
    bullet: {
      control: 'boolean',
      description: 'Отображает маркер-точку (`•`) перед заголовком каждого пункта по умолчанию.',
    },
    multiple: {
      control: 'boolean',
      description: 'Если `true`, позволяет держать открытыми несколько пунктов одновременно. Если `false` — открытие нового пункта закрывает предыдущий.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Accordion`. Настраивайте `bullet`, `multiple`, `defaultActionLabel` и `items` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Accordion — Раскрывающийся список секций на 32px сетке
        </Text>
        <Text variant="caption" tone="secondary">
          Кликните по строкам для раскрытия контента или измените параметры в Controls.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Accordion {...args} />
      </div>
    </div>
  ),
};

export const PropItems: Story = {
  name: 'Пропс: items (Массив элементов аккордеона)',
  args: {
    items: SAMPLE_ITEMS,
    defaultExpandedIds: ['item-1'],
  },
  parameters: {
    controls: { include: ['items'] },
    docs: {
      description: {
        story:
          'Пропс `items` принимает массив конфигураций `AccordionItem` для автоматического рендеринга пунктов без ручного написания `<Accordion.Item>`. Доступен только контрол `items`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: items (readonly AccordionItem[]) — Контролы: [items]
        </Text>
        <Text variant="caption" tone="secondary">
          Отредактируйте JSON-массив items в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Accordion items={args.items} defaultExpandedIds={['item-1']} />
      </div>
    </div>
  ),
};

export const PropMultiple: Story = {
  name: 'Пропс: multiple (Одиночное или множественное раскрытие)',
  args: {
    multiple: false,
    defaultExpandedIds: ['item-1'],
    items: SAMPLE_ITEMS,
  },
  parameters: {
    controls: { include: ['multiple'] },
    docs: {
      description: {
        story:
          'Пропс `multiple` определяет режим работы: при `multiple={false}` одновременно может быть открыт только один пункт аккордеона; при `multiple={true}` — любое количество. Доступен только контрол `multiple`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: multiple (boolean) — Контролы: [multiple]
        </Text>
        <Text variant="caption" tone="secondary">
          Попробуйте открыть второй пункт при multiple=false (первый автоматически свернется):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Accordion items={SAMPLE_ITEMS} defaultExpandedIds={['item-1']} multiple={args.multiple} />
      </div>
    </div>
  ),
};

export const PropBulletAndDefaultActionLabel: Story = {
  name: 'Пропсы: bullet и defaultActionLabel (Маркер и подпись действия)',
  args: {
    bullet: false,
    defaultActionLabel: 'Развернуть',
  },
  parameters: {
    controls: { include: ['bullet', 'defaultActionLabel'] },
    docs: {
      description: {
        story:
          'Пропс `bullet` управляет отображением точки-буллита `•` слева от заголовка, а `defaultActionLabel` задает текст подсказки рядом со стрелкой. Доступны только контролы `bullet` и `defaultActionLabel`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: bullet &amp; defaultActionLabel — Контролы: [bullet, defaultActionLabel]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте bullet и изменяйте defaultActionLabel в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Accordion
          bullet={args.bullet}
          defaultActionLabel={args.defaultActionLabel}
          items={[
            {
              id: 'b1',
              title: 'Пункт без индивидуального actionLabel (использует defaultActionLabel)',
              content: 'Содержимое первого пункта аккордеона.',
            },
            {
              id: 'b2',
              title: 'Второй пункт для демонстрации настройки маркера bullet',
              content: 'Содержимое второго пункта аккордеона.',
            },
          ]}
        />
      </div>
    </div>
  ),
};

export const PropDefaultExpandedIds: Story = {
  name: 'Пропсы: defaultExpandedIds и expandedIds (Управление открытыми пунктами)',
  args: {
    defaultExpandedIds: ['item-1', 'item-2'],
  },
  parameters: {
    controls: { include: ['defaultExpandedIds', 'expandedIds'] },
    docs: {
      description: {
        story:
          'Пропс `defaultExpandedIds` задает изначально открытые секции по их `id`, а `expandedIds` позволяет полностью контролировать список открытых секций извне. Доступны только контролы `defaultExpandedIds` и `expandedIds`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: defaultExpandedIds &amp; expandedIds — Контролы: [defaultExpandedIds, expandedIds]
        </Text>
        <Text variant="caption" tone="secondary">
          По умолчанию открыты секции item-1 и item-2:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Accordion
          items={SAMPLE_ITEMS}
          defaultExpandedIds={args.defaultExpandedIds}
          expandedIds={args.expandedIds}
        />
      </div>
    </div>
  ),
};
