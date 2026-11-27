import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Atoms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарное многострочное текстовое поле `Textarea` (`<textarea>`), выровненное по 32px сетке Blueprint. Предназначено для редактирования описаний вакансий, личных заметок, комментариев к этапам и системных промптов LLM. Поддерживает моноширинный режим `mono` и индикацию ошибки валидации `invalid`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    invalid: false,
    mono: false,
    disabled: false,
    rows: 4,
    placeholder: 'Вставьте описание вакансии или инструкции для адаптации CV...',
    defaultValue:
      'Разработка и поддержка корпоративной дизайн-системы на базе React 19, TypeScript и Storybook 10.',
    'aria-label': 'Vacancy description textarea',
  },
  argTypes: {
    invalid: {
      control: 'boolean',
      description: 'Включает контур ошибки валидации (`--ui-danger`) и атрибут `aria-invalid="true"`.',
    },
    mono: {
      control: 'boolean',
      description: 'Переключает шрифт на моноширинный `JetBrains Mono` (для промптов, JSON и кода).',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует ввод и редактирование текста.',
    },
    rows: {
      control: { type: 'number', min: 2, max: 12, step: 1 },
      description: 'Количество видимых текстовых строк (`rows`).',
    },
    placeholder: {
      control: 'text',
      description: 'Текст-подсказка при пустом значении.',
    },
    defaultValue: {
      control: 'text',
      description: 'Начальное текстовое содержимое многострочного поля.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Textarea` со всеми контролами (`mono`, `invalid`, `disabled`, `rows`, `placeholder`, `defaultValue`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Textarea — Многострочное поле ввода текста (Все контролы)
        </Text>
        <Text variant="caption" tone="secondary">
          Используется для заметок, комментариев, оригинальных текстов вакансий и LLM-промптов.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Textarea {...args} />
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
        <Textarea
          mono={args.mono}
          defaultValue="SYSTEM_PROMPT: Highlight React 19, TypeScript, Design Tokens, and 32px Blueprint Grid experience."
          aria-label="Mono textarea"
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
          Переключите флаг invalid ({String(args.invalid)}) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Textarea
          invalid={args.invalid}
          defaultValue="Слишком короткое описание вакансии (минимум 50 символов)."
          aria-label="Invalid textarea"
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
          Переключите disabled ({String(args.disabled)}) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Textarea
          disabled={args.disabled}
          defaultValue="Архивный текст вакансии, недоступный для редактирования."
          aria-label="Disabled textarea"
        />
      </div>
    </div>
  ),
};

export const PropRows: Story = {
  name: 'Пропс: rows (Контрол: только rows)',
  args: {
    rows: 6,
  },
  parameters: {
    controls: {
      include: ['rows'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `rows` (начальная высота в строках). В панели Controls доступен **только один контрол** — `rows`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: rows (Controls: только rows)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените количество строк rows ({args.rows}) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Textarea
          rows={args.rows}
          defaultValue="Многострочное поле с настраиваемым количеством видимых строк."
          aria-label="Rows textarea"
        />
      </div>
    </div>
  ),
};
