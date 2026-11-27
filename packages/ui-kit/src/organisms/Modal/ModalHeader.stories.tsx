import { Badge, Button, Icon, Text } from '../../atoms';
import {
  Banknote,
  Briefcase,
  ExternalLink,
  FileText,
  Laptop,
  MapPin,
  RefreshCw,
  Settings,
  Shield,
} from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { ModalHeader } from './ModalHeader';
import { Tabs } from '../../molecules/Tabs';

const ICON_MAP = {
  none: undefined,
  Briefcase: <Icon icon={Briefcase} size="md" tone="accent" />,
  Settings: <Icon icon={Settings} size="md" tone="accent" />,
} as const;

const ACTIONS_MAP = {
  none: undefined,
  SyncAndLinkedInBtns: (
    <>
      <Button variant="ghost" size="sm">
        <Icon icon={RefreshCw} size="sm" />
        <span>Reparse</span>
      </Button>
      <Button variant="ghost" size="sm">
        <Icon icon={ExternalLink} size="sm" />
        <span>LinkedIn</span>
      </Button>
    </>
  ),
} as const;

const META_MAP = {
  none: undefined,
  LocationAndSalaryBadges: (
    <>
      <Badge tone="neutral" size="xs" icon={<Icon icon={MapPin} size="xs" />}>
        Berlin, Germany
      </Badge>
      <Badge tone="info" size="xs" icon={<Icon icon={Laptop} size="xs" />}>
        Remote
      </Badge>
      <Badge tone="success" size="xs" icon={<Icon icon={Banknote} size="xs" />}>
        €85,000 – €110,000 / yr
      </Badge>
    </>
  ),
} as const;

const TABS_MAP = {
  none: undefined,
  DetailsAndCompatibilityTabs: (
    <Tabs
      defaultValue="details"
      items={[
        {
          value: 'details',
          label: 'Описание и детали',
          icon: <Icon icon={FileText} size="sm" />,
        },
        {
          value: 'compatibility',
          label: 'Совместимость 88%',
          icon: <Icon icon={Shield} size="sm" />,
        },
      ]}
    />
  ),
} as const;

const meta: Meta<typeof ModalHeader> = {
  title: 'Organisms/Modal/ModalHeader',
  component: ModalHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Доступный подкомпонент шапки модального окна `ModalHeader` (`Modal.Header`), квантованный по высоте 32px сетки Blueprint (`data-min-grids="2"`). Декомпозирует заголовок диалога на зоны: `icon`, `title`, `description`, правый блок действий `actions` + кнопка закрытия (`hideCloseButton`, `closeLabel`), строку мета-бейджей `meta` (`<ModalHeader.Meta>`) и полосу навигационных вкладок `tabs` (`<Tabs>`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'Senior Frontend Platform Engineer',
    description: 'Linear • Berlin, Germany',
    icon: ICON_MAP.Briefcase,
    actions: ACTIONS_MAP.SyncAndLinkedInBtns,
    meta: META_MAP.LocationAndSalaryBadges,
    tabs: TABS_MAP.DetailsAndCompatibilityTabs,
    hideCloseButton: false,
    closeLabel: 'Закрыть модальное окно',
  },
  argTypes: {
    title: { control: 'text', description: 'Основной заголовок диалогового окна (`<h2>`).' },
    description: { control: 'text', description: 'Описание или подзаголовок под основным названием.' },
    icon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Ведущая иконка слева от заголовка.',
    },
    actions: {
      control: 'select',
      options: Object.keys(ACTIONS_MAP),
      mapping: ACTIONS_MAP,
      description: 'Дополнительные кнопки действий слева от кнопки закрытия (`X`).',
    },
    meta: {
      control: 'select',
      options: Object.keys(META_MAP),
      mapping: META_MAP,
      description: 'Слот метаданных (бейджи локации, формата работы, зарплаты) под заголовком.',
    },
    tabs: {
      control: 'select',
      options: Object.keys(TABS_MAP),
      mapping: TABS_MAP,
      description: 'Слот навигационных вкладок `<Tabs>` в нижней части шапки.',
    },
    hideCloseButton: {
      control: 'boolean',
      description: 'Скрывает кнопку закрытия (`X`).',
    },
    closeLabel: {
      control: 'text',
      description: 'Метка `aria-label` для кнопки закрытия.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalHeader>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ModalHeader`. Настраивайте `title`, `description`, `icon`, `actions`, `meta`, `tabs`, `hideCloseButton` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ModalHeader — Составная шапка модального диалога
        </Text>
        <Text variant="caption" tone="secondary">
          Включает зоны заголовка, кнопок действий, мета-бейджей и вкладок.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalHeader {...args} onClose={() => undefined} />
      </div>
    </div>
  ),
};

export const PropTitleDescriptionAndIcon: Story = {
  name: 'Пропсы: title, description и icon',
  args: {
    title: 'Создать этап воронки',
    description: 'Добавьте новую колонку на Канбан-доску кандидатов.',
    icon: ICON_MAP.Settings,
    actions: undefined,
    meta: undefined,
    tabs: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Базовая конфигурация шапки только с иконкой, заголовком и описанием.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: title, description &amp; icon
        </Text>
        <Text variant="caption" tone="secondary">
          Измените title, description и icon в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalHeader {...args} onClose={() => undefined} />
      </div>
    </div>
  ),
};

export const PropActionsMetaAndTabs: Story = {
  name: 'Пропсы: actions, meta и tabs (Расширенная шапка инспектора)',
  args: {
    title: 'Staff UI Architect',
    description: 'Stripe • Dublin, Ireland',
    icon: ICON_MAP.Briefcase,
    actions: ACTIONS_MAP.SyncAndLinkedInBtns,
    meta: META_MAP.LocationAndSalaryBadges,
    tabs: TABS_MAP.DetailsAndCompatibilityTabs,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `actions`, `meta` и `tabs` превращают шапку в полноценный заголовок инспектора карточки вакансии.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: actions, meta &amp; tabs
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте слоты actions, meta и tabs в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalHeader {...args} onClose={() => undefined} />
      </div>
    </div>
  ),
};

export const PropHideCloseButtonAndCloseLabel: Story = {
  name: 'Пропсы: hideCloseButton и closeLabel',
  args: {
    title: 'Обязательный шаг верификации',
    description: 'Завершите настройку перед закрытием окна.',
    hideCloseButton: true,
    actions: undefined,
    meta: undefined,
    tabs: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `hideCloseButton` убирает крестик закрытия из правого верхнего угла шапки.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: hideCloseButton &amp; closeLabel
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг hideCloseButton в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalHeader {...args} onClose={() => undefined} />
      </div>
    </div>
  ),
};
