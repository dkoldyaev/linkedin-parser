import { Badge, Button, Text } from '../../atoms';
import { ContainerQuery, type ContainerQueryProps } from './ContainerQuery';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useRef } from 'react';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof ContainerQuery> = {
  title: 'Utils/Responsive/ContainerQuery',
  component: ContainerQuery,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Компонент чистых CSS Container Queries `ContainerQuery`. Устанавливает `container-type` (по умолчанию `inline-size`) и `container-name` на целевой DOM-элемент по ссылке `containerRef` и координирует дочерние слоты `<ContainerQuery.Slot min={...} max={...}>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    containerType: 'inline-size',
    containerName: 'demo-card-container',
  },
  argTypes: {
    containerType: {
      control: 'inline-radio',
      options: ['inline-size', 'size', 'normal'],
      description: 'Значение CSS-свойства `container-type`, применяемое к `containerRef.current`.',
    },
    containerName: {
      control: 'text',
      description: 'Опциональное имя контейнера (`container-name`) для именованных `@container` запросов.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContainerQuery>;

function InteractiveContainerQueryDemo(
  args: Omit<ContainerQueryProps, 'containerRef' | 'children'>,
): React.ReactElement {
  const boxRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ContainerQuery — Адаптивность по ширине родительского контейнера
        </Text>
        <Text variant="caption" tone="secondary">
          Потяните за правый нижний угол контейнера ниже, чтобы изменить его ширину (&lt;400px,
          400..699px, &gt;=700px):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div ref={boxRef} className={layoutStyles.resizableBox}>
          <ContainerQuery
            containerRef={boxRef}
            containerType={args.containerType}
            containerName={args.containerName}
          >
            <ContainerQuery.Slot max={399} containerName={args.containerName}>
              <div className={layoutStyles.cqStack}>
                <Badge tone="danger">Узкий контейнер (&lt; 400px)</Badge>
                <Button size="sm" fullWidth>
                  Компактная кнопка
                </Button>
              </div>
            </ContainerQuery.Slot>

            <ContainerQuery.Slot min={400} max={699} containerName={args.containerName}>
              <div className={layoutStyles.row}>
                <Badge tone="warning">Средний контейнер (400px – 699px)</Badge>
                <Button size="sm" variant="secondary">
                  Средняя кнопка
                </Button>
              </div>
            </ContainerQuery.Slot>

            <ContainerQuery.Slot min={700} containerName={args.containerName}>
              <div className={layoutStyles.row}>
                <Badge tone="success">Широкий контейнер (&gt;= 700px)</Badge>
                <Button size="sm" variant="primary">
                  Главное действие
                </Button>
                <Button size="sm" variant="secondary">
                  Вторичное действие
                </Button>
              </div>
            </ContainerQuery.Slot>
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
          'Базовая интерактивная демонстрация `ContainerQuery`. Изменяйте размер блока мышью и настраивайте `containerType` и `containerName` в панели Controls.',
      },
    },
  },
  render: (args) => <InteractiveContainerQueryDemo {...args} />,
};

export const PropContainerTypeAndName: Story = {
  name: 'Пропсы: containerRef, containerType и containerName',
  args: {
    containerType: 'inline-size',
    containerName: 'custom-named-container',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `containerRef` указывает на измеряемый DOM-элемент, `containerType` задает режим отслеживания размеров (`inline-size`), а `containerName` изолирует запросы для вложенных контейнеров.',
      },
    },
  },
  render: (args) => <InteractiveContainerQueryDemo {...args} />,
};
