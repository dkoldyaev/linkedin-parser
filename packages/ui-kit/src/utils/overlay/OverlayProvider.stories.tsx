import { Button, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { AlertBanner } from '../../molecules/AlertBanner';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Overlay } from '../../molecules/Overlay';
import { OverlayProvider } from './OverlayProvider';

const meta: Meta<typeof OverlayProvider> = {
  title: 'Utils/Overlay/OverlayProvider',
  component: OverlayProvider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Корневой провайдер стека наложений `OverlayProvider`. Изолирует контекст наложения приложения (`isolation: isolate` на `[data-ui-app-root]`) и создает единый общий портальный DOM-контейнер `[data-ui-overlay-root]` в конце `document.body`. Благодаря этому все оверлеи (`Overlay`, `Modal`, `Drawer`, `Select`, `Tooltip`) перекрывают друг друга естественным образом по порядку монтирования в DOM без `z-index` конфликтов.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof OverlayProvider>;

function StackedOverlaysDemo(): React.ReactElement {
  const [firstOpen, setFirstOpen] = useState(false);
  const [secondOpen, setSecondOpen] = useState(false);

  return (
    <OverlayProvider>
      <div className={layoutStyles.propDocBox}>
        <div className={layoutStyles.propInfoHeader}>
          <Text variant="mono-label" tone="accent">
            OverlayProvider — Провайдер портальных оверлеев без z-index
          </Text>
          <Text variant="caption" tone="secondary">
            Откройте первый и второй оверлей по очереди — второй автоматически окажется поверх
            первого за счет порядка узлов в [data-ui-overlay-root].
          </Text>
        </div>
        <div className={layoutStyles.propPreviewArea}>
          <div className={layoutStyles.row}>
            <Button variant="primary" onClick={() => setFirstOpen((p) => !p)}>
              {firstOpen ? 'Скрыть Оверлей #1' : 'Открыть Оверлей #1 (bottom-end)'}
            </Button>
            <Button variant="secondary" onClick={() => setSecondOpen((p) => !p)}>
              {secondOpen ? 'Скрыть Оверлей #2' : 'Открыть Оверлей #2 (top-end)'}
            </Button>
          </div>

          <Overlay isOpen={firstOpen} placement="bottom-end" onClose={() => setFirstOpen(false)}>
            <div className={layoutStyles.narrowBox}>
              <AlertBanner
                tone="info"
                title="ОВЕРЛЕЙ #1 (DOM ORDER)"
                onDismiss={() => setFirstOpen(false)}
              >
                Смонтирован в [data-ui-overlay-root] первым.
              </AlertBanner>
            </div>
          </Overlay>

          <Overlay isOpen={secondOpen} placement="top-end" onClose={() => setSecondOpen(false)}>
            <div className={layoutStyles.narrowBox}>
              <AlertBanner
                tone="success"
                title="ОВЕРЛЕЙ #2 (DOM ORDER)"
                onDismiss={() => setSecondOpen(false)}
              >
                Смонтирован в [data-ui-overlay-root] вторым.
              </AlertBanner>
            </div>
          </Overlay>
        </div>
      </div>
    </OverlayProvider>
  );
}

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `OverlayProvider`. Показывает работу общего портального контейнера для дочерних оверлеев.',
      },
    },
  },
  render: () => <StackedOverlaysDemo />,
};

export const PropChildren: Story = {
  name: 'Пропс: children (Дерево приложения внутри провайдера)',
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `children` оборачивает корневое дерево приложения в контейнер `[data-ui-app-root]` с `isolation: isolate` и предоставляет контекст для хука `useOverlayContainer()`.',
      },
    },
  },
  render: () => <StackedOverlaysDemo />,
};
