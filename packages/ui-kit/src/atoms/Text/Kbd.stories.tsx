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
          'Атомарный компонент клавиатурного сочетания (`<kbd>`). Отображает клавиши и горячие клавиши (`Ctrl + K`, `Esc`, `Enter`) с характерным рельефным контуром в стиле Blueprint.',
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
      description: 'Название клавиши или комбинации клавиш, отображаемое внутри тега `<kbd>`.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс для кастомизации элемента `<kbd>`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация компонента `Kbd`. Позволяет настроить текст клавиши через панель Controls.',
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
  name: 'Пропс: children (Обозначение клавиши)',
  args: {
    children: '⌘ + Shift + P',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `children` задает текст клавиши или комбинации клавиш. Может использоваться как для одиночных клавиш, так и для составных сочетаний.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: children
        </Text>
        <Text variant="caption" tone="secondary">
          Определяет надпись на клавише. Измените children в Controls для проверки:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Kbd {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Kbd>Esc</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Tab</Kbd>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <Kbd>Ctrl + /</Kbd>
        </div>
      </div>
    </div>
  ),
};
