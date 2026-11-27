import { Award, Ban, CheckCircle2, Clock, MapPin, Sparkles, Tag } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

const ICON_MAP = {
  none: undefined,
  Sparkles: <Icon icon={Sparkles} size="2xs" />,
  Award: <Icon icon={Award} size="2xs" />,
  CheckCircle2: <Icon icon={CheckCircle2} size="2xs" />,
  Clock: <Icon icon={Clock} size="2xs" />,
  Ban: <Icon icon={Ban} size="2xs" />,
  MapPin: <Icon icon={MapPin} size="2xs" />,
  Tag: <Icon icon={Tag} size="2xs" />,
} as const;

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Универсальный атомарный компонент `Badge` для отображения статусов, процентов совпадения, тегов технологического стека и числовых счетчиков. Композирует `<Text variant="mono">`, `<Icon>` и `<Button>` для кнопки удаления (`onRemove`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    tone: 'primary',
    variant: 'subtle',
    size: 'md',
    interactive: false,
    active: false,
    removeLabel: 'Remove',
    children: 'Badge Token',
  },
  argTypes: {
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
      description: 'Семантический цветовой тон бейджа.',
    },
    variant: {
      control: 'select',
      options: ['subtle', 'solid', 'outline', 'chip', 'counter', 'ghost'],
      description: 'Визуальный стиль бейджа (`subtle`, `solid`, `outline`, `chip`, `counter`, `ghost`).',
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Размер бейджа (`xs`, `sm`, `md`, `lg`).',
    },
    icon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Ведущая иконка слева от текста (`<Icon />`).',
    },
    endIcon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Завершающая иконка справа от текста (`<Icon />`).',
    },
    interactive: {
      control: 'boolean',
      description: 'Включает интерактивный режим (`role="button"`, `tabIndex=0`, hover-подсветка).',
    },
    active: {
      control: 'boolean',
      description: 'Отмечает интерактивный бейдж как выбранный (`aria-pressed="true"`).',
    },
    removeLabel: {
      control: 'text',
      description: 'ARIA-метка (`aria-label`) для кнопки удаления чипа при переданном `onRemove`.',
    },
    children: {
      control: 'text',
      description: 'Текстовая подпись или числовое значение внутри бейджа.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Badge`. Настраивайте `variant`, `tone`, `size`, `icon`, `endIcon`, `interactive`, `active` и `children` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Badge — Универсальный индикатор статуса, чип и счетчик
        </Text>
        <Text variant="caption" tone="secondary">
          Используйте панель Controls для интерактивного тестирования всех пропсов компонента.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropVariant: Story = {
  name: 'Пропс: variant (Визуальный вариант)',
  args: {
    variant: 'solid',
    tone: 'success',
    children: '92% Match',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `variant` переключает визуальное представление бейджа: `subtle` (полупрозрачная подложка), `solid` (плотная заливка), `outline` (контурный), `chip` (токен стека/фильтра), `counter` (компактный счетчик), `ghost` (без фона).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant (&quot;subtle&quot; | &quot;solid&quot; | &quot;outline&quot; | &quot;chip&quot; | &quot;counter&quot; | &quot;ghost&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените variant в Controls для первого образца или сравните все варианты ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Badge variant="subtle" tone="primary">
            subtle
          </Badge>
          <Badge variant="solid" tone="success">
            solid
          </Badge>
          <Badge variant="outline" tone="info">
            outline
          </Badge>
          <Badge variant="chip" tone="neutral">
            chip
          </Badge>
          <Badge variant="counter" tone="accent">
            14
          </Badge>
          <Badge variant="ghost" tone="secondary">
            ghost
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический цветовой тон)',
  args: {
    tone: 'success',
    children: 'Active Status',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` задает семантический цвет бейджа (`neutral`, `primary`, `secondary`, `muted`, `accent`, `success`, `warning`, `danger`, `info`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите tone в Controls и сравните со всей семантической палитрой:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Badge tone="neutral">neutral</Badge>
          <Badge tone="primary">primary</Badge>
          <Badge tone="secondary">secondary</Badge>
          <Badge tone="muted">muted</Badge>
          <Badge tone="accent">accent</Badge>
          <Badge tone="success">success</Badge>
          <Badge tone="warning">warning</Badge>
          <Badge tone="danger">danger</Badge>
          <Badge tone="info">info</Badge>
        </div>
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Размер бейджа)',
  args: {
    size: 'md',
    tone: 'primary',
    children: 'Size Token',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `size` регулирует высоту и внутренние отступы бейджа (`xs`, `sm`, `md`, `lg`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size (&quot;xs&quot; | &quot;sm&quot; | &quot;md&quot; | &quot;lg&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Badge size="xs" tone="primary">
            size=&quot;xs&quot;
          </Badge>
          <Badge size="sm" tone="primary">
            size=&quot;sm&quot;
          </Badge>
          <Badge size="md" tone="primary">
            size=&quot;md&quot;
          </Badge>
          <Badge size="lg" tone="primary">
            size=&quot;lg&quot;
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const PropIconAndEndIcon: Story = {
  name: 'Пропсы: icon и endIcon (Иконки внутри бейджа)',
  args: {
    icon: <Icon icon={Award} size="2xs" />,
    endIcon: <Icon icon={Sparkles} size="2xs" />,
    tone: 'success',
    children: 'Top Candidate',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропсы `icon` и `endIcon` позволяют разместить иконки слева и справа от текста бейджа.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: icon &amp; endIcon
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконки для слотов icon и endIcon в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropInteractiveAndActive: Story = {
  name: 'Пропсы: interactive и active (Кликабельный фильтр-чип)',
  args: {
    variant: 'chip',
    interactive: true,
    active: true,
    tone: 'accent',
    children: 'TypeScript (14)',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `interactive` делает бейдж фокусируемым с клавиатуры (`role="button"`, `tabIndex={0}`), а `active` подсвечивает выбранное состояние (`aria-pressed="true"`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: interactive &amp; active (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаги interactive и active в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge {...args} />
          <Badge variant="chip" interactive active={false} tone="neutral">
            Невыбранный фильтр (active=false)
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const PropOnRemoveAndRemoveLabel: Story = {
  name: 'Пропсы: onRemove и removeLabel (Удаляемый тег)',
  args: {
    variant: 'chip',
    size: 'sm',
    tone: 'primary',
    removeLabel: 'Удалить тег React 19',
    children: 'React 19',
  },
  parameters: {
    docs: {
      description: {
        story:
          'При передаче колбэка `onRemove` справа внутри бейджа появляется кнопка с иконкой `X` и доступной меткой `removeLabel`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: onRemove &amp; removeLabel
        </Text>
        <Text variant="caption" tone="secondary">
          Рендерит встроенную кнопку удаления тега с настраиваемым aria-label (removeLabel):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge {...args} onRemove={() => undefined} />
        </div>
      </div>
    </div>
  ),
};
