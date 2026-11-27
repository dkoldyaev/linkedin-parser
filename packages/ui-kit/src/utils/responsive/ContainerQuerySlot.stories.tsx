import { Badge, Text } from '../../atoms';
import { ContainerQuery, ContainerQuerySlot, type ContainerQuerySlotProps } from './ContainerQuery';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useRef } from 'react';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof ContainerQuerySlot> = {
  title: 'Utils/Responsive/ContainerQuerySlot',
  component: ContainerQuerySlot,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент условного слота `ContainerQuerySlot` (`ContainerQuery.Slot`). Генерирует изолированное CSS-правило `@container (min-width: ...px) and (max-width: ...px)` для показа дочернего контента только тогда, когда ширина родительского контейнера попадает в диапазон `[min, max]`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    min: 300,
    max: 900,
    containerName: undefined,
  },
  argTypes: {
    min: {
      control: { type: 'number', min: 100, max: 1200, step: 50 },
      description: 'Минимальная ширина контейнера в пикселях (`min-width`), при которой слот видим.',
    },
    max: {
      control: { type: 'number', min: 200, max: 1400, step: 50 },
      description: 'Максимальная ширина контейнера в пикселях (`max-width`), при которой слот видим.',
    },
    containerName: {
      control: 'text',
      description: 'Опциональное имя целевого контейнера (`@container <name>`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContainerQuerySlot>;

function InteractiveSlotDemo(args: ContainerQuerySlotProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ContainerQuerySlot — Слот диапазона ширины контейнера (min={args.min ?? 'none'}, max=
          {args.max ?? 'none'})
        </Text>
        <Text variant="caption" tone="secondary">
          Потяните правый край блока или измените пороги min / max в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div ref={containerRef} className={layoutStyles.resizableBox}>
          <ContainerQuery containerRef={containerRef} containerName={args.containerName}>
            <ContainerQuerySlot {...args}>
              <Badge tone="success" size="md">
                Слот активен! Ширина контейнера между {args.min ?? 0}px и {args.max ?? '∞'}px
              </Badge>
            </ContainerQuerySlot>
          </ContainerQuery>
        </div>
      </div>
    </div>
  );
}

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ContainerQuerySlot`. Настраивайте `min`, `max` и `containerName` через панель Controls.',
      },
    },
  },
  render: (args) => <InteractiveSlotDemo {...args} />,
};

export const PropMinAndMax: Story = {
  name: 'Пропсы: min и max (Граничные условия ширины в пикселях)',
  args: {
    min: 350,
    max: 650,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `min` и `max` формируют CSS-условие `(min-width: Xpx) and (max-width: Ypx)`. Если ширина контейнера выходит за эти пределы, слот скрывается через `display: none`.',
      },
    },
  },
  render: (args) => <InteractiveSlotDemo {...args} />,
};
