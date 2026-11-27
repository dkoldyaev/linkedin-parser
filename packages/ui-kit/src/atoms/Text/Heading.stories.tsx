import { Heading, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const ALL_LEVELS = [1, 2, 3, 4, 5, 6] as const;
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

const meta: Meta<typeof Heading> = {
  title: 'Atoms/Text/Heading',
  component: Heading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Семантический компонент заголовка (`<h1>`–`<h6>`), выровненный по типографической шкале Blueprint Design System.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    level: 2,
    tone: 'primary',
    children: 'Blueprint System Architecture Heading',
  },
  argTypes: {
    level: {
      control: 'inline-radio',
      options: ALL_LEVELS,
      description: 'Уровень HTML-заголовка (`1` -> `<h1>`, ..., `6` -> `<h6>`).',
    },
    tone: {
      control: 'select',
      options: ALL_TONES,
      description: 'Семантический цветовой тон текста заголовка.',
    },
    children: {
      control: 'text',
      description: 'Текст заголовка.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс заголовка.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story: 'Базовая интерактивная демонстрация `Heading` со всеми контролами (`level`, `tone`, `children`, `className`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Heading — Семантический заголовок (&lt;h1&gt;–&lt;h6&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Автоматически подбирает HTML-тег h1..h6 и соответствующий типографический токен размера.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Heading {...args} />
      </div>
    </div>
  ),
};

export const PropLevelAll: Story = {
  name: 'Пропс: level — Все уровни h1–h6 (Контрол: только children)',
  args: {
    children: 'Blueprint Architecture Heading Specimen',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все уровни заголовков `level={1..6}` одновременно. В панели Controls доступен **только один контрол** `children` для изменения текста во всех заголовках сразу.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: level — Все уровни H1–H6 (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените текст в контроле children для сравнения всей шкалы заголовков:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {ALL_LEVELS.map((lvl) => (
            <div key={lvl} className={layoutStyles.box}>
              <Text variant="mono" size="2xs" tone="accent">
                &lt;Heading level={'{'}
                {lvl}
                {'}'}&gt; (&lt;h{lvl}&gt;)
              </Text>
              <Heading level={lvl}>{args.children}</Heading>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropLevelSingle: Story = {
  name: 'Пропс: level — Выбор уровня (Контролы: level, children)',
  args: {
    level: 2,
    children: 'Интерактивный заголовок выбранного уровня',
  },
  parameters: {
    controls: {
      include: ['level', 'children'],
    },
    docs: {
      description: {
        story:
          'Одиночный заголовок с **двумя контролами**: `level` (переключение `1`..`6`) и `children` (содержимое).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: level — Одиночный заголовок (Controls: только level и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте level (сейчас &lt;h{args.level}&gt;) и текст children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Heading level={args.level}>{args.children}</Heading>
        </div>
      </div>
    </div>
  ),
};

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все цвета (Контрол: только children)',
  args: {
    children: 'Заголовок с семантическим цветовым тоном',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все семантические тона `tone` для заголовка. В панели Controls доступен только `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Все тона (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение всех цветовых тонов заголовка при едином тексте children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {ALL_TONES.map((t) => (
            <Heading key={t} level={4} tone={t}>
              tone=&quot;{t}&quot; — {args.children}
            </Heading>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropToneSingle: Story = {
  name: 'Пропс: tone — Выбор тона (Контролы: tone, children)',
  args: {
    tone: 'accent',
    children: 'Акцентный заголовок раздела',
  },
  parameters: {
    controls: {
      include: ['tone', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночный заголовок с двумя контролами: `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Одиночный заголовок (Controls: только tone и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите tone (&quot;{args.tone}&quot;) и текст заголовка:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Heading level={3} tone={args.tone}>
            {args.children}
          </Heading>
        </div>
      </div>
    </div>
  ),
};
