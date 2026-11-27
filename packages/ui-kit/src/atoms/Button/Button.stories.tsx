import { ArrowRight, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

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
      options: ['primary', 'secondary', 'ghost'],
      description: 'Визуальный стиль кнопки: `primary` (залитая акцентная), `secondary` (контурная), `ghost` (прозрачная).',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon', 'icon-sm', 'icon-xs'],
      description: 'Размер кнопки на 32px сетке (`sm` = 24px, `md` = 32px, `lg` = 40px, а также квадратные иконочные размеры).',
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
      description: 'Делегирует рендеринг дочернему элементу через Radix `<Slot>` (например для стилизации ссылки `<a>` под кнопку).',
    },
    children: {
      control: 'text',
      description: 'Текстовая подпись или содержимое кнопки.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Button`. Настраивайте `variant`, `tone`, `size`, `loading`, `disabled`, `fullWidth`, `startIcon` и `endIcon` через Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Button — Основной интерактивный триггер действий
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

export const PropVariant: Story = {
  name: 'Пропс: variant (Визуальный вариант)',
  args: {
    variant: 'primary',
    children: 'Активный вариант кнопки',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `variant` определяет базовую заливку и контур кнопки: `primary` (главное действие), `secondary` (второстепенное действие с рамкой) или `ghost` (текстовая/иконочная кнопка без рамки в покое).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant (&quot;primary&quot; | &quot;secondary&quot; | &quot;ghost&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте variant в панели Controls для изменения первого образца и сравните все 3
          варианта рядом:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Button variant="primary">variant=&quot;primary&quot;</Button>
          <Button variant="secondary">variant=&quot;secondary&quot;</Button>
          <Button variant="ghost">variant=&quot;ghost&quot;</Button>
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический цветовой тон)',
  args: {
    variant: 'primary',
    tone: 'danger',
    startIcon: <Icon icon={Trash2} size="sm" />,
    children: 'Удалить запись',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` модифицирует цветовую палитру кнопки для отражения смысла действия (`neutral`, `primary`, `accent`, `success`, `warning`, `danger`, `info`). Работает во всех вариантах (`primary`, `secondary`, `ghost`).',
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
          Окрашивает кнопку в семантический тон. Измените tone и variant в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Button variant="primary" tone="neutral">
            neutral
          </Button>
          <Button variant="primary" tone="success">
            success
          </Button>
          <Button variant="primary" tone="warning">
            warning
          </Button>
          <Button variant="primary" tone="danger">
            danger
          </Button>
          <Button variant="secondary" tone="danger">
            secondary + danger
          </Button>
          <Button variant="ghost" tone="accent">
            ghost + accent
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Размер кнопки на 32px сетке)',
  args: {
    size: 'md',
    variant: 'primary',
    children: 'Размер кнопки',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `size` задает габариты кнопки: текстовые `sm` (24px), `md` (32px — 1 ячейка сетки), `lg` (40px) и квадратные иконочные `icon` (32×32px), `icon-sm` (24×24px), `icon-xs` (20×20px).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size (&quot;sm&quot; | &quot;md&quot; | &quot;lg&quot; | &quot;icon&quot; | &quot;icon-sm&quot; | &quot;icon-xs&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Управляет высотой и внутренними отступами кнопки. Измените size в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Button size="sm" variant="secondary">
            size=&quot;sm&quot; (24px)
          </Button>
          <Button size="md" variant="secondary">
            size=&quot;md&quot; (32px)
          </Button>
          <Button size="lg" variant="secondary">
            size=&quot;lg&quot; (40px)
          </Button>
          <Button size="icon" variant="secondary" aria-label="Icon 32px">
            <Icon icon={Plus} size="sm" />
          </Button>
          <Button size="icon-sm" variant="secondary" aria-label="Icon 24px">
            <Icon icon={Plus} size="xs" />
          </Button>
          <Button size="icon-xs" variant="secondary" aria-label="Icon 20px">
            <Icon icon={Plus} size="2xs" />
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const PropLoading: Story = {
  name: 'Пропс: loading (Индикатор загрузки)',
  args: {
    loading: true,
    variant: 'primary',
    children: 'Обработка очереди...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `loading` автоматически подменяет `startIcon` на атомарный `<Spinner size="sm" />`, проставляет `aria-busy="true"` и блокирует клики по кнопке.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: loading (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг loading в Controls для включения/выключения спиннера:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Блокировка кнопки)',
  args: {
    disabled: true,
    variant: 'secondary',
    children: 'Действие недоступно',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `disabled` отключает интерактивность кнопки, снижает контрастность и блокирует фокус/клик.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: disabled (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите disabled в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropFullWidth: Story = {
  name: 'Пропс: fullWidth (Растягивание на 100% ширины)',
  args: {
    fullWidth: true,
    variant: 'primary',
    children: 'Кнопка на всю ширину контейнера',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `fullWidth` заставляет кнопку занять 100% доступной горизонтальной ширины родительского блока.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: fullWidth (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите fullWidth в Controls для проверки растягивания кнопки:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Button {...args} />
      </div>
    </div>
  ),
};

export const PropStartAndEndIcons: Story = {
  name: 'Пропсы: startIcon и endIcon (Иконки слева и справа)',
  args: {
    variant: 'primary',
    startIcon: <Icon icon={Sparkles} size="sm" />,
    endIcon: <Icon icon={ArrowRight} size="sm" />,
    children: 'Запустить AI-адаптацию',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `startIcon` и `endIcon` размещают иконки `<Icon />` из `lucide-react` до и после текста кнопки.',
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
          Выберите иконки в полях startIcon и endIcon на панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button {...args} />
        </div>
      </div>
    </div>
  ),
};
