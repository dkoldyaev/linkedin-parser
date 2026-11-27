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
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Textarea`. Настраивайте `mono`, `invalid`, `disabled`, `rows` и `placeholder` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Textarea — Многострочное поле ввода текста
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
  name: 'Пропс: mono (Моноширинный режим для промптов и JSON)',
  args: {
    mono: true,
    defaultValue:
      'SYSTEM_PROMPT: Highlight React 19, TypeScript, Design Tokens, and 32px Blueprint Grid experience.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `mono` включает моноширинный шрифт `JetBrains Mono` для редактирования технических инструкций, промптов и сырых данных.',
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
          Переключите флаг mono в Controls для смены шрифта между JetBrains Mono и Inter:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Textarea {...args} />
      </div>
    </div>
  ),
};

export const PropInvalid: Story = {
  name: 'Пропс: invalid (Ошибка валидации)',
  args: {
    invalid: true,
    defaultValue: 'Слишком короткое описание вакансии (минимум 50 символов).',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `invalid` подсвечивает рамку красным токеном `--ui-danger` и выставляет `aria-invalid="true"`.',
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
          Переключите флаг invalid в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Textarea {...args} />
      </div>
    </div>
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Заблокированное состояние)',
  args: {
    disabled: true,
    defaultValue: 'Архивный текст вакансии, недоступный для редактирования.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `disabled` блокирует редактирование многострочного поля.',
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
        <Textarea {...args} />
      </div>
    </div>
  ),
};
