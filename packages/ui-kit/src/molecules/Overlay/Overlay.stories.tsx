import { Button, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Overlay, type OverlayProps } from './Overlay';
import React, { useRef, useState } from 'react';
import { AlertBanner } from '../AlertBanner';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Overlay> = {
  title: 'Molecules/Overlay',
  component: Overlay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Универсальная портальная молекула наложения `Overlay`, работающая поверх `<OverlayProvider>`. Поддерживает как фиксированное позиционирование относительно вьюпорта (`center`, углы и края экрана), так и привязку к якорному DOM-элементу (`anchorRef` через `@floating-ui/react-dom`) без использования `z-index` — порядок наложения определяется исключительно хронологическим порядком в DOM внутри `[data-ui-overlay-root]`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    isOpen: false,
    placement: 'bottom-end',
    offsetPx: 4,
    backdrop: false,
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Управляет видимостью портального оверлея.',
    },
    placement: {
      control: 'select',
      options: [
        'center',
        'top-start',
        'top-center',
        'top-end',
        'bottom-start',
        'bottom-center',
        'bottom-end',
        'stretch-left',
        'stretch-right',
        'top',
        'bottom',
        'left',
        'right',
      ],
      description: 'Позиция оверлея относительно вьюпорта или относительно `anchorRef`.',
    },
    offsetPx: {
      control: { type: 'number', min: 0, max: 32, step: 2 },
      description: 'Отступ в пикселях от якорного элемента (`anchorRef`) при использовании Floating UI.',
    },
    backdrop: {
      control: 'boolean',
      description: 'Отображает затемняющую подложку позади оверлея во вьюпортном режиме.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Overlay>;

function InteractiveViewportOverlay(args: OverlayProps): React.ReactElement {
  const [open, setOpen] = useState(args.isOpen);

  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Overlay — Портальное наложение без z-index (placement=&quot;{args.placement}&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Нажмите кнопку ниже или переключите isOpen в Controls для открытия оверлея.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button variant="primary" onClick={() => setOpen((prev) => !prev)}>
            {open ? 'Закрыть Overlay' : 'Открыть Overlay'}
          </Button>
        </div>
        <Overlay {...args} isOpen={open} onClose={() => setOpen(false)}>
          <div className={layoutStyles.narrowBox}>
            <AlertBanner
              tone="success"
              title={`OVERLAY (${args.placement})`}
              onDismiss={() => setOpen(false)}
            >
              Отрендерен через портал в OverlayProvider. Нажмите Esc или крестик для закрытия.
            </AlertBanner>
          </div>
        </Overlay>
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
          'Базовая интерактивная демонстрация `Overlay`. Настраивайте `placement`, `backdrop` и `isOpen` через панель Controls.',
      },
    },
  },
  render: (args) => <InteractiveViewportOverlay {...args} />,
};

export const PropPlacementAndBackdrop: Story = {
  name: 'Пропсы: placement и backdrop (Позиция во вьюпорте и подложка)',
  args: {
    isOpen: false,
    placement: 'center',
    backdrop: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `placement` задает точку привязки во вьюпорте (`center`, `bottom-end`, `top-end` и др.), а `backdrop` включает полупрозрачный фон с закрытием по клику.',
      },
    },
  },
  render: (args) => <InteractiveViewportOverlay {...args} />,
};

function AnchoredOverlayDemo(args: OverlayProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: anchorRef &amp; offsetPx (Привязка к элементу через Floating UI)
        </Text>
        <Text variant="caption" tone="secondary">
          При передаче anchorRef оверлей позиционируется относительно кнопки-триггера с отступом
          offsetPx ({args.offsetPx}px).
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button ref={triggerRef} variant="secondary" onClick={() => setOpen((prev) => !prev)}>
            {open ? 'Скрыть меню (anchorRef)' : 'Открыть меню у кнопки (anchorRef)'}
          </Button>
        </div>
        <Overlay
          {...args}
          isOpen={open}
          anchorRef={triggerRef}
          placement={args.placement ?? 'bottom-start'}
          onClose={() => setOpen(false)}
        >
          <div className={layoutStyles.box}>
            <div className={layoutStyles.stackSm}>
              <Text variant="mono-label" tone="accent">
                ANCHORED POPOVER MENU
              </Text>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Редактировать колонку
              </Button>
              <Button size="sm" variant="ghost" tone="danger" onClick={() => setOpen(false)}>
                Удалить колонку
              </Button>
            </div>
          </div>
        </Overlay>
      </div>
    </div>
  );
}

export const PropAnchorRefAndOffsetPx: Story = {
  name: 'Пропсы: anchorRef и offsetPx (Привязка к DOM-элементу)',
  args: {
    placement: 'bottom-start',
    offsetPx: 6,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `anchorRef` включает режим выпадающего поповера, привязанного к координатам триггера с автоматическим `flip()` и `shift()` при выходе за края экрана.',
      },
    },
  },
  render: (args) => <AnchoredOverlayDemo {...args} />,
};
