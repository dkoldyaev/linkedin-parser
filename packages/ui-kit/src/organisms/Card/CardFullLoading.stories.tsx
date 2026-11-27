import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardFullLoading } from './Card';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta<typeof CardFullLoading> = {
  title: 'Organisms/Card/CardFullLoading',
  component: CardFullLoading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Организм скелетона загрузки для полноразмерной карточки `CardFullLoading` (`Card.FullLoading`). Композирует `<CardBody>`, `<CardFooter>` и атомы `<Skeleton>` (`text`, `chip`, `rect`) с атрибутом `aria-busy="true"` и квантованием высоты по 32px сетке Blueprint.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    tone: 'accent',
    horizontal: false,
    snapToGrid: true,
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
      description: 'Семантический цветовой тон акцентной полосы скелетона карточки.',
    },
    horizontal: {
      control: 'boolean',
      description: 'Включает горизонтальную раскладку скелетона.',
    },
    snapToGrid: {
      control: 'boolean',
      description: 'Квантует высоту тела скелетона кратно 32px (`--ui-grid-cell`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardFullLoading>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `CardFullLoading`. Настраивайте `tone`, `horizontal` и `snapToGrid` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          CardFullLoading — Анимированный скелетон полной карточки
        </Text>
        <Text variant="caption" tone="secondary">
          Точно повторяет геометрию CardFull (шапка, чипы стека, 3 строки описания и футер 32px).
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardFullLoading {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический акцент скелетона)',
  args: {
    tone: 'success',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `tone` позволяет сохранить цветовую маркировку колонки или статуса во время загрузки карточки.',
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
          Переключайте tone в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardFullLoading {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropSnapToGridAndHorizontal: Story = {
  name: 'Пропсы: snapToGrid и horizontal (Геометрия скелетона)',
  args: {
    snapToGrid: true,
    horizontal: false,
    tone: 'info',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `snapToGrid` удерживает высоту кратной 32px, а `horizontal` переключает направление контейнера.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: snapToGrid &amp; horizontal
        </Text>
        <Text variant="caption" tone="secondary">
          Измените флаги snapToGrid и horizontal в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardFullLoading {...args} />
        </div>
      </div>
    </div>
  ),
};
