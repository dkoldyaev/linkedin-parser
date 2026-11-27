import type { Meta, StoryObj } from '@storybook/react-vite';
import { Paragraph, Text } from './Text';
import layoutStyles from '../../stories/StoryLayout.module.css';

const ALL_SPACINGS = ['none', 'sm', 'md', 'lg'] as const;
const ALL_SIZES = ['sm', 'md'] as const;
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
const ALL_WEIGHTS = ['regular', 'medium', 'semibold', 'bold'] as const;

const meta: Meta<typeof Paragraph> = {
  title: 'Atoms/Text/Paragraph',
  component: Paragraph,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент текстового абзаца (`<p>`), настроенный для комфортного чтения многострочных описаний, AI-саммари и сопроводительной документации на сетке Blueprint.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    spacing: 'md',
    size: 'md',
    tone: 'primary',
    weight: 'regular',
    children:
      'Абзац основного текста в дизайн-системе Blueprint. Использует предсказуемый вертикальный ритм, токенизированные отступы и семантические цветовые тона.',
  },
  argTypes: {
    spacing: {
      control: 'inline-radio',
      options: ALL_SPACINGS,
      description: 'Нижний внешний отступ (`margin-bottom`) после абзаца.',
    },
    size: {
      control: 'inline-radio',
      options: ALL_SIZES,
      description: 'Размер текста абзаца (`sm` — компактный, `md` — стандартный).',
    },
    tone: {
      control: 'select',
      options: ALL_TONES,
      description: 'Семантический цветовой тон текста абзаца.',
    },
    weight: {
      control: 'inline-radio',
      options: ALL_WEIGHTS,
      description: 'Насыщенность шрифта (`font-weight`).',
    },
    children: {
      control: 'text',
      description: 'Текстовое содержимое абзаца.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Paragraph>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация компонента `Paragraph` со всеми контролами (`spacing`, `size`, `tone`, `weight`, `children`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Paragraph — Текстовый абзац (&lt;p&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Семантический тег &lt;p&gt; с управляемым нижним отступом, тоном и насыщенностью шрифта.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Paragraph {...args} />
      </div>
    </div>
  ),
};

export const PropSpacing: Story = {
  name: 'Пропс: spacing (Контролы: spacing, children)',
  args: {
    spacing: 'md',
    children: 'Первый абзац с настраиваемым нижним отступом до следующего элемента.',
  },
  parameters: {
    controls: {
      include: ['spacing', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `spacing` (`none`, `sm`, `md`, `lg`). В панели Controls доступны только `spacing` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: spacing (Controls: только spacing и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте spacing (&quot;{args.spacing}&quot;) для изменения отступа между первым и вторым
          абзацем:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Paragraph spacing={args.spacing}>{args.children}</Paragraph>
          <Paragraph spacing="none" tone="secondary">
            Опорный второй абзац (показывает нижнюю границу отступа первого абзаца).
          </Paragraph>
        </div>
      </div>
    </div>
  ),
};

export const PropSizeAll: Story = {
  name: 'Пропс: size — Все размеры (Контрол: только children)',
  args: {
    children: 'Пример текста абзаца для сравнения компактного (sm) и стандартного (md) размера.',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все варианты `size` (`sm`, `md`) одновременно с единственным контролом `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Все размеры (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените текст в контроле children для сравнения размеров sm и md:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        {ALL_SIZES.map((sz) => (
          <div key={sz} className={layoutStyles.box}>
            <Text variant="mono" size="2xs" tone="accent">
              size=&quot;{sz}&quot;
            </Text>
            <Paragraph size={sz} spacing="none">
              {args.children}
            </Paragraph>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const PropSizeSingle: Story = {
  name: 'Пропс: size — Выбор размера (Контролы: size, children)',
  args: {
    size: 'sm',
    children: 'Интерактивный абзац с настраиваемым размером шрифта.',
  },
  parameters: {
    controls: {
      include: ['size', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночный абзац с двумя контролами: `size` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Одиночный абзац (Controls: только size и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size (&quot;{args.size}&quot;) и редактируйте текст children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Paragraph size={args.size} spacing="none">
            {args.children}
          </Paragraph>
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Контролы: tone, children)',
  args: {
    tone: 'secondary',
    children: 'Абзац с выбранным семантическим цветовым тоном.',
  },
  parameters: {
    controls: {
      include: ['tone', 'children'],
    },
    docs: {
      description: {
        story: 'Демонстрация пропса `tone`. В панели Controls доступны только `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone (Controls: только tone и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите семантический тон (&quot;{args.tone}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Paragraph tone={args.tone} spacing="none">
            {args.children}
          </Paragraph>
        </div>
      </div>
    </div>
  ),
};

export const PropWeight: Story = {
  name: 'Пропс: weight (Контролы: weight, children)',
  args: {
    weight: 'semibold',
    children: 'Вводный абзац с повышенной насыщенностью шрифта.',
  },
  parameters: {
    controls: {
      include: ['weight', 'children'],
    },
    docs: {
      description: {
        story: 'Демонстрация пропса `weight`. В панели Controls доступны только `weight` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: weight (Controls: только weight и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте weight (&quot;{args.weight}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Paragraph weight={args.weight} spacing="none">
            {args.children}
          </Paragraph>
        </div>
      </div>
    </div>
  ),
};
