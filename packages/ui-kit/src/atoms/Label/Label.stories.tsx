import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

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
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Label`. Настраивайте `children`, `tone`, `required` и `disabled` через панель Controls.',
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
  name: 'Пропс: required (Маркер обязательного поля)',
  args: {
    required: true,
    children: 'TARGET SALARY RANGE',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `required` добавляет справа от текста звездочку `*` с тоном `danger` и `aria-hidden="true"`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: required (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг required в Controls, чтобы увидеть появление маркера обязательного поля:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          <Label {...args} />
          <Label required={false}>OPTIONAL FIELD (required=false)</Label>
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический цвет подписи)',
  args: {
    tone: 'accent',
    children: 'ACCENT FIELD LABEL',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `tone` управляет цветом текста подписи.',
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
          Выберите tone в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Label {...args} />
        <div className={layoutStyles.row}>
          <Label tone="primary">primary</Label>
          <Label tone="secondary">secondary</Label>
          <Label tone="accent">accent</Label>
          <Label tone="success">success</Label>
          <Label tone="warning">warning</Label>
          <Label tone="danger">danger</Label>
        </div>
      </div>
    </div>
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Неактивное состояние)',
  args: {
    disabled: true,
    children: 'LOCKED CONFIGURATION FIELD',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `disabled` визуально приглушает подпись неактивного контрола.',
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
          Переключите disabled в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Label {...args} />
      </div>
    </div>
  ),
};
