import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

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

const meta: Meta<typeof Label> = {
  title: 'Atoms/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент подписи поля формы `Label` (`<label>`) в техническом моноширинном стиле Blueprint. Композирует `<Text variant="mono-label">` и автоматически добавляет красный индикатор `*` при `required={true}`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    children: 'COLUMN TITLE',
    tone: 'secondary',
    required: false,
    disabled: false,
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ALL_TONES,
      description: 'Семантический цветовой тон текста подписи.',
    },
    required: {
      control: 'boolean',
      description: 'Отображает маркер обязательного поля `*` цветом `danger`.',
    },
    disabled: {
      control: 'boolean',
      description: 'Приглушает подпись, когда связанное поле ввода заблокировано.',
    },
    htmlFor: {
      control: 'text',
      description: 'ID связанного элемента формы (`for` / `htmlFor`).',
    },
    children: {
      control: 'text',
      description: 'Текст подписи поля.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Label` со всеми контролами (`children`, `tone`, `required`, `disabled`, `htmlFor`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Label — Подпись поля формы (&lt;label&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Используется самостоятельно или внутри молекулы &lt;FormField&gt;.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Label {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropRequired: Story = {
  name: 'Пропс: required (Контролы: required, children)',
  args: {
    required: true,
    children: 'TARGET SALARY RANGE',
  },
  parameters: {
    controls: {
      include: ['required', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `required`. В панели Controls доступны только `required` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: required (Controls: только required и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг required ({String(args.required)}) в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Label required={args.required}>{args.children}</Label>
      </div>
    </div>
  ),
};

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все цвета (Контрол: только children)',
  args: {
    children: 'FIELD_LABEL',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все семантические тона `tone` одновременно с единственным контролом `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Все тона (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените текст подписи в контроле children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_TONES.map((t) => (
            <Label key={t} tone={t}>
              {args.children} ({t})
            </Label>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropToneSingle: Story = {
  name: 'Пропс: tone — Выбор тона (Контролы: tone, children)',
  args: {
    tone: 'accent',
    children: 'ACCENT FIELD LABEL',
  },
  parameters: {
    controls: {
      include: ['tone', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночная подпись с двумя контролами: `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Одиночная подпись (Controls: только tone и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите tone (&quot;{args.tone}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Label tone={args.tone}>{args.children}</Label>
      </div>
    </div>
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Контролы: disabled, children)',
  args: {
    disabled: true,
    children: 'LOCKED CONFIGURATION FIELD',
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
          Переключите disabled ({String(args.disabled)}) в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Label disabled={args.disabled}>{args.children}</Label>
      </div>
    </div>
  ),
};
