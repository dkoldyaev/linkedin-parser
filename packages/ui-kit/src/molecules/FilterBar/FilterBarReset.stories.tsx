import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterBarReset } from './FilterBarReset';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta<typeof FilterBarReset> = {
  title: 'Molecules/FilterBar/FilterBarReset',
  component: FilterBarReset,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент кнопки сброса фильтров `FilterBarReset` (`FilterBar.Reset`). Композирует `<Button variant="ghost" size="sm" tone="danger">` и иконку `RotateCcw` из `lucide-react`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    label: 'Сбросить фильтры',
    disabled: false,
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Текстовая подпись кнопки сброса фильтров.',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует нажатие кнопки сброса.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilterBarReset>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `FilterBarReset`. Настраивайте `label` и `disabled` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          FilterBarReset — Кнопка сброса активных фильтров
        </Text>
        <Text variant="caption" tone="secondary">
          Рендерится внутри &lt;FilterBar&gt; или самостоятельно в кастомных панелях фильтров.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <FilterBarReset {...args} onReset={() => undefined} />
        </div>
      </div>
    </div>
  ),
};

export const PropLabel: Story = {
  name: 'Пропс: label (Текст кнопки сброса)',
  args: {
    label: 'Очистить (3)',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `label` задает локализованную подпись кнопки сброса.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: label (string)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените label в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <FilterBarReset {...args} onReset={() => undefined} />
        </div>
      </div>
    </div>
  ),
};
