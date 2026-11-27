import { Code, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Code> = {
  title: 'Atoms/Text/Code',
  component: Code,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент строчного кода (`<code>`) в моноширинном техническом стиле Blueprint (`JetBrains Mono`). Используется для отображения имен CSS-переменных, сигнатур функций, путей к файлам и команд терминала.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    children: 'var(--ui-grid-cell, 32px)',
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Фрагмент программного кода, название токена или команды, отображаемый внутри тега `<code>`.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс для стилизации элемента `<code>`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Code>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация компонента `Code`. Настройте содержимое кода через пропс `children` в панели Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Code — Строчный фрагмент кода (&lt;code&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Выделяет технические идентификаторы, CSS-токены и выражения моноширинным шрифтом с
          контурной рамкой.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Code {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Код / Выражение)',
  args: {
    children: 'pnpm --filter @blueprint/ui-kit storybook',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `children` задает текст или выражение внутри `<code>`. Поддерживает встраивание внутрь обычного текста `<Text>` или `<Paragraph>`.',
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
          Отвечает за отображаемый фрагмент кода. Ниже показан интерактивный образец и примеры
          использования в контексте документации:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Code {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Code>--ui-bg-main</Code>
          <Code>--ui-primary</Code>
          <Code>useBlueprintGrid()</Code>
          <Code>&lt;OverlayProvider&gt;</Code>
        </div>
      </div>
    </div>
  ),
};

export const PropClassName: Story = {
  name: 'Пропс: className (Пользовательский класс)',
  args: {
    children: 'const GRID_CELL_PX = 32;',
    className: layoutStyles.box,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `className` позволяет передать дополнительный CSS-класс для расширения оформления тега `<code>`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: className
        </Text>
        <Text variant="caption" tone="secondary">
          Позволяет добавить внешние классы контейнеру &lt;code&gt; без потери базовых стилей
          дизайн-системы.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Code {...args} />
        </div>
      </div>
    </div>
  ),
};
