import { DollarSign, Globe, Lock, Search, Sparkles } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../Icon';
import { Input } from './Input';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

const ALL_SIZES = ['sm', 'md', 'lg'] as const;

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
      options: ALL_SIZES,
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
    defaultValue: {
      control: 'text',
      description: 'Начальное текстовое значение поля ввода.',
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
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Input` со всеми контролами (`size`, `mono`, `invalid`, `disabled`, `placeholder`, `defaultValue`, `startAdornment`, `endAdornment`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Input — Однострочное текстовое поле ввода (Все контролы)
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

export const PropSizeAll: Story = {
  name: 'Пропс: size — Все размеры (Контрол: только placeholder)',
  args: {
    placeholder: 'Введите текст для сравнения размеров sm / md / lg...',
  },
  parameters: {
    controls: {
      include: ['placeholder'],
    },
    docs: {
      description: {
        story:
          'Показывает все размеры `size` (`sm`, `md`, `lg`) одновременно. В панели Controls доступен **только один контрол** — `placeholder`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Все размеры (Controls: только placeholder)
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение высоты полей sm (24px), md (32px) и lg (40px):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {ALL_SIZES.map((sz) => (
            <Input
              key={sz}
              size={sz}
              placeholder={`${sz.toUpperCase()}: ${args.placeholder}`}
              aria-label={`Input ${sz}`}
            />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropSizeSingle: Story = {
  name: 'Пропс: size — Выбор размера (Контролы: size, placeholder)',
  args: {
    size: 'md',
    placeholder: 'Поле ввода с настраиваемым размером...',
  },
  parameters: {
    controls: {
      include: ['size', 'placeholder'],
    },
    docs: {
      description: {
        story: 'Одиночное поле ввода с двумя контролами: `size` и `placeholder`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Одиночное поле (Controls: только size и placeholder)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size (&quot;{args.size}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input size={args.size} placeholder={args.placeholder} aria-label="Sized input" />
      </div>
    </div>
  ),
};

export const PropMono: Story = {
  name: 'Пропс: mono (Контрол: только mono)',
  args: {
    mono: true,
  },
  parameters: {
    controls: {
      include: ['mono'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `mono`. В панели Controls доступен **только один контрол** — `mono`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: mono (Controls: только mono)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг mono ({String(args.mono)}) для смены шрифта между JetBrains Mono и Inter:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input
          mono={args.mono}
          defaultValue="https://www.linkedin.com/jobs/view/4091827361"
          aria-label="Mono input"
        />
      </div>
    </div>
  ),
};

export const PropInvalid: Story = {
  name: 'Пропс: invalid (Контрол: только invalid)',
  args: {
    invalid: true,
  },
  parameters: {
    controls: {
      include: ['invalid'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `invalid`. В панели Controls доступен **только один контрол** — `invalid`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: invalid (Controls: только invalid)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг invalid ({String(args.invalid)}) для проверки контура ошибки:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input
          invalid={args.invalid}
          defaultValue="Некорректный формат URL вакансии"
          aria-label="Invalid input"
        />
      </div>
    </div>
  ),
};

export const PropStartAndEndAdornments: Story = {
  name: 'Пропсы: startAdornment и endAdornment (Контролы: startAdornment, endAdornment)',
  args: {
    startAdornment: <Icon icon={Search} size="sm" tone="muted" />,
    endAdornment: <Icon icon={Sparkles} size="sm" tone="accent" />,
  },
  parameters: {
    controls: {
      include: ['startAdornment', 'endAdornment'],
    },
    docs: {
      description: {
        story:
          'Демонстрация слотов `startAdornment` и `endAdornment`. В панели Controls доступны только эти два контрола.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: startAdornment &amp; endAdornment (Controls: только startAdornment и endAdornment)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконки для левого и правого слота поля ввода:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input
          mono
          startAdornment={args.startAdornment}
          endAdornment={args.endAdornment}
          defaultValue="React 19 Design Systems"
          aria-label="Adornment input"
        />
      </div>
    </div>
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Контрол: только disabled)',
  args: {
    disabled: true,
  },
  parameters: {
    controls: {
      include: ['disabled'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `disabled`. В панели Controls доступен **только один контрол** — `disabled`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: disabled (Controls: только disabled)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг disabled ({String(args.disabled)}) в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Input
          disabled={args.disabled}
          defaultValue="Системный идентификатор (только для чтения)"
          aria-label="Disabled input"
        />
      </div>
    </div>
  ),
};
