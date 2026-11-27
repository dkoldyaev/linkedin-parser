import { ArrowRight, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

const ALL_VARIANTS = ['primary', 'secondary', 'ghost'] as const;
const ALL_SIZES = ['sm', 'md', 'lg'] as const;
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
  Sparkles: <Icon icon={Sparkles} size="sm" />,
  Plus: <Icon icon={Plus} size="sm" />,
  Trash2: <Icon icon={Trash2} size="sm" />,
  RefreshCw: <Icon icon={RefreshCw} size="sm" />,
  ArrowRight: <Icon icon={ArrowRight} size="sm" />,
} as const;

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент кнопки `Button`, выровненный по 32px сетке Blueprint (`--ui-grid-cell`). Поддерживает визуальные варианты (`primary`, `secondary`, `ghost`), семантические цветовые тона (`tone`), размеры (`sm`, `md`, `lg`, `icon`, `icon-sm`, `icon-xs`), состояние загрузки (`loading` с `<Spinner>`), растягивание на всю ширину (`fullWidth`) и слоты иконок (`startIcon`, `endIcon`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    tone: 'neutral',
    loading: false,
    disabled: false,
    fullWidth: false,
    children: 'Execute Action',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ALL_VARIANTS,
      description: 'Визуальный стиль кнопки: `primary` (залитая акцентная), `secondary` (контурная), `ghost` (прозрачная).',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon', 'icon-sm', 'icon-xs'],
      description: 'Размер кнопки на 32px сетке (`sm` = 24px, `md` = 32px, `lg` = 40px, а также квадратные иконочные размеры).',
    },
    tone: {
      control: 'select',
      options: ALL_TONES,
      description: 'Семантический цветовой тон кнопки (например `danger` для удаления, `success` для подтверждения).',
    },
    loading: {
      control: 'boolean',
      description: 'Включает индикатор загрузки `<Spinner size="sm" />` и блокирует повторные нажатия (`aria-busy="true"`).',
    },
    disabled: {
      control: 'boolean',
      description: 'Переводит кнопку в неактивное состояние (`disabled`).',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Растягивает кнопку на 100% ширины родительского контейнера.',
    },
    startIcon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Иконка перед текстом кнопки (`<Icon />`).',
    },
    endIcon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Иконка после текста кнопки (`<Icon />`).',
    },
    asChild: {
      control: 'boolean',
      description: 'Делегирует рендеринг дочернему элементу через Radix `<Slot>`.',
    },
    children: {
      control: 'text',
      description: 'Текстовая подпись кнопки.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Button` со всеми контролами (`variant`, `tone`, `size`, `loading`, `disabled`, `fullWidth`, `startIcon`, `endIcon`, `children`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Button — Основной интерактивный триггер действий (Все контролы)
        </Text>
        <Text variant="caption" tone="secondary">
          Кнопка со строгой привязкой к 32px сетке, поддержкой иконок, тонов и состояния загрузки.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Button {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropVariantAll: Story = {
  name: 'Пропс: variant — Все варианты (Контрол: только children)',
  args: {
    children: 'Execute Action',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все 3 варианта `variant` (`primary`, `secondary`, `ghost`) одновременно. В панели Controls оставлен **только один контрол** `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant — Все варианты (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените подпись children в Controls для сравнения вариантов primary, secondary и ghost:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {args.children} ({v})
            </Button>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropVariantSingle: Story = {
  name: 'Пропс: variant — Выбор варианта (Контролы: variant, children)',
  args: {
    variant: 'primary',
    children: 'Настраиваемый вариант кнопки',
  },
  parameters: {
    controls: {
      include: ['variant', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночная кнопка с двумя контролами: `variant` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant — Одиночная кнопка (Controls: только variant и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте variant (&quot;{args.variant}&quot;) и подпись children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Button variant={args.variant}>{args.children}</Button>
        </div>
      </div>
    </div>
  ),
};

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все цвета во всех вариантах (Контролы: tone, children)',
  args: {
    tone: 'danger',
    children: 'Action',
  },
  parameters: {
    controls: {
      include: ['tone', 'children'],
    },
    docs: {
      description: {
        story:
          'Показывает, как выбранный семантический `tone` окрашивает все 3 варианта кнопки (`primary`, `secondary`, `ghost`). В Controls доступны только `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone (Controls: только tone и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите tone (&quot;{args.tone}&quot;) в Controls, чтобы увидеть его применение к primary,
          secondary и ghost:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button variant="primary" tone={args.tone}>
            Primary ({args.tone}): {args.children}
          </Button>
          <Button variant="secondary" tone={args.tone}>
            Secondary ({args.tone}): {args.children}
          </Button>
          <Button variant="ghost" tone={args.tone}>
            Ghost ({args.tone}): {args.children}
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const PropSizeAll: Story = {
  name: 'Пропс: size — Все размеры (Контрол: только children)',
  args: {
    children: 'Button Scale',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все размеры `size` (`sm`, `md`, `lg`, `icon`, `icon-sm`, `icon-xs`) с единственным контролом `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Все размеры на 32px сетке (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение всех текстовых и иконочных размеров кнопки:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_SIZES.map((sz) => (
            <Button key={sz} size={sz} variant="primary">
              {args.children} ({sz})
            </Button>
          ))}
          <Button size="icon" variant="secondary" aria-label="icon 32px">
            <Icon icon={Plus} size="sm" />
          </Button>
          <Button size="icon-sm" variant="secondary" aria-label="icon-sm 24px">
            <Icon icon={Plus} size="xs" />
          </Button>
          <Button size="icon-xs" variant="secondary" aria-label="icon-xs 20px">
            <Icon icon={Plus} size="2xs" />
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const PropSizeSingle: Story = {
  name: 'Пропс: size — Выбор размера (Контролы: size, children)',
  args: {
    size: 'md',
    children: 'Кнопка выбранного размера',
  },
  parameters: {
    controls: {
      include: ['size', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночная кнопка с двумя контролами: `size` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Одиночная кнопка (Controls: только size и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size (&quot;{args.size}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Button size={args.size} variant="primary">
            {args.children}
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const PropLoading: Story = {
  name: 'Пропс: loading (Контролы: loading, children)',
  args: {
    loading: true,
    children: 'Обработка очереди...',
  },
  parameters: {
    controls: {
      include: ['loading', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `loading`. В панели Controls доступны только `loading` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: loading (Controls: только loading и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг loading ({String(args.loading)}) для проверки спиннера во всех вариантах:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button variant="primary" loading={args.loading}>
            {args.children}
          </Button>
          <Button variant="secondary" loading={args.loading}>
            {args.children}
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Контролы: disabled, children)',
  args: {
    disabled: true,
    children: 'Действие заблокировано',
  },
  parameters: {
    controls: {
      include: ['disabled', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `disabled`. В панели Controls доступны только `disabled` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: disabled (Controls: только disabled и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг disabled ({String(args.disabled)}) в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button variant="primary" disabled={args.disabled}>
            {args.children}
          </Button>
          <Button variant="secondary" disabled={args.disabled}>
            {args.children}
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const PropFullWidth: Story = {
  name: 'Пропс: fullWidth (Контролы: fullWidth, children)',
  args: {
    fullWidth: true,
    children: 'Кнопка на всю ширину контейнера',
  },
  parameters: {
    controls: {
      include: ['fullWidth', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `fullWidth`. В панели Controls доступны только `fullWidth` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: fullWidth (Controls: только fullWidth и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите fullWidth ({String(args.fullWidth)}) в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Button variant="primary" fullWidth={args.fullWidth}>
          {args.children}
        </Button>
      </div>
    </div>
  ),
};

export const PropStartAndEndIcons: Story = {
  name: 'Пропсы: startIcon и endIcon (Контролы: startIcon, endIcon, children)',
  args: {
    startIcon: <Icon icon={Sparkles} size="sm" />,
    endIcon: <Icon icon={ArrowRight} size="sm" />,
    children: 'Запустить AI-адаптацию',
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
          Выберите иконки в полях startIcon и endIcon на панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Button variant="primary" startIcon={args.startIcon} endIcon={args.endIcon}>
            {args.children}
          </Button>
        </div>
      </div>
    </div>
  ),
};
