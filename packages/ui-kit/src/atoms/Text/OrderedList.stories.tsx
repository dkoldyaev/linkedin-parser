import { ListItem, OrderedList, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof OrderedList> = {
  title: 'Atoms/Text/OrderedList',
  component: OrderedList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Семантический атомарный компонент нумерованного списка (`<ol>`). Используется для отображения упорядоченных последовательностей шагов и инструкций.',
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
      description: 'Плотность вертикальных интервалов между элементами нумерованного списка.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс тега `<ol>`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrderedList>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story: 'Базовая интерактивная демонстрация `OrderedList` со всеми контролами.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          OrderedList — Нумерованный список (&lt;ol&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Автоматически нумерует дочерние элементы &lt;ListItem&gt; с типографикой Blueprint.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <OrderedList {...args}>
          <ListItem>Инициализировать контекст OverlayProvider</ListItem>
          <ListItem>Подключить CSS-переменные tokens.css</ListItem>
          <ListItem>Собрать экран из атомов, молекул и организмов</ListItem>
        </OrderedList>
      </div>
    </div>
  ),
};

export const PropSpacing: Story = {
  name: 'Пропс: spacing (Контрол: только spacing)',
  args: {
    spacing: 'relaxed',
  },
  parameters: {
    controls: {
      include: ['spacing'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `spacing`. В панели Controls доступен **только один контрол** — `spacing` (`compact`, `normal`, `relaxed`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: spacing (Controls: только spacing)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте spacing (&quot;{args.spacing}&quot;) в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <OrderedList spacing={args.spacing}>
          <ListItem>Шаг 1 (spacing=&quot;{args.spacing}&quot;)</ListItem>
          <ListItem>Шаг 2 — Проверка контрастности и сетки</ListItem>
          <ListItem>Шаг 3 — Публикация документации</ListItem>
        </OrderedList>
      </div>
    </div>
  ),
};
