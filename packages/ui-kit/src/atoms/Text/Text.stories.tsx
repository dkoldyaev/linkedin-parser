import { Building2, CheckCircle2, DollarSign, Globe, History, MapPin, Sparkles } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { StatusDot } from '../StatusDot';
import { Text } from './Text';

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
          'Полиморфный атомарный компонент типографики `Text`. Является фундаментом текстовой системы `@blueprint/ui-kit`: поддерживает переключение HTML-тега (`as`), типографические пресеты (`variant`), точные токены размера (`size`), семантические тона (`tone`), слоты иконок (`startIcon`, `endIcon`), обрезку (`truncate`) и привязку к 32px сетке (`snapToGrid`, `lineHeight`).',
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
      options: ['display', 'heading', 'title', 'mono-label', 'body', 'body-sm', 'caption', 'mono'],
      description: 'Типографический пресет (семейство шрифта, размер, межбуквенный интервал).',
    },
    size: {
      control: 'select',
      options: [undefined, '2xs', 'xs', 'sm', 'md', 'base', 'lg', 'xl', '2xl'],
      description: 'Явное переопределение размера шрифта по шкале `--ui-font-size-*`.',
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
      description: 'Семантический цветовой тон текста.',
    },
    weight: {
      control: 'inline-radio',
      options: ['regular', 'medium', 'semibold', 'bold'],
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
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная история компонента `Text`. Используйте панель Controls для проверки всех пропсов в реальном времени.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Text — Базовый полиморфный атом типографики
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

export const PropVariant: Story = {
  name: 'Пропс: variant (Типографический пресет)',
  args: {
    variant: 'mono-label',
    tone: 'accent',
    children: 'STATUS: ACTIVE_WORKER_NODE',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `variant` задает комплексный стиль текста: `display`, `heading`, `title`, `mono-label`, `body`, `body-sm`, `caption`, `mono`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant
        </Text>
        <Text variant="caption" tone="secondary">
          Выбирает предустановленный стиль шрифта (Inter или JetBrains Mono). Измените variant в
          Controls для верхнего образца или сравните все варианты ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text {...args} />
        </div>
        <div className={layoutStyles.stackSm}>
          <Text as="div" variant="display">
            variant=&quot;display&quot; — Blueprint Design System
          </Text>
          <Text as="div" variant="heading">
            variant=&quot;heading&quot; — System Architecture &amp; Primitives
          </Text>
          <Text as="div" variant="title">
            variant=&quot;title&quot; — Distributed Systems Lead
          </Text>
          <Text as="div" variant="mono-label" tone="accent">
            variant=&quot;mono-label&quot; — SECTION_HEADER_TOKEN
          </Text>
          <Text as="div" variant="body">
            variant=&quot;body&quot; — Основной текст интерфейса (13px Inter)
          </Text>
          <Text as="div" variant="body-sm">
            variant=&quot;body-sm&quot; — Компактный основной текст (12px Inter)
          </Text>
          <Text as="div" variant="caption" tone="secondary">
            variant=&quot;caption&quot; — Вторичные метаданные и подписи
          </Text>
          <Text as="div" variant="mono" tone="success">
            variant=&quot;mono&quot; — --ui-grid-cell: 32px
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический цвет)',
  args: {
    variant: 'mono',
    tone: 'success',
    children: '€140,000 – €165,000 / yr',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` окрашивает текст в один из семантических цветов дизайн-системы (`neutral`, `primary`, `secondary`, `muted`, `accent`, `success`, `warning`, `danger`, `info`).',
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
          Отвечает за семантический цвет текста. Переключайте tone в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Text tone="primary">primary</Text>
          <Text tone="secondary">secondary</Text>
          <Text tone="muted">muted</Text>
          <Text tone="accent">accent</Text>
          <Text tone="success">success</Text>
          <Text tone="warning">warning</Text>
          <Text tone="danger">danger</Text>
          <Text tone="info">info</Text>
        </div>
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Токен размера шрифта)',
  args: {
    variant: 'mono',
    size: 'lg',
    tone: 'accent',
    children: 'Explicit FontSizeToken override',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `size` позволяет явно задать размер текста из шкалы `--ui-font-size-*` (`2xs`, `xs`, `sm`, `md`, `base`, `lg`, `xl`, `2xl`) независимо от выбранного `variant`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size (&quot;2xs&quot; | &quot;xs&quot; | &quot;sm&quot; | &quot;md&quot; | &quot;base&quot; | &quot;lg&quot; | &quot;xl&quot; | &quot;2xl&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переопределяет размер шрифта. Выберите size в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text {...args} />
        </div>
        <div className={layoutStyles.stackSm}>
          {(['2xs', 'xs', 'sm', 'md', 'base', 'lg', 'xl', '2xl'] as const).map((sz) => (
            <Text key={sz} as="div" variant="mono" size={sz}>
              size=&quot;{sz}&quot; — Blueprint Font Scale
            </Text>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropWeight: Story = {
  name: 'Пропс: weight (Насыщенность шрифта)',
  args: {
    weight: 'bold',
    children: 'Текст с настраиваемой насыщенностью (font-weight)',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `weight` задает насыщенность шрифта: `regular` (400), `medium` (500), `semibold` (600) или `bold` (700).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: weight (&quot;regular&quot; | &quot;medium&quot; | &quot;semibold&quot; | &quot;bold&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Управляет толщиной начертания текста:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Text weight="regular">regular (400)</Text>
          <Text weight="medium">medium (500)</Text>
          <Text weight="semibold">semibold (600)</Text>
          <Text weight="bold">bold (700)</Text>
        </div>
      </div>
    </div>
  ),
};

export const PropAs: Story = {
  name: 'Пропс: as (Полиморфный HTML-тег)',
  args: {
    as: 'time',
    variant: 'mono',
    tone: 'muted',
    children: '2026-11-27 10:00 UTC',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `as` определяет семантический HTML-тег (`span`, `p`, `div`, `h1`..`h4`, `label`, `code`, `strong`, `time`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: as
        </Text>
        <Text variant="caption" tone="secondary">
          Позволяет рендерить семантически корректный HTML-тег (сейчас выбран &lt;{args.as}&gt;):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Text {...args} />
      </div>
    </div>
  ),
};

export const PropStartAndEndIcons: Story = {
  name: 'Пропсы: startIcon и endIcon (Иконки по краям)',
  args: {
    variant: 'mono',
    tone: 'info',
    startIcon: <Icon icon={Globe} size="xs" />,
    endIcon: <StatusDot tone="info" size="sm" glow />,
    children: 'Remote • EU Cluster',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `startIcon` и `endIcon` позволяют встраивать иконки `<Icon />`, `<StatusDot />` или `<Spinner />` слева и справа от текста с автоматическим выравниванием по базовой линии.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: startIcon &amp; endIcon
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконки для startIcon и endIcon в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Text variant="caption" tone="info" startIcon={<Icon icon={Globe} size="xs" />}>
            Remote
          </Text>
          <Text variant="caption" tone="secondary" startIcon={<Icon icon={MapPin} size="xs" />}>
            Berlin, Germany
          </Text>
          <Text
            variant="mono"
            tone="success"
            weight="bold"
            startIcon={<Icon icon={DollarSign} size="xs" />}
          >
            7,500 EUR / mo
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const PropTruncate: Story = {
  name: 'Пропс: truncate (Обрезка многоточием)',
  args: {
    as: 'div',
    truncate: true,
    children:
      'Очень длинный заголовок должности или описания, который аккуратно обрезается многоточием при переполнении узкого контейнера',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `truncate` включает однострочную обрезку текста с `text-overflow: ellipsis` внутри ограниченного по ширине контейнера.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: truncate (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг truncate в Controls внутри контейнера шириной 320px (10 ячеек сетки):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <div className={layoutStyles.box}>
            <Text {...args} />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const PropSnapToGridAndLineHeight: Story = {
  name: 'Пропсы: snapToGrid и lineHeight (Квантование по 32px сетке)',
  args: {
    as: 'div',
    snapToGrid: true,
    lineHeight: 'grid',
    variant: 'mono',
    tone: 'accent',
    children: 'Высота и межстрочный интервал кратны ячейке 32px (--ui-grid-cell)',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `snapToGrid` выравнивает контейнер по высоте кратно 32px, а `lineHeight` (`"auto" | "grid" | 0.5`) фиксирует высоту строки в 1 ячейку (32px) или 0.5 ячейки (16px).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: snapToGrid &amp; lineHeight
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте snapToGrid и lineHeight (&quot;auto&quot;, &quot;grid&quot;, 0.5) в панели
          Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text {...args} />
        </div>
      </div>
    </div>
  ),
};
