import { DollarSign, Globe, Lock, Search, Sparkles } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../Icon';
import { Input } from './Input';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

const ADORNMENT_MAP = {
  none: undefined,
  Search: <Icon icon={Search} size="sm" tone="muted" />,
  Globe: <Icon icon={Globe} size="sm" tone="accent" />,
  DollarSign: <Icon icon={DollarSign} size="sm" tone="success" />,
  Lock: <Icon icon={Lock} size="sm" tone="warning" />,
  Sparkles: <Icon icon={Sparkles} size="sm" tone="accent" />,
} as const;

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарное текстовое поле ввода `Input`, выровненное по 32px сетке Blueprint. Поддерживает размеры `sm`, `md`, `lg`, моноширинный режим `mono` (для URL, токенов и чисел), состояние ошибки валидации `invalid` (`aria-invalid="true"`), а также слоты `startAdornment` и `endAdornment`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    size: 'md',
    invalid: false,
    mono: false,
    disabled: false,
    placeholder: 'Введите название этапа (например, Technical Interview)...',
    defaultValue: 'Staff Frontend Architect',
    'aria-label': 'Job title input',
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Размер поля ввода по вертикальной сетке (`sm` = 24px, `md` = 32px, `lg` = 40px).',
    },
    invalid: {
      control: 'boolean',
      description: 'Включает контур ошибки валидации (`--ui-danger`) и атрибут `aria-invalid="true"`.',
    },
    mono: {
      control: 'boolean',
      description: 'Переключает шрифт поля ввода на моноширинный `JetBrains Mono` (`--ui-font-mono`).',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует редактирование поля ввода.',
    },
    placeholder: {
      control: 'text',
      description: 'Текст-подсказка внутри пустого поля ввода.',
    },
    startAdornment: {
      control: 'select',
      options: Object.keys(ADORNMENT_MAP),
      mapping: ADORNMENT_MAP,
      description: 'Иконка или декоративный элемент в левой части поля ввода.',
    },
    endAdornment: {
      control: 'select',
      options: Object.keys(ADORNMENT_MAP),
      mapping: ADORNMENT_MAP,
      description: 'Иконка или элемент управления в правой части поля ввода.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Input`. Настраивайте `size`, `mono`, `invalid`, `disabled`, `startAdornment` и `endAdornment` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Input — Однострочное текстовое поле ввода
        </Text>
        <Text variant="caption" tone="secondary">
          Базовый контрол форм на 32px сетке с поддержкой иконок и состояния ошибки.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input {...args} />
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Размер поля sm / md / lg)',
  args: {
    size: 'md',
    defaultValue: 'Размер поля ввода на сетке Blueprint',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `size` определяет высоту поля ввода: `sm` (24px), `md` (32px — базовая ячейка сетки), `lg` (40px).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size (&quot;sm&quot; | &quot;md&quot; | &quot;lg&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size в Controls и сравните все три размера ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input {...args} />
        <div className={layoutStyles.stackSm}>
          <Input size="sm" defaultValue='size="sm" (24px)' aria-label="Small input" />
          <Input size="md" defaultValue='size="md" (32px — 1 Grid Cell)' aria-label="Medium input" />
          <Input size="lg" defaultValue='size="lg" (40px)' aria-label="Large input" />
        </div>
      </div>
    </div>
  ),
};

export const PropMono: Story = {
  name: 'Пропс: mono (Моноширинный технический шрифт)',
  args: {
    mono: true,
    defaultValue: 'https://www.linkedin.com/jobs/view/4091827361',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `mono` включает моноширинный шрифт `JetBrains Mono`, идеально подходящий для ввода URL, идентификаторов, зарплатных чисел и поисковых запросов.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: mono (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг mono в Controls для сравнения шрифтов JetBrains Mono и Inter:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input {...args} />
      </div>
    </div>
  ),
};

export const PropInvalid: Story = {
  name: 'Пропс: invalid (Состояние ошибки валидации)',
  args: {
    invalid: true,
    defaultValue: 'Некорректный формат URL вакансии',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `invalid` окрашивает рамку поля в семантический цвет `--ui-danger` и устанавливает `aria-invalid="true"`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: invalid (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите invalid в Controls для проверки визуальной индикации ошибки:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input {...args} />
      </div>
    </div>
  ),
};

export const PropStartAndEndAdornments: Story = {
  name: 'Пропсы: startAdornment и endAdornment (Встроенные иконки)',
  args: {
    mono: true,
    startAdornment: <Icon icon={Search} size="sm" tone="muted" />,
    endAdornment: <Icon icon={Sparkles} size="sm" tone="accent" />,
    defaultValue: 'React 19 Design Systems',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `startAdornment` и `endAdornment` оборачивают `<input>` в позиционированный контейнер и размещают иконки или кнопки внутри поля ввода слева и справа.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: startAdornment &amp; endAdornment
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконки для startAdornment и endAdornment в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input {...args} />
      </div>
    </div>
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Блокировка поля ввода)',
  args: {
    disabled: true,
    defaultValue: 'Системный идентификатор (только для чтения)',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `disabled` блокирует фокусировку и изменение текста в поле ввода.',
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
        <Input {...args} />
      </div>
    </div>
  ),
};
