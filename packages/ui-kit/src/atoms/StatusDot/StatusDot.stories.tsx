import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { StatusDot } from './StatusDot';
import { Text } from '../Text';

const meta: Meta<typeof StatusDot> = {
  title: 'Atoms/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный точечный индикатор `StatusDot` для отображения статуса соединения (Mercure SSE), цветовых маркеров колонок Канбан-доски, таймлайна `StepperItem` и индикаторов активности. Поддерживает семантические тона (`tone`), размеры (`xs`, `sm`, `md`, `lg`), пульсацию (`pulse`) и свечение (`glow`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    tone: 'success',
    size: 'md',
    pulse: false,
    glow: false,
    label: 'Worker node online',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'secondary',
        'muted',
        'accent',
        'success',
        'warning',
        'danger',
        'info',
      ],
      description: 'Семантический цветовой тон индикатора.',
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Размер точки-индикатора (`xs`, `sm`, `md`, `lg`).',
    },
    pulse: {
      control: 'boolean',
      description: 'Включает анимацию пульсации для активных/живых процессов.',
    },
    glow: {
      control: 'boolean',
      description: 'Добавляет неоновое свечение вокруг точки в цвет выбранного тона.',
    },
    label: {
      control: 'text',
      description:
        'Доступная подпись (`aria-label`). При наличии `label` элемент получает `role="status"`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusDot>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `StatusDot`. Настраивайте `tone`, `size`, `pulse`, `glow` и `label` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          StatusDot — Точечный индикатор состояния
        </Text>
        <Text variant="caption" tone="secondary">
          Используется в заголовках колонок, кнопках выбора цвета, таймлайнах и мета-строках.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <StatusDot {...args} />
          <Text variant="mono" size="xs" tone="secondary">
            tone=&quot;{args.tone}&quot; | size=&quot;{args.size}&quot;
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический цвет точки)',
  args: {
    tone: 'accent',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` задает цвет точки из семантической палитры (`neutral`, `primary`, `secondary`, `muted`, `accent`, `success`, `warning`, `danger`, `info`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите tone в панели Controls и сравните со всей палитрой:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <StatusDot {...args} />
        </div>
        <div className={layoutStyles.row}>
          <StatusDot tone="neutral" size="lg" label="neutral" />
          <StatusDot tone="primary" size="lg" label="primary" />
          <StatusDot tone="secondary" size="lg" label="secondary" />
          <StatusDot tone="muted" size="lg" label="muted" />
          <StatusDot tone="accent" size="lg" label="accent" />
          <StatusDot tone="success" size="lg" label="success" />
          <StatusDot tone="warning" size="lg" label="warning" />
          <StatusDot tone="danger" size="lg" label="danger" />
          <StatusDot tone="info" size="lg" label="info" />
        </div>
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Размер точки xs–lg)',
  args: {
    size: 'md',
    tone: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `size` регулирует диаметр индикатора (`xs`, `sm`, `md`, `lg`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size (&quot;xs&quot; | &quot;sm&quot; | &quot;md&quot; | &quot;lg&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <StatusDot {...args} />
        </div>
        <div className={layoutStyles.row}>
          <StatusDot size="xs" tone="primary" />
          <StatusDot size="sm" tone="primary" />
          <StatusDot size="md" tone="primary" />
          <StatusDot size="lg" tone="primary" />
        </div>
      </div>
    </div>
  ),
};

export const PropPulseAndGlow: Story = {
  name: 'Пропсы: pulse и glow (Пульсация и свечение)',
  args: {
    tone: 'success',
    size: 'lg',
    pulse: true,
    glow: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `pulse` запускает анимацию пульсации для индикации активного процесса реального времени, а `glow` добавляет внешнее свечение.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: pulse &amp; glow (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаги pulse и glow в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <StatusDot {...args} />
          <StatusDot tone="info" size="md" glow />
          <StatusDot tone="warning" size="md" pulse />
          <StatusDot tone="danger" size="md" pulse glow />
        </div>
      </div>
    </div>
  ),
};
