import { Blockquote, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

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

const meta: Meta<typeof Blockquote> = {
  title: 'Atoms/Text/Blockquote',
  component: Blockquote,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент цитаты (`<blockquote>`) для выделения архитектурных принципов, важных примечаний и цитат с поддержкой семантического цветового акцента (`tone`) и подписи автора (`author`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    tone: 'accent',
    author: 'Blueprint Design System Manual',
    children:
      'Каждый компонент дизайн-системы строится на основе 32px сетки и композиции базовых атомарных примитивов без дублирования разметки.',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ALL_TONES,
      description: 'Семантический цветовой тон вертикальной линии-маркера и оформления блока цитаты.',
    },
    author: {
      control: 'text',
      description: 'Имя автора или источник цитаты, отображаемый в теге `<cite>` под текстом.',
    },
    children: {
      control: 'text',
      description: 'Основное текстовое или React-содержимое цитаты.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс для кастомизации контейнера цитаты.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Blockquote>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Blockquote` со всеми контролами (`tone`, `author`, `children`, `className`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Blockquote — Цитата / Архитектурная врезка
        </Text>
        <Text variant="caption" tone="secondary">
          Семантический элемент &lt;blockquote&gt; с боковым индикатором тона и опциональной
          подписью источника (&lt;cite&gt;).
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Blockquote {...args} />
      </div>
    </div>
  ),
};

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все тона (Контрол: только children)',
  args: {
    children: 'Архитектурное правило композиции атомарных примитивов.',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все основные варианты `tone` (`primary`, `accent`, `success`, `warning`, `danger`) одновременно. В панели Controls доступен **только один контрол** `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Все варианты тонов (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените текст цитаты в контроле children, чтобы сравнить цветовые маркеры всех тонов:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {(['primary', 'accent', 'success', 'warning', 'danger'] as const).map((t) => (
            <Blockquote key={t} tone={t} author={`tone="${t}"`}>
              {args.children}
            </Blockquote>
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
    children: 'Цитата с индивидуально настраиваемым семантическим тоном.',
  },
  parameters: {
    controls: {
      include: ['tone', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночный блок цитаты с двумя контролами: `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Одиночная цитата (Controls: только tone и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте tone (&quot;{args.tone}&quot;) и содержимое children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Blockquote tone={args.tone}>{args.children}</Blockquote>
      </div>
    </div>
  ),
};

export const PropAuthor: Story = {
  name: 'Пропс: author (Контролы: author, children)',
  args: {
    author: 'System Architect — ADR-004',
    children: 'Никаких неявных фоллбэков конфигурации в рантайм-коде.',
  },
  parameters: {
    controls: {
      include: ['author', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `author`. В панели Controls доступны только `author` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: author (Controls: только author и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Отредактируйте или очистите поле author в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Blockquote tone="accent" author={args.author}>
          {args.children}
        </Blockquote>
      </div>
    </div>
  ),
};
