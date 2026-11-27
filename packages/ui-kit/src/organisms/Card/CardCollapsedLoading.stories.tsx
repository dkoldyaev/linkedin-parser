import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardCollapsedLoading } from './Card';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta<typeof CardCollapsedLoading> = {
  title: 'Organisms/Card/CardCollapsedLoading',
  component: CardCollapsedLoading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Организм скелетона загрузки для компактной однострочной карточки `CardCollapsedLoading` (`Card.CollapsedLoading`) высотой ровно 32px (1 ячейка сетки Blueprint). Композирует текстовый и чип-скелетон `<Skeleton>` с атрибутом `aria-busy="true"`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    tone: 'success',
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
      description: 'Семантический цветовой тон акцентной полосы компактного скелетона.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardCollapsedLoading>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `CardCollapsedLoading`. Настраивайте `tone` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          CardCollapsedLoading — Компактный 32px скелетон загрузки
        </Text>
        <Text variant="caption" tone="secondary">
          Плейсхолдер высотой в 1 ячейку сетки (32px) для свернутых списков карточек.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardCollapsedLoading {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический цвет акцента)',
  args: {
    tone: 'warning',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` задает цвет акцентной полосы скелетона (`success`, `warning`, `danger`, `accent`, `info`).',
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
          Измените tone в Controls или сравните стек скелетонов ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          <div className={layoutStyles.narrowBox}>
            <CardCollapsedLoading {...args} />
          </div>
          <div className={layoutStyles.narrowBox}>
            <CardCollapsedLoading tone="success" />
          </div>
          <div className={layoutStyles.narrowBox}>
            <CardCollapsedLoading tone="danger" />
          </div>
        </div>
      </div>
    </div>
  ),
};
