import type { Meta, StoryObj } from '@storybook/react-vite';
import { Paragraph, Text } from './Text';
import layoutStyles from '../../stories/StoryLayout.module.css';

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
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Нижний внешний отступ (`margin-bottom`) после абзаца для формирования вертикального ритма.',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: 'Размер текста абзаца (`sm` — компактный, `md` — стандартный).',
    },
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
      description: 'Семантический цветовой тон текста абзаца.',
    },
    weight: {
      control: 'inline-radio',
      options: ['regular', 'medium', 'semibold', 'bold'],
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
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация компонента `Paragraph`. Используйте Controls для настройки `spacing`, `size`, `tone`, `weight` и `children`.',
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
  name: 'Пропс: spacing (Нижний отступ)',
  args: {
    spacing: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `spacing` управляет нижним отступом между последовательными абзацами (`none`, `sm`, `md`, `lg`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: spacing (&quot;none&quot; | &quot;sm&quot; | &quot;md&quot; | &quot;lg&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Регулирует расстояние до следующего блочного элемента. Измените spacing в Controls, чтобы
          увидеть разницу между первым и вторым абзацем:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Paragraph {...args}>
            Первый абзац с настраиваемым отступом spacing=&quot;{args.spacing}&quot;.
          </Paragraph>
          <Paragraph spacing="none" tone="secondary">
            Следующий за ним опорный абзац (показывает границу отступа первого абзаца).
          </Paragraph>
        </div>
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Размер шрифта)',
  args: {
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `size` выбирает размер шрифта абзаца (`sm` или `md`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size (&quot;sm&quot; | &quot;md&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Позволяет выбрать компактный (sm) или стандартный (md) размер текста для карточек и
          модальных окон.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Paragraph {...args}>
          Интерактивный абзац (size=&quot;{args.size}&quot;): {args.children}
        </Paragraph>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический цвет)',
  args: {
    tone: 'secondary',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` задает цвет текста абзаца из семантической палитры (`primary`, `secondary`, `muted`, `accent`, `success`, `warning`, `danger`, `info`).',
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
          Управляет цветовым акцентом текста абзаца. Переключайте tone в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Paragraph {...args} />
        <div className={layoutStyles.stackSm}>
          <Paragraph spacing="none" tone="primary">
            tone=&quot;primary&quot; — Основной текст описания
          </Paragraph>
          <Paragraph spacing="none" tone="secondary">
            tone=&quot;secondary&quot; — Вторичный поясняющий текст
          </Paragraph>
          <Paragraph spacing="none" tone="muted">
            tone=&quot;muted&quot; — Приглушенная заметка или мета-информация
          </Paragraph>
          <Paragraph spacing="none" tone="accent">
            tone=&quot;accent&quot; — Акцентный абзац
          </Paragraph>
        </div>
      </div>
    </div>
  ),
};

export const PropWeight: Story = {
  name: 'Пропс: weight (Насыщенность шрифта)',
  args: {
    weight: 'semibold',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `weight` управляет толщиной начертания текста (`regular`, `medium`, `semibold`, `bold`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: weight (&quot;regular&quot; | &quot;medium&quot; | &quot;semibold&quot; | &quot;bold&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Изменяет font-weight абзаца для выделения ключевых вводных абзацев (lead paragraphs).
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Paragraph {...args}>
          Интерактивный образец с weight=&quot;{args.weight}&quot;: {args.children}
        </Paragraph>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Содержимое абзаца)',
  args: {
    children: 'Произвольный текст абзаца, редактируемый в реальном времени через Controls.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `children` передает текст или инлайн-элементы внутрь `<p>`.',
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
          Основное содержимое абзаца:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Paragraph {...args} />
      </div>
    </div>
  ),
};
