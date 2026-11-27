import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { StatusDot } from './StatusDot';
import { Text } from '../Text';

const ALL_SIZES = ['xs', 'sm', 'md', 'lg'] as const;
const ALL_TONES = [
  'neutral',
  'primary',
  'secondary',
  'muted',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
] as const;

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
      options: ALL_TONES,
      description: 'Семантический цветовой тон индикатора.',
    },
    size: {
      control: 'inline-radio',
      options: ALL_SIZES,
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
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `StatusDot` со всеми контролами (`tone`, `size`, `pulse`, `glow`, `label`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          StatusDot — Точечный индикатор состояния (Все контролы)
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

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все цвета (Контролы: pulse, glow)',
  args: {
    pulse: false,
    glow: false,
  },
  parameters: {
    controls: {
      include: ['pulse', 'glow'],
    },
    docs: {
      description: {
        story:
          'Показывает все 9 семантических тонов `tone` одновременно. В панели Controls доступны только `pulse` и `glow` для проверки эффектов на всей палитре.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Все семантические тона (Controls: только pulse и glow)
        </Text>
        <Text variant="caption" tone="secondary">
          Включите pulse или glow в Controls, чтобы сравнить все 9 цветов:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_TONES.map((t) => (
            <div key={t} className={layoutStyles.box}>
              <Text variant="mono" size="2xs" tone="muted">
                {t}
              </Text>
              <StatusDot tone={t} size="lg" pulse={args.pulse} glow={args.glow} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropToneSingle: Story = {
  name: 'Пропс: tone — Выбор тона (Контрол: только tone)',
  args: {
    tone: 'accent',
  },
  parameters: {
    controls: {
      include: ['tone'],
    },
    docs: {
      description: {
        story: 'Одиночный индикатор с **одним контролом** `tone`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Одиночная точка (Controls: только tone)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите tone (&quot;{args.tone}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <StatusDot tone={args.tone} size="lg" />
        </div>
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Контрол: только size)',
  args: {
    size: 'md',
  },
  parameters: {
    controls: {
      include: ['size'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `size` (`xs`, `sm`, `md`, `lg`) с единственным контролом `size`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size (Controls: только size)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size (&quot;{args.size}&quot;) для активной точки и сравните со шкалой ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <StatusDot size={args.size} tone="accent" />
        </div>
        <div className={layoutStyles.row}>
          {ALL_SIZES.map((sz) => (
            <StatusDot key={sz} size={sz} tone="primary" />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropPulseAndGlow: Story = {
  name: 'Пропсы: pulse и glow (Контролы: pulse, glow)',
  args: {
    pulse: true,
    glow: true,
  },
  parameters: {
    controls: {
      include: ['pulse', 'glow'],
    },
    docs: {
      description: {
        story:
          'Демонстрация визуальных эффектов `pulse` и `glow`. В панели Controls оставлены только эти два переключателя.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: pulse &amp; glow (Controls: только pulse и glow)
        </Text>
        <Text variant="caption" tone="secondary">
          pulse={String(args.pulse)} | glow={String(args.glow)}:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <StatusDot tone="success" size="lg" pulse={args.pulse} glow={args.glow} />
          <StatusDot tone="info" size="lg" pulse={args.pulse} glow={args.glow} />
          <StatusDot tone="danger" size="lg" pulse={args.pulse} glow={args.glow} />
        </div>
      </div>
    </div>
  ),
};
