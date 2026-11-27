import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Spinner } from './Spinner';
import { Text } from '../Text';

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный индикатор загрузки `Spinner` с поддержкой скринридеров (`role="status"`, `aria-live="polite"` и скрытым текстом `label`). Используется внутри `<Button loading>`, `<Header>` (индикатор очереди) и `<DataTableLoading>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    size: 'md',
    label: 'Загрузка данных...',
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Размер индикатора вращения (`xs`, `sm`, `md`, `lg`).',
    },
    label: {
      control: 'text',
      description: 'Скрытая текстовая метка для скринридеров, объявляющая статус загрузки.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Spinner`. Настраивайте `size` и `label` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Spinner — Индикатор асинхронной загрузки
        </Text>
        <Text variant="caption" tone="secondary">
          Доступный спиннер с поддержкой aria-live=&quot;polite&quot; и четырех размеров.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Spinner {...args} />
          <Text variant="mono" size="xs" tone="secondary">
            {args.label}
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Размер индикатора xs–lg)',
  args: {
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `size` управляет диаметром кольца спиннера (`xs`, `sm`, `md`, `lg`).',
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
          Переключайте size в Controls и сравните все 4 размера рядом:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Spinner {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Spinner size="xs" label="XS Spinner" />
          <Spinner size="sm" label="SM Spinner" />
          <Spinner size="md" label="MD Spinner" />
          <Spinner size="lg" label="LG Spinner" />
        </div>
      </div>
    </div>
  ),
};

export const PropLabel: Story = {
  name: 'Пропс: label (Текст для скринридера)',
  args: {
    size: 'md',
    label: 'Синхронизация очереди задач Mercure SSE...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `label` задает текст внутри `.srOnly` спана, который озвучивается программами экранного доступа при появлении спиннера.',
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
          Скрытый текст статуса для скринридеров: &quot;{args.label}&quot;
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Spinner {...args} />
        </div>
      </div>
    </div>
  ),
};
