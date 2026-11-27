import { Award, Ban, CheckCircle2, Clock, MapPin, Sparkles, Tag } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

const ALL_VARIANTS = ['subtle', 'solid', 'outline', 'chip', 'counter', 'ghost'] as const;
const ALL_SIZES = ['xs', 'sm', 'md', 'lg'] as const;
const ALL_TONES = [
  'neutral',
  'primary',
  'secondary',
  'muted',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
] as const;

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
      options: ALL_TONES,
      description: 'Семантический цветовой тон бейджа.',
    },
    variant: {
      control: 'select',
      options: ALL_VARIANTS,
      description: 'Визуальный стиль бейджа (`subtle`, `solid`, `outline`, `chip`, `counter`, `ghost`).',
    },
    size: {
      control: 'inline-radio',
      options: ALL_SIZES,
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
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Badge` со всеми контролами (`variant`, `tone`, `size`, `icon`, `endIcon`, `interactive`, `active`, `children`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Badge — Универсальный индикатор статуса, чип и счетчик (Все контролы)
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

export const PropVariantAll: Story = {
  name: 'Пропс: variant — Все варианты (Контролы: tone, children)',
  args: {
    tone: 'primary',
    children: 'Badge',
  },
  parameters: {
    controls: {
      include: ['tone', 'children'],
    },
    docs: {
      description: {
        story:
          'Показывает все 6 вариантов `variant` (`subtle`, `solid`, `outline`, `chip`, `counter`, `ghost`) одновременно. В панели Controls доступны только `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant — Все варианты (Controls: только tone и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Изменяйте tone и children, чтобы сравнить все 6 вариантов оформления:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_VARIANTS.map((v) => (
            <Badge key={v} variant={v} tone={args.tone}>
              {args.children} ({v})
            </Badge>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropVariantSingle: Story = {
  name: 'Пропс: variant — Выбор варианта (Контролы: variant, children)',
  args: {
    variant: 'solid',
    children: '92% Match',
  },
  parameters: {
    controls: {
      include: ['variant', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночный бейдж с двумя контролами: `variant` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant — Одиночный бейдж (Controls: только variant и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте variant (&quot;{args.variant}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge variant={args.variant} tone="success">
            {args.children}
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все цвета (Контрол: только children)',
  args: {
    children: 'Status',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все семантические цвета `tone` одновременно с единственным контролом `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Все семантические тона (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Введите текст в контрол children для сравнения всех 9 тонов:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_TONES.map((t) => (
            <Badge key={t} tone={t}>
              {args.children} ({t})
            </Badge>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropToneSingle: Story = {
  name: 'Пропс: tone — Выбор тона (Контролы: tone, children)',
  args: {
    tone: 'success',
    children: 'Active Worker',
  },
  parameters: {
    controls: {
      include: ['tone', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночный бейдж с двумя контролами: `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Одиночный бейдж (Controls: только tone и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите tone (&quot;{args.tone}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge tone={args.tone}>{args.children}</Badge>
        </div>
      </div>
    </div>
  ),
};

export const PropSizeAll: Story = {
  name: 'Пропс: size — Все размеры (Контрол: только children)',
  args: {
    children: 'Size Token',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все размеры `size` (`xs`, `sm`, `md`, `lg`) одновременно с единственным контролом `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Все размеры (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение размеров xs, sm, md и lg:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_SIZES.map((sz) => (
            <Badge key={sz} size={sz} tone="primary">
              {args.children} ({sz})
            </Badge>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropSizeSingle: Story = {
  name: 'Пропс: size — Выбор размера (Контролы: size, children)',
  args: {
    size: 'md',
    children: 'Badge Size',
  },
  parameters: {
    controls: {
      include: ['size', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночный бейдж с двумя контролами: `size` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Одиночный бейдж (Controls: только size и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size (&quot;{args.size}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge size={args.size} tone="primary">
            {args.children}
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const PropIconAndEndIcon: Story = {
  name: 'Пропсы: icon и endIcon (Контролы: icon, endIcon, children)',
  args: {
    icon: <Icon icon={Award} size="2xs" />,
    endIcon: <Icon icon={Sparkles} size="2xs" />,
    children: 'Top Candidate',
  },
  parameters: {
    controls: {
      include: ['icon', 'endIcon', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация слотов `icon` и `endIcon`. В панели Controls доступны только `icon`, `endIcon` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: icon &amp; endIcon (Controls: только icon, endIcon, children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконки для слотов icon и endIcon в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge tone="success" icon={args.icon} endIcon={args.endIcon}>
            {args.children}
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const PropInteractiveAndActive: Story = {
  name: 'Пропсы: interactive и active (Контролы: interactive, active, children)',
  args: {
    interactive: true,
    active: true,
    children: 'TypeScript (14)',
  },
  parameters: {
    controls: {
      include: ['interactive', 'active', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропсов `interactive` и `active`. В панели Controls доступны только `interactive`, `active` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: interactive &amp; active (Controls: только interactive, active, children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаги interactive ({String(args.interactive)}) и active ({String(args.active)}):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge
            variant="chip"
            tone={args.active ? 'accent' : 'neutral'}
            interactive={args.interactive}
            active={args.active}
          >
            {args.children}
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export const PropRemoveLabel: Story = {
  name: 'Пропсы: onRemove и removeLabel (Контролы: removeLabel, children)',
  args: {
    removeLabel: 'Удалить тег React 19',
    children: 'React 19',
  },
  parameters: {
    controls: {
      include: ['removeLabel', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация кнопки удаления внутри бейджа. В панели Controls доступны только `removeLabel` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: onRemove &amp; removeLabel (Controls: только removeLabel и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте aria-label кнопки удаления (removeLabel=&quot;{args.removeLabel}&quot;):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Badge
            variant="chip"
            size="sm"
            tone="primary"
            removeLabel={args.removeLabel}
            onRemove={() => undefined}
          >
            {args.children}
          </Badge>
        </div>
      </div>
    </div>
  ),
};
