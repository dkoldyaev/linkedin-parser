import { Blockquote, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

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
      description:
        'Семантический цветовой тон вертикальной линии-маркера и оформления блока цитаты.',
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
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Blockquote`. Позволяет настроить текст цитаты (`children`), автора (`author`) и семантический тон (`tone`) через панель Controls.',
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

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический тон)',
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` управляет цветом боковой линии и акцентом цитаты. Доступны значения `primary`, `accent`, `success`, `warning`, `danger` и другие семантические тона.',
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
          Определяет семантический цвет боковой полосы цитаты. Измените значение tone в Controls для
          проверки интерактивного образца сверху:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Blockquote {...args}>
          Интерактивный образец с выбранным тоном: <strong>{args.tone}</strong>
        </Blockquote>
        <div className={layoutStyles.stackSm}>
          <Blockquote tone="primary" author="Primary Tone">
            Стандартная цитата (tone=&quot;primary&quot;)
          </Blockquote>
          <Blockquote tone="accent" author="Accent Tone">
            Акцентная архитектурная заметка (tone=&quot;accent&quot;)
          </Blockquote>
          <Blockquote tone="success" author="Success Tone">
            Подтвержденное требование или успешный вывод (tone=&quot;success&quot;)
          </Blockquote>
          <Blockquote tone="warning" author="Warning Tone">
            Предупреждение или важная оговорка (tone=&quot;warning&quot;)
          </Blockquote>
          <Blockquote tone="danger" author="Danger Tone">
            Критическое ограничение архитектуры (tone=&quot;danger&quot;)
          </Blockquote>
        </div>
      </div>
    </div>
  ),
};

export const PropAuthor: Story = {
  name: 'Пропс: author (Автор / Источник)',
  args: {
    author: 'System Architect — ADR-004',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `author` добавляет семантический тег `<cite>` с тире перед именем автора или названием документа-источника.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: author
        </Text>
        <Text variant="caption" tone="secondary">
          Отображает подпись автора или источник цитаты в нижней части блока. Если пропс не передан,
          тег &lt;cite&gt; не рендерится.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Blockquote {...args} />
        <Blockquote tone={args.tone} author={undefined}>
          Цитата без указания автора (author={'{undefined}'}) — блок содержит только основной текст.
        </Blockquote>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Содержимое цитаты)',
  args: {
    children:
      'Текст цитаты может содержать как простую строку, так и форматированные React-узлы.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `children` отвечает за основное содержимое цитаты внутри `<blockquote>`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: children
        </Text>
        <Text variant="caption" tone="secondary">
          Основное содержимое блока цитаты. Отредактируйте поле children в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Blockquote {...args} />
      </div>
    </div>
  ),
};
