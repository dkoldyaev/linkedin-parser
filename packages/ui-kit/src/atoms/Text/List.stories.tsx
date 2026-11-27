import { List, ListItem, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const ALL_SPACINGS = ['compact', 'normal', 'relaxed'] as const;

const meta: Meta<typeof List> = {
  title: 'Atoms/Text/List',
  component: List,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Универсальный атомарный компонент списка (`<ul>` или `<ol>`). Поддерживает переключение между маркированным и нумерованным списком (`ordered`) и настройку плотности вертикальных отступов (`spacing`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    ordered: false,
    spacing: 'normal',
  },
  argTypes: {
    ordered: {
      control: 'boolean',
      description:
        'Если `true`, рендерит нумерованный список (`<ol>`). Если `false` — маркированный список (`<ul>`).',
    },
    spacing: {
      control: 'inline-radio',
      options: ALL_SPACINGS,
      description: 'Плотность вертикальных отступов между пунктами списка (`compact`, `normal`, `relaxed`).',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс контейнера списка.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof List>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация компонента `List` со всеми контролами (`ordered`, `spacing`, `className`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          List — Универсальный список (&lt;ul&gt; / &lt;ol&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Контейнер для структурированных перечней требований, рекомендаций и шагов алгоритма.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <List {...args}>
          <ListItem>Квантование размеров по 32px сетке Blueprint</ListItem>
          <ListItem>Строгая типизация и отсутствие сырых CSS-значений</ListItem>
          <ListItem>Полная поддержка темной и светлой темы</ListItem>
        </List>
      </div>
    </div>
  ),
};

export const PropOrdered: Story = {
  name: 'Пропс: ordered (Контрол: только ordered)',
  args: {
    ordered: true,
  },
  parameters: {
    controls: {
      include: ['ordered'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `ordered`. В панели Controls доступен **только один контрол** — `ordered` (`true` -> `<ol>`, `false` -> `<ul>`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: ordered (Controls: только ordered)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг ordered ({String(args.ordered)}) для смены &lt;ol&gt; / &lt;ul&gt;:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <List ordered={args.ordered}>
          <ListItem>Первый шаг архитектурной проверки</ListItem>
          <ListItem>Второй шаг верификации токенов</ListItem>
          <ListItem>Третий шаг сборки Storybook</ListItem>
        </List>
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
          Выберите плотность строк spacing (&quot;{args.spacing}&quot;) в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <List spacing={args.spacing}>
          <ListItem>Пункт 1 с режимом spacing=&quot;{args.spacing}&quot;</ListItem>
          <ListItem>Пункт 2 для оценки межстрочного интервала</ListItem>
          <ListItem>Пункт 3 списка</ListItem>
        </List>
      </div>
    </div>
  ),
};
