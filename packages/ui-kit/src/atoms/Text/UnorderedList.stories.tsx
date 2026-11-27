import { ListItem, Text, UnorderedList } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof UnorderedList> = {
  title: 'Atoms/Text/UnorderedList',
  component: UnorderedList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Семантический атомарный компонент маркированного списка (`<ul>`). Отображает неупорядоченные перечни характеристик, навыков или рекомендаций.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    spacing: 'normal',
  },
  argTypes: {
    spacing: {
      control: 'inline-radio',
      options: ['compact', 'normal', 'relaxed'],
      description: 'Плотность вертикальных отступов между пунктами маркированного списка.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс тега `<ul>`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof UnorderedList>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `UnorderedList`. Настройте вертикальный интервал (`spacing`) через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          UnorderedList — Маркированный список (&lt;ul&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Семантический список &lt;ul&gt; с поддержкой стандартных маркеров и кастомных иконок в
          дочерних &lt;ListItem&gt;.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <UnorderedList {...args}>
          <ListItem>Опыт проектирования дизайн-систем на React 19 и TypeScript</ListItem>
          <ListItem>Автоматизация тестирования компонентов через Storybook и Vitest</ListItem>
          <ListItem>Соблюдение стандартов доступности WCAG 2.1 AA</ListItem>
        </UnorderedList>
      </div>
    </div>
  ),
};

export const PropSpacing: Story = {
  name: 'Пропс: spacing (Плотность строк)',
  args: {
    spacing: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `spacing` задает расстояние между пунктами маркированного списка (`compact`, `normal`, `relaxed`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: spacing (&quot;compact&quot; | &quot;normal&quot; | &quot;relaxed&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените значение spacing в Controls для проверки плотности пунктов:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <UnorderedList {...args}>
          <ListItem>Первый элемент маркированного списка (spacing=&quot;{args.spacing}&quot;)</ListItem>
          <ListItem>Второй элемент маркированного списка</ListItem>
          <ListItem>Третий элемент маркированного списка</ListItem>
        </UnorderedList>
      </div>
    </div>
  ),
};
