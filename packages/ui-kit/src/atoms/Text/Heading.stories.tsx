import { Heading, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Heading> = {
  title: 'Atoms/Text/Heading',
  component: Heading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Семантический компонент заголовка (`<h1>`–`<h6>`), выровненный по типографической шкале Blueprint Design System. Обеспечивает строгую иерархию заголовков страниц, секций, карточек и модальных окон.',
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
      options: [1, 2, 3, 4, 5, 6],
      description:
        'Уровень HTML-заголовка (`1` -> `<h1>`, `2` -> `<h2>`, ..., `6` -> `<h6>`), определяющий семантический тег и размер шрифта.',
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
      description: 'Семантический цветовой тон текста заголовка.',
    },
    children: {
      control: 'text',
      description: 'Текст или содержимое заголовка.',
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
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Heading`. Позволяет переключать уровень заголовка (`level`), цветовой тон (`tone`) и текст (`children`) через Controls.',
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
          Автоматически подбирает HTML-тег h1..h6 и соответствующий типографический токен размера и
          насыщенности.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Heading {...args} />
      </div>
    </div>
  ),
};

export const PropLevel: Story = {
  name: 'Пропс: level (Уровень заголовка h1–h6)',
  args: {
    level: 1,
    children: 'Заголовок выбранного уровня',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `level` принимает число от `1` до `6`, рендерит соответствующий тег `<h1>`..`<h6>` и применяет класс типографической шкалы.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: level (1 | 2 | 3 | 4 | 5 | 6)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте level в панели Controls для изменения активного заголовка сверху и сравните со
          всей шкалой h1–h6 ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Heading {...args}>
          Активный образец (H{args.level}): {args.children}
        </Heading>
        <div className={layoutStyles.stackSm}>
          <Heading level={1}>H1 (level=1) — Главный заголовок страницы</Heading>
          <Heading level={2}>H2 (level=2) — Заголовок крупного раздела или модального окна</Heading>
          <Heading level={3}>H3 (level=3) — Заголовок карточки или подсекции</Heading>
          <Heading level={4}>H4 (level=4) — Заголовок группы полей</Heading>
          <Heading level={5}>H5 (level=5) — Технический подзаголовок</Heading>
          <Heading level={6}>H6 (level=6) — Микро-заголовок спецификации</Heading>
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Цветовой тон заголовка)',
  args: {
    level: 3,
    tone: 'accent',
    children: 'Заголовок с семантическим цветовым тоном',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` управляет цветом текста заголовка согласно семантической палитре (`primary`, `secondary`, `muted`, `accent`, `success`, `warning`, `danger`, `info`).',
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
          Задает семантический цвет заголовка. Выберите tone в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Heading {...args} />
        <div className={layoutStyles.stackSm}>
          <Heading level={4} tone="primary">
            tone=&quot;primary&quot; — Основной контрастный заголовок
          </Heading>
          <Heading level={4} tone="secondary">
            tone=&quot;secondary&quot; — Вторичный заголовок
          </Heading>
          <Heading level={4} tone="accent">
            tone=&quot;accent&quot; — Акцентный Blueprint Blue
          </Heading>
          <Heading level={4} tone="success">
            tone=&quot;success&quot; — Успешный статус
          </Heading>
          <Heading level={4} tone="warning">
            tone=&quot;warning&quot; — Предупреждение
          </Heading>
          <Heading level={4} tone="danger">
            tone=&quot;danger&quot; — Критическая секция
          </Heading>
        </div>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Текст заголовка)',
  args: {
    level: 2,
    children: 'Настраиваемый текст заголовка через Controls',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `children` задает текстовое или React-содержимое заголовка.',
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
          Содержимое тега заголовка. Измените текст в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Heading {...args} />
      </div>
    </div>
  ),
};
