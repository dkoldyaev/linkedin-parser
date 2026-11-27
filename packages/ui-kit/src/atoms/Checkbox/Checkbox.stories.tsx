import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

const meta: Meta<typeof Checkbox> = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент флага выбора `Checkbox` (`<input type="checkbox">`), стилизованный под 32px сетку Blueprint. При передаче пропса `label` автоматически оборачивается в `<label>` и рендерит подпись через атом `<Text>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    label: 'Автоматически адаптировать CV при импорте вакансии',
    defaultChecked: true,
    disabled: false,
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Текстовая подпись рядом с чекбоксом, связанная через родительский `<label>`.',
    },
    checked: {
      control: 'boolean',
      description: 'Контролируемое состояние отметки чекбокса (`true` / `false`).',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Начальное состояние отметки в неконтролируемом режиме.',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует взаимодействие с чекбоксом и приглушает подпись.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс для элемента `<input type="checkbox">`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Checkbox` со всеми контролами (`label`, `checked`, `defaultChecked`, `disabled`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Checkbox — Атомарный флаг выбора (Все контролы)
        </Text>
        <Text variant="caption" tone="secondary">
          Кликните по чекбоксу или используйте Controls для управления состоянием.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Checkbox {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropLabel: Story = {
  name: 'Пропс: label (Контрол: только label)',
  args: {
    label: 'Включить оценку зарплатной вилки через LLM',
  },
  parameters: {
    controls: {
      include: ['label'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `label`. В панели Controls доступен **только один контрол** — `label`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: label (Controls: только label)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените или очистите поле label в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Checkbox label={args.label} defaultChecked />
      </div>
    </div>
  ),
};

export const PropChecked: Story = {
  name: 'Пропс: checked (Контрол: только checked)',
  args: {
    checked: true,
  },
  parameters: {
    controls: {
      include: ['checked'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `checked`. В панели Controls доступен **только один контрол** — `checked`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: checked (Controls: только checked)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаг checked ({String(args.checked)}) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Checkbox
          checked={args.checked}
          label={`Контролируемый чекбокс (checked=${String(args.checked)})`}
          onChange={() => undefined}
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
          Переключите флаг disabled ({String(args.disabled)}) для отмеченного и снятого чекбокса:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Checkbox disabled={args.disabled} defaultChecked label="Отмеченный чекбокс" />
        <Checkbox disabled={args.disabled} defaultChecked={false} label="Снятый чекбокс" />
      </div>
    </div>
  ),
};
