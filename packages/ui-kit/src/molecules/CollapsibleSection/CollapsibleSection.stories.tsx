import { Badge, Button, Icon, Paragraph, Text } from '../../atoms';
import { FileText, Info, Settings, SlidersHorizontal } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollapsibleSection } from './CollapsibleSection';
import layoutStyles from '../../stories/StoryLayout.module.css';

const ICON_MAP = {
  none: undefined,
  Info: <Icon icon={Info} size="sm" tone="info" />,
  FileText: <Icon icon={FileText} size="sm" tone="accent" />,
  SlidersHorizontal: <Icon icon={SlidersHorizontal} size="sm" tone="secondary" />,
} as const;

const BADGE_MAP = {
  none: undefined,
  ReadyBadge: (
    <Badge size="xs" tone="success">
      Ready
    </Badge>
  ),
  CountBadge: (
    <Badge variant="counter" size="xs" tone="accent">
      4
    </Badge>
  ),
} as const;

const ACCESSORY_MAP = {
  none: undefined,
  SettingsButton: (
    <Button size="icon-sm" variant="secondary" aria-label="Settings">
      <Icon icon={Settings} size="xs" />
    </Button>
  ),
  CopyButton: (
    <Button size="sm" variant="secondary">
      Копировать
    </Button>
  ),
} as const;

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Molecules/CollapsibleSection',
  component: CollapsibleSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула `CollapsibleSection` — сворачиваемая секция на 32px сетке Blueprint. Композирует `<SectionHeader collapsible>` и раскрываемую панель контента с управлением состоянием через `useControllableState` (`open` / `defaultOpen` / `onOpenChange`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'ОРИГИНАЛЬНОЕ ОПИСАНИЕ ВАКАНСИИ',
    icon: <Icon icon={FileText} size="sm" tone="accent" />,
    defaultOpen: true,
    expandLabel: 'Развернуть',
    collapseLabel: 'Свернуть',
    children: (
      <Paragraph size="sm" spacing="none">
        Фоновый воркер парсинга активен. Полный текст описания вакансии и метаданные компании
        сохранены в локальной базе данных и готовы к AI-анализу.
      </Paragraph>
    ),
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Заголовок секции, передаваемый в `<SectionHeader>`.',
    },
    icon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Иконка слева от заголовка секции (`<Icon />`).',
    },
    badge: {
      control: 'select',
      options: Object.keys(BADGE_MAP),
      mapping: BADGE_MAP,
      description: 'Опциональный бейдж или счетчик рядом с заголовком.',
    },
    accessory: {
      control: 'select',
      options: Object.keys(ACCESSORY_MAP),
      mapping: ACCESSORY_MAP,
      description: 'Слот для дополнительных кнопок действий в правой части шапки секции.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Начальное состояние (развернуто/свернуто) в неконтролируемом режиме.',
    },
    open: {
      control: 'boolean',
      description: 'Контролируемое состояние раскрытия секции.',
    },
    expandLabel: {
      control: 'text',
      description: 'Текст подсказки рядом с шевроном в свернутом состоянии.',
    },
    collapseLabel: {
      control: 'text',
      description: 'Текст подсказки рядом с шевроном в развернутом состоянии.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `CollapsibleSection`. Кликните по шапке секции для сворачивания/разворачивания или настройте пропсы в Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          CollapsibleSection — Сворачиваемая секция с шапкой SectionHeader
        </Text>
        <Text variant="caption" tone="secondary">
          Используется для длинных описаний вакансий, логов и дополнительных настроек.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <CollapsibleSection {...args} />
      </div>
    </div>
  ),
};

export const PropTitleAndIcon: Story = {
  name: 'Пропсы: title и icon (Заголовок и иконка секции)',
  args: {
    title: 'СИСТЕМНАЯ ДИАГНОСТИКА ВОРКЕРА',
    icon: <Icon icon={Info} size="sm" tone="info" />,
    defaultOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропсы `title` и `icon` формируют левую часть шапки секции.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: title &amp; icon
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте текст заголовка и иконку в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <CollapsibleSection {...args} />
      </div>
    </div>
  ),
};

export const PropBadgeAndAccessory: Story = {
  name: 'Пропсы: badge и accessory (Бейдж и кнопки действий в шапке)',
  args: {
    title: 'НАСТРОЙКИ ИНТЕГРАЦИИ',
    icon: <Icon icon={SlidersHorizontal} size="sm" tone="accent" />,
    badge: (
      <Badge size="xs" tone="success">
        Active
      </Badge>
    ),
    accessory: (
      <Button size="icon-sm" variant="secondary" aria-label="Configure">
        <Icon icon={Settings} size="xs" />
      </Button>
    ),
    defaultOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `badge` отображает индикатор рядом с заголовком, а `accessory` размещает интерактивные кнопки справа (клик по кнопке внутри `accessory` не вызывает сворачивание секции благодаря `stopPropagation`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: badge &amp; accessory
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите badge и accessory в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <CollapsibleSection {...args} />
      </div>
    </div>
  ),
};

export const PropOpenAndLabels: Story = {
  name: 'Пропсы: open, defaultOpen, expandLabel, collapseLabel',
  args: {
    title: 'ЖУРНАЛ СОБЫТИЙ СЕССИИ',
    defaultOpen: false,
    expandLabel: 'Показать полностью',
    collapseLabel: 'Скрыть журнал',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `open` / `defaultOpen` управляют состоянием раскрытия, а `expandLabel` и `collapseLabel` задают текст подсказки рядом с иконкой шеврона.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: open / defaultOpen / expandLabel / collapseLabel
        </Text>
        <Text variant="caption" tone="secondary">
          Кликните по шапке или измените expandLabel / collapseLabel в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <CollapsibleSection {...args} />
      </div>
    </div>
  ),
};
