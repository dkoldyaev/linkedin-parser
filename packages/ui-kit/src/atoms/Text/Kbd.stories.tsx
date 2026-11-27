import { Kbd, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Kbd> = {
  title: 'Atoms/Text/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент клавиатурного сочетания (`<kbd>`). Отображает клавиши и горячие клавиши (`Ctrl + K`, `Esc`, `Enter`) с рельефным контуром в стиле Blueprint.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    children: 'Ctrl + K',
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Название клавиши или комбинации клавиш внутри тега `<kbd>`.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс элемента `<kbd>`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story: 'Базовая интерактивная демонстрация компонента `Kbd` со всеми контролами.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Kbd — Клавиатурная клавиша / Шорткат (&lt;kbd&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Семантический элемент &lt;kbd&gt; для визуализации горячих клавиш и навигационных подсказок.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Kbd {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Контрол: только children)',
  args: {
    children: '⌘ + Shift + P',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `children`. В панели Controls доступен **только один контрол** — `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: children (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Задайте обозначение клавиши или шортката в контроле children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Kbd>{args.children}</Kbd>
        </div>
      </div>
    </div>
  ),
};
