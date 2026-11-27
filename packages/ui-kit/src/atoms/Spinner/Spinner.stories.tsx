import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Spinner } from './Spinner';
import { Text } from '../Text';

const ALL_SIZES = ['xs', 'sm', 'md', 'lg'] as const;

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный индикатор загрузки `Spinner` с поддержкой скринридеров (`role="status"`, `aria-live="polite"` и скрытым текстом `label`).',
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
      options: ALL_SIZES,
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
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story: 'Базовая интерактивная демонстрация `Spinner` со всеми контролами (`size`, `label`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Spinner — Индикатор асинхронной загрузки (Все контролы)
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

export const PropSizeAll: Story = {
  name: 'Пропс: size — Все размеры xs–lg (Без лишних контролов)',
  parameters: {
    controls: {
      include: [],
    },
    docs: {
      description: {
        story: 'Визуальное сравнение всех 4 размеров `size` (`xs`, `sm`, `md`, `lg`) в одном ряду.',
      },
    },
  },
  render: () => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Все размеры (xs, sm, md, lg)
        </Text>
        <Text variant="caption" tone="secondary">
          Витрина всех размеров индикатора загрузки:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_SIZES.map((sz) => (
            <div key={sz} className={layoutStyles.box}>
              <Text variant="mono" size="2xs" tone="muted">
                size=&quot;{sz}&quot;
              </Text>
              <Spinner size={sz} label={`Loading ${sz}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropSizeSingle: Story = {
  name: 'Пропс: size — Выбор размера (Контрол: только size)',
  args: {
    size: 'lg',
  },
  parameters: {
    controls: {
      include: ['size'],
    },
    docs: {
      description: {
        story:
          'Одиночный спиннер с **одним контролом** `size` (`xs`, `sm`, `md`, `lg`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Одиночный спиннер (Controls: только size)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size (&quot;{args.size}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Spinner size={args.size} />
        </div>
      </div>
    </div>
  ),
};

export const PropLabel: Story = {
  name: 'Пропс: label (Контрол: только label)',
  args: {
    label: 'Синхронизация очереди задач Mercure SSE...',
  },
  parameters: {
    controls: {
      include: ['label'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `label` для скринридера. В панели Controls доступен **только один контрол** — `label`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: label (Controls: только label)
        </Text>
        <Text variant="caption" tone="secondary">
          Скрытый текст статуса (.srOnly) для скринридеров: &quot;{args.label}&quot;
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Spinner size="md" label={args.label} />
        </div>
      </div>
    </div>
  ),
};
