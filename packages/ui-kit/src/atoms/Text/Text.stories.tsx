import { Building2, CheckCircle2, DollarSign, Globe, History, MapPin, Sparkles } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { StatusDot } from '../StatusDot';
import { Text } from './Text';

const ALL_VARIANTS = [
  'display',
  'heading',
  'title',
  'mono-label',
  'body',
  'body-sm',
  'caption',
  'mono',
] as const;

const ALL_SIZES = ['2xs', 'xs', 'sm', 'md', 'base', 'lg', 'xl', '2xl'] as const;

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

const ALL_WEIGHTS = ['regular', 'medium', 'semibold', 'bold'] as const;

const ICON_MAP = {
  none: undefined,
  Globe: <Icon icon={Globe} size="xs" />,
  MapPin: <Icon icon={MapPin} size="xs" />,
  DollarSign: <Icon icon={DollarSign} size="xs" />,
  Sparkles: <Icon icon={Sparkles} size="xs" />,
  History: <Icon icon={History} size="2xs" />,
  Building2: <Icon icon={Building2} size="xs" />,
  CheckCircle2: <Icon icon={CheckCircle2} size="xs" tone="success" />,
  StatusDotInfo: <StatusDot tone="info" size="sm" glow />,
} as const;

const meta: Meta<typeof Text> = {
  title: 'Atoms/Text/Text',
  component: Text,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Полиморфный атомарный компонент типографики `Text`. Поддерживает переключение HTML-тега (`as`), типографические пресеты (`variant`), точные токены размера (`size`), семантические тона (`tone`), насыщенность (`weight`), слоты иконок (`startIcon`, `endIcon`), обрезку (`truncate`) и привязку к 32px сетке (`snapToGrid`, `lineHeight`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    as: 'span',
    variant: 'body',
    tone: 'primary',
    weight: 'regular',
    truncate: false,
    snapToGrid: false,
    lineHeight: 'auto',
    children: 'Blueprint architectural typography specimen.',
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['span', 'p', 'div', 'h1', 'h2', 'h3', 'h4', 'label', 'code', 'strong', 'time'],
      description: 'HTML-элемент, который будет отрендерен в DOM.',
    },
    asChild: {
      control: 'boolean',
      description: 'Если `true`, делегирует рендеринг дочернему элементу через Radix `<Slot>`.',
    },
    variant: {
      control: 'select',
      options: ALL_VARIANTS,
      description: 'Типографический пресет (семейство шрифта, размер, межбуквенный интервал).',
    },
    size: {
      control: 'select',
      options: ALL_SIZES,
      description: 'Явное переопределение размера шрифта по шкале `--ui-font-size-*`.',
    },
    tone: {
      control: 'select',
      options: ALL_TONES,
      description: 'Семантический цветовой тон текста.',
    },
    weight: {
      control: 'inline-radio',
      options: ALL_WEIGHTS,
      description: 'Насыщенность начертания шрифта (`font-weight`).',
    },
    truncate: {
      control: 'boolean',
      description: 'Обрезает однострочный текст многоточием (`text-overflow: ellipsis`) при нехватке ширины.',
    },
    startIcon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Слот для иконки или индикатора перед текстом.',
    },
    endIcon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Слот для иконки или индикатора после текста.',
    },
    snapToGrid: {
      control: 'boolean',
      description: 'Квантует высоту текстового блока кратно ячейке 32px (`--ui-grid-cell`).',
    },
    lineHeight: {
      control: 'inline-radio',
      options: ['auto', 'grid', 0.5],
      description: 'Режим межстрочного интервала: `auto`, `grid` (32px) или `0.5` (16px).',
    },
    children: {
      control: 'text',
      description: 'Текстовое содержимое компонента.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная история компонента `Text`, в которой доступны все пропсы для комплексной настройки.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Text — Базовый полиморфный атом типографики (Все контролы)
        </Text>
        <Text variant="caption" tone="secondary">
          Универсальный текстовый примитив для меток, заголовков, моноширинных данных и статусных
          строк с иконками.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Text {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropSizeAll: Story = {
  name: 'Пропс: size — Все размеры (Контрол: только children)',
  args: {
    children: 'CV.ALTER // Blueprint Font Size Scale 0123456789',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все значения пропса `size` (`2xs`, `xs`, `sm`, `md`, `base`, `lg`, `xl`, `2xl`) одновременно. В панели Controls доступен **только один контрол** — `children`, чтобы задать единый текст для сравнения всей шкалы размеров.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Все размеры шрифта (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Введите свой текст в контрол children, чтобы сравнить все 8 размеров шкалы --ui-font-size-*:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {ALL_SIZES.map((sz) => (
            <div key={sz} className={layoutStyles.box}>
              <Text as="div" variant="mono" size="2xs" tone="accent">
                size=&quot;{sz}&quot; (--ui-font-size-{sz})
              </Text>
              <Text as="div" size={sz}>
                {args.children}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropSizeSingle: Story = {
  name: 'Пропс: size — Интерактивный выбор (Контролы: size, children)',
  args: {
    size: 'lg',
    children: 'Настраиваемый размер текста для одного блока',
  },
  parameters: {
    controls: {
      include: ['size', 'children'],
    },
    docs: {
      description: {
        story:
          'Интерактивная демонстрация одного текстового блока с **двумя контролами**: `size` (выбор размера текста) и `children` (текстовое содержимое).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Одиночный блок (Controls: только size и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите размер шрифта size (&quot;{args.size}&quot;) и измените содержимое children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text as="div" size={args.size}>
            {args.children}
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const PropVariantAll: Story = {
  name: 'Пропс: variant — Все варианты (Контрол: только children)',
  args: {
    children: 'Blueprint Design System Typography Variant',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все значения пропса `variant` (`display`, `heading`, `title`, `mono-label`, `body`, `body-sm`, `caption`, `mono`). В панели Controls оставлен **только один контрол** `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant — Все пресеты (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените children в Controls для сравнения всех 8 типографических пресетов:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {ALL_VARIANTS.map((v) => (
            <div key={v} className={layoutStyles.box}>
              <Text as="div" variant="mono" size="2xs" tone="accent">
                variant=&quot;{v}&quot;
              </Text>
              <Text as="div" variant={v}>
                {args.children}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropVariantSingle: Story = {
  name: 'Пропс: variant — Интерактивный выбор (Контролы: variant, children)',
  args: {
    variant: 'mono-label',
    children: 'STATUS: ACTIVE_WORKER_NODE',
  },
  parameters: {
    controls: {
      include: ['variant', 'children'],
    },
    docs: {
      description: {
        story:
          'Одиночный блок текста с **двумя контролами**: `variant` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant — Одиночный блок (Controls: только variant и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте variant (&quot;{args.variant}&quot;) и редактируйте текст children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text variant={args.variant}>{args.children}</Text>
        </div>
      </div>
    </div>
  ),
};

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все цвета (Контрол: только children)',
  args: {
    children: 'Семантический цветовой тон текста',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Отображает все семантические тона `tone` (`neutral`, `primary`, `secondary`, `muted`, `accent`, `success`, `warning`, `danger`, `info`) с единственным контролом `children`.',
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
          Введите текст в контрол children для сравнения всех 9 цветовых тонов:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {ALL_TONES.map((t) => (
            <div key={t} className={layoutStyles.row}>
              <Text variant="mono" size="xs" tone="muted">
                tone=&quot;{t}&quot;:
              </Text>
              <Text tone={t} weight="semibold">
                {args.children}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropToneSingle: Story = {
  name: 'Пропс: tone — Интерактивный выбор (Контролы: tone, children)',
  args: {
    tone: 'success',
    children: '€140,000 – €165,000 / yr',
  },
  parameters: {
    controls: {
      include: ['tone', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночный текстовый блок с двумя контролами: `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Одиночный блок (Controls: только tone и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите тон (&quot;{args.tone}&quot;) и текст в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text tone={args.tone} weight="semibold">
            {args.children}
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const PropWeightAll: Story = {
  name: 'Пропс: weight — Все начертания (Контрол: только children)',
  args: {
    children: 'Насыщенность шрифта Blueprint (400 / 500 / 600 / 700)',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все варианты `weight` (`regular`, `medium`, `semibold`, `bold`) с единственным контролом `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: weight — Все варианты насыщенности (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение всех 4 вариантов font-weight:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {ALL_WEIGHTS.map((w) => (
            <Text key={w} as="div" weight={w}>
              weight=&quot;{w}&quot; — {args.children}
            </Text>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropWeightSingle: Story = {
  name: 'Пропс: weight — Интерактивный выбор (Контролы: weight, children)',
  args: {
    weight: 'bold',
    children: 'Текст с настраиваемой насыщенностью',
  },
  parameters: {
    controls: {
      include: ['weight', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночный блок текста с двумя контролами: `weight` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: weight — Одиночный блок (Controls: только weight и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте weight (&quot;{args.weight}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text weight={args.weight}>{args.children}</Text>
        </div>
      </div>
    </div>
  ),
};

export const PropAs: Story = {
  name: 'Пропс: as (Контролы: as, children)',
  args: {
    as: 'time',
    children: '2026-11-27 10:00 UTC',
  },
  parameters: {
    controls: {
      include: ['as', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация полиморфного пропса `as` (`span`, `p`, `div`, `h1`..`h4`, `label`, `code`, `strong`, `time`). В Controls доступны только `as` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: as (Controls: только as и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Рендерит выбранный HTML-тег &lt;{args.as}&gt;:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text as={args.as}>{args.children}</Text>
        </div>
      </div>
    </div>
  ),
};

export const PropStartAndEndIcons: Story = {
  name: 'Пропсы: startIcon и endIcon (Контролы: startIcon, endIcon, children)',
  args: {
    startIcon: <Icon icon={Globe} size="xs" />,
    endIcon: <StatusDot tone="info" size="sm" glow />,
    children: 'Remote • EU Cluster',
  },
  parameters: {
    controls: {
      include: ['startIcon', 'endIcon', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация слотов `startIcon` и `endIcon`. В панели Controls доступны только `startIcon`, `endIcon` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: startIcon &amp; endIcon (Controls: только startIcon, endIcon, children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконки слева и справа от текста:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text startIcon={args.startIcon} endIcon={args.endIcon} tone="info" variant="mono">
            {args.children}
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const PropTruncate: Story = {
  name: 'Пропс: truncate (Контролы: truncate, children)',
  args: {
    truncate: true,
    children:
      'Очень длинный заголовок должности или описания, который аккуратно обрезается многоточием при переполнении узкого контейнера',
  },
  parameters: {
    controls: {
      include: ['truncate', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация обрезки текста многоточием `truncate` внутри контейнера шириной 320px. В Controls доступны только `truncate` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: truncate (Controls: только truncate и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаг truncate ({String(args.truncate)}) в узком блоке 320px:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <div className={layoutStyles.box}>
            <Text as="div" truncate={args.truncate}>
              {args.children}
            </Text>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const PropSnapToGridAndLineHeight: Story = {
  name: 'Пропсы: snapToGrid и lineHeight (Контролы: snapToGrid, lineHeight, children)',
  args: {
    snapToGrid: true,
    lineHeight: 'grid',
    children: 'Высота и межстрочный интервал кратны ячейке 32px (--ui-grid-cell)',
  },
  parameters: {
    controls: {
      include: ['snapToGrid', 'lineHeight', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация привязки текста к 32px сетке Blueprint. В панели Controls доступны только `snapToGrid`, `lineHeight` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: snapToGrid &amp; lineHeight (Controls: только snapToGrid, lineHeight, children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте snapToGrid ({String(args.snapToGrid)}) и lineHeight (&quot;{args.lineHeight}
          &quot;):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text
            as="div"
            variant="mono"
            tone="accent"
            snapToGrid={args.snapToGrid}
            lineHeight={args.lineHeight}
          >
            {args.children}
          </Text>
        </div>
      </div>
    </div>
  ),
};
