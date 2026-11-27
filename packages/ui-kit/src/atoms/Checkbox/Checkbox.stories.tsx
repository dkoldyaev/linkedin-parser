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
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Checkbox`. Настраивайте `label`, `checked` и `disabled` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Checkbox — Атомарный флаг выбора
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
  name: 'Пропс: label (Подпись чекбокса)',
  args: {
    label: 'Включить оценку зарплатной вилки через LLM',
    defaultChecked: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `label` добавляет кликабельную текстовую подпись справа от квадрата чекбокса. Если `label` не передан, рендерится компактный одиночный `<input type="checkbox">` (например для заголовка карточки `CardHeader`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: label
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение чекбокса с подписью (label) и компактного чекбокса без подписи:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Checkbox {...args} />
        <div className={layoutStyles.row}>
          <Checkbox aria-label="Standalone checkbox without label" defaultChecked />
          <Text variant="caption" tone="muted">
            (Чекбокс без пропса label — только квадрат управления)
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const PropChecked: Story = {
  name: 'Пропс: checked (Состояние отметки)',
  args: {
    checked: true,
    label: 'Контролируемый чекбокс (checked)',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `checked` управляет отмеченным/снятым состоянием чекбокса.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: checked (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаг checked в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Checkbox {...args} onChange={() => undefined} />
        <div className={layoutStyles.stackSm}>
          <Checkbox checked label="checked={true} — Отмечен" onChange={() => undefined} />
          <Checkbox checked={false} label="checked={false} — Снят" onChange={() => undefined} />
        </div>
      </div>
    </div>
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Неактивное состояние)',
  args: {
    disabled: true,
    defaultChecked: true,
    label: 'Заблокированная системная настройка (disabled)',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `disabled` переводит чекбокс и его подпись в заблокированное состояние.',
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
          Переключите флаг disabled в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Checkbox {...args} />
        <Checkbox disabled defaultChecked={false} label="Неактивный снятый чекбокс" />
      </div>
    </div>
  ),
};
