import { CheckCircle2, Sparkles } from 'lucide-react';
import { List, ListItem, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof List> = {
  title: 'Atoms/Text/List',
  component: List,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Универсальный атомарный компонент списка (`<ul>` или `<ol>`). Поддерживает переключение между маркированным и нумерованным списком (`ordered`), настройку плотности вертикальных отступов (`spacing`) и кастомные иконки в элементах `<ListItem>`.',
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
        'Если `true`, рендерит нумерованный список (`<ol>` / `<OrderedList>`). Если `false` — маркированный список (`<ul>` / `<UnorderedList>`).',
    },
    spacing: {
      control: 'inline-radio',
      options: ['compact', 'normal', 'relaxed'],
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
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация компонента `List`. Позволяет переключать тип списка (`ordered`) и плотность строк (`spacing`) в панели Controls.',
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
  name: 'Пропс: ordered (Маркированный / Нумерованный)',
  args: {
    ordered: true,
    spacing: 'normal',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `ordered` переключает рендеринг между `<ul>` (маркированный список) и `<ol>` (нумерованный список).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: ordered (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг ordered в Controls для смены тега &lt;ol&gt; / &lt;ul&gt;:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <List {...args}>
          <ListItem>Первый шаг архитектурной проверки</ListItem>
          <ListItem>Второй шаг верификации токенов</ListItem>
          <ListItem>Третий шаг сборки Storybook</ListItem>
        </List>
      </div>
    </div>
  ),
};

export const PropSpacing: Story = {
  name: 'Пропс: spacing (Плотность элементов)',
  args: {
    spacing: 'relaxed',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `spacing` управляет вертикальным расстоянием между элементами списка (`compact`, `normal`, `relaxed`).',
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
          Настраивает интервал между пунктами списка. Измените spacing в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <List {...args}>
          <ListItem icon={<Icon icon={CheckCircle2} size="sm" tone="success" />}>
            Пункт списка с выбранным режимом spacing=&quot;{args.spacing}&quot;
          </ListItem>
          <ListItem icon={<Icon icon={CheckCircle2} size="sm" tone="success" />}>
            Второй пункт для визуальной оценки межстрочного интервала
          </ListItem>
          <ListItem icon={<Icon icon={Sparkles} size="sm" tone="accent" />}>
            Третий пункт списка с кастомной иконкой
          </ListItem>
        </List>
      </div>
    </div>
  ),
};
