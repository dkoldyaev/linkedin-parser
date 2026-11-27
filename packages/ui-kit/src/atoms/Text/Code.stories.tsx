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
          'Атомарный компонент строчного кода (`<code>`) в моноширинном техническом стиле Blueprint (`JetBrains Mono`).',
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
      description: 'Фрагмент программного кода, название токена или команды внутри тега `<code>`.',
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
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story: 'Базовая интерактивная демонстрация компонента `Code` со всеми контролами.',
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
  name: 'Пропс: children (Контрол: только children)',
  args: {
    children: 'pnpm --filter @blueprint/ui-kit storybook',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `children`. В панели Controls оставлен **только один контрол** — `children`.',
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
          Введите команду или идентификатор токена в контрол children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Code>{args.children}</Code>
        </div>
      </div>
    </div>
  ),
};
