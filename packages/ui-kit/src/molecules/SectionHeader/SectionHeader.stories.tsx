import { Badge, Button, Icon, Text } from '../../atoms';
import { Banknote, Edit3, History, Plus, RefreshCw, Sparkles } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { SectionHeader } from './SectionHeader';

const ICON_MAP = {
  none: undefined,
  Sparkles: <Icon icon={Sparkles} size="sm" tone="success" />,
  Banknote: <Icon icon={Banknote} size="sm" tone="success" />,
  History: <Icon icon={History} size="sm" tone="accent" />,
} as const;

const BADGE_MAP = {
  none: undefined,
  StagesCount: (
    <Badge size="xs" tone="info">
      4 этапа
    </Badge>
  ),
  MatchBadge: (
    <Badge size="xs" tone="success">
      92% Match
    </Badge>
  ),
} as const;

const ACCESSORY_MAP = {
  none: undefined,
  ReanalyzeBtn: (
    <Button size="sm" variant="secondary" startIcon={<Icon icon={RefreshCw} size="xs" />}>
      Обновить AI
    </Button>
  ),
  EditBtn: (
    <Button size="sm" variant="secondary" startIcon={<Icon icon={Edit3} size="xs" />}>
      Редактировать
    </Button>
  ),
  AddIconBtn: (
    <Button size="icon-sm" variant="secondary" aria-label="Add item">
      <Icon icon={Plus} size="sm" />
    </Button>
  ),
} as const;

const meta: Meta<typeof SectionHeader> = {
  title: 'Molecules/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула заголовка секции `SectionHeader` высотой ровно 32px (1 ячейка сетки Blueprint). Композирует слот иконки `icon`, заголовок `<Text as="h4">`, слот бейджа `badge`, слот кнопок действий `accessory`, нижний разделитель `divider`, семантические цветовые тона `tone` и режим сворачивания `collapsible`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'AI-САММАРИ ВАКАНСИИ',
    tone: 'neutral',
    variant: 'mono',
    as: 'div',
    icon: <Icon icon={Sparkles} size="sm" tone="success" />,
    badge: (
      <Badge size="xs" tone="success">
        92% Match
      </Badge>
    ),
    accessory: (
      <Button size="sm" variant="secondary" startIcon={<Icon icon={RefreshCw} size="xs" />}>
        Обновить AI
      </Button>
    ),
    collapsible: false,
    open: false,
    expandLabel: 'Развернуть',
    collapseLabel: 'Свернуть',
    divider: true,
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Текст или React-узел заголовка секции.',
    },
    tone: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'secondary',
        'muted',
        'accent',
        'success',
        'warning',
        'danger',
        'info',
      ],
      description: 'Семантический цветовой тон заголовка и маркера.',
    },
    variant: {
      control: 'inline-radio',
      options: ['mono', 'sans'],
      description: 'Шрифтовой вариант заголовка (`mono` — технический uppercase, `sans` — стандартный Inter).',
    },
    as: {
      control: 'inline-radio',
      options: ['div', 'header'],
      description: 'HTML-тег корневого элемента (`div` или `header`).',
    },
    icon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Иконка слева от заголовка (`<Icon />`).',
    },
    badge: {
      control: 'select',
      options: Object.keys(BADGE_MAP),
      mapping: BADGE_MAP,
      description: 'Бейдж или счетчик справа от текста заголовка.',
    },
    accessory: {
      control: 'select',
      options: Object.keys(ACCESSORY_MAP),
      mapping: ACCESSORY_MAP,
      description: 'Кнопка или группа действий в правой части шапки.',
    },
    divider: {
      control: 'boolean',
      description: 'Рисует нижнюю 1px линию-разделитель под шапкой секции.',
    },
    collapsible: {
      control: 'boolean',
      description: 'Превращает шапку в интерактивный триггер сворачивания (`role="button"` с шевроном).',
    },
    open: {
      control: 'boolean',
      description: 'Состояние развернутости при `collapsible={true}` (`aria-expanded`).',
    },
    expandLabel: {
      control: 'text',
      description: 'Подпись рядом со стрелкой в свернутом состоянии.',
    },
    collapseLabel: {
      control: 'text',
      description: 'Подпись рядом со стрелкой в развернутом состоянии.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `SectionHeader`. Настраивайте `title`, `tone`, `variant`, `icon`, `badge`, `accessory`, `divider` и `collapsible` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          SectionHeader — Универсальная 32px шапка секции
        </Text>
        <Text variant="caption" tone="secondary">
          Стандартный заголовок разделов в модальных окнах, отчетах совместимости и панелях настроек.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <SectionHeader {...args} />
      </div>
    </div>
  ),
};

export const PropToneAndDivider: Story = {
  name: 'Пропсы: tone и divider (Семантические тона и линия-разделитель)',
  args: {
    title: 'ПОДТВЕРЖДЁННЫЕ ТРЕБОВАНИЯ [5]',
    tone: 'success',
    divider: true,
    icon: undefined,
    badge: undefined,
    accessory: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` окрашивает заголовок в семантический цвет (используется в `ReportAccordion` для групп совпадений, пробелов и блокеров), а `divider` подчеркивает шапку структурной линией.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: tone &amp; divider
        </Text>
        <Text variant="caption" tone="secondary">
          Измените tone в Controls или сравните все семантические варианты ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <SectionHeader {...args} />
        <div className={layoutStyles.stackSm}>
          <SectionHeader title="MATCHES [5] (tone='success')" tone="success" divider />
          <SectionHeader title="UNCONFIRMED [3] (tone='warning')" tone="warning" divider />
          <SectionHeader title="CRITICAL BLOCKERS [1] (tone='danger')" tone="danger" divider />
          <SectionHeader title="ACCENT HEADER (tone='accent')" tone="accent" divider />
          <SectionHeader title="MUTED HEADER (tone='muted')" tone="muted" divider />
        </div>
      </div>
    </div>
  ),
};

export const PropIconBadgeAndAccessory: Story = {
  name: 'Пропсы: icon, badge и accessory (Слоты композиции)',
  args: {
    title: 'ИСТОРИЯ ЭТАПОВ И ПЕРЕМЕЩЕНИЙ',
    icon: <Icon icon={History} size="sm" tone="accent" />,
    badge: (
      <Badge size="xs" tone="info">
        4 этапа
      </Badge>
    ),
    accessory: (
      <Button size="sm" variant="secondary" startIcon={<Icon icon={Edit3} size="xs" />}>
        Редактировать
      </Button>
    ),
    divider: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `icon`, `badge` и `accessory` позволяют гибко комбинировать иконку раздела, счетчик и кнопки управления в одной 32px строке.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: icon, badge &amp; accessory
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте варианты icon, badge и accessory в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <SectionHeader {...args} />
      </div>
    </div>
  ),
};

export const PropCollapsibleAndOpen: Story = {
  name: 'Пропсы: collapsible, open, expandLabel, collapseLabel',
  args: {
    title: 'ОРИГИНАЛЬНОЕ ОПИСАНИЕ ВАКАНСИИ',
    collapsible: true,
    open: false,
    expandLabel: 'Показать полностью',
    collapseLabel: 'Свернуть',
    divider: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'При `collapsible={true}` шапка получает `role="button"`, `tabIndex={0}`, `aria-expanded={open}` и отображает справа подсказку `expandLabel` / `collapseLabel` с иконкой шеврона.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: collapsible, open, expandLabel &amp; collapseLabel
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаг open в панели Controls для смены состояния шеврона и подписи:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <SectionHeader {...args} />
      </div>
    </div>
  ),
};
