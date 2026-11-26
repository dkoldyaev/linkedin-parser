import { Button, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { AlertBanner } from '../AlertBanner';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Overlay } from './Overlay';

const meta: Meta<typeof Overlay> = {
  title: 'Molecules/Overlay',
  component: Overlay,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Overlay>;

function ViewportToastExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={layoutStyles.row}>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Show Corner AlertBanner
      </Button>
      <Overlay isOpen={isOpen} placement="bottom-end">
        <div className={layoutStyles.narrowBox}>
          <AlertBanner tone="success" title="Vacancy Queued" onDismiss={() => setIsOpen(false)}>
            Rendered inside OverlayProvider without z-index.
          </AlertBanner>
        </div>
      </Overlay>
    </div>
  );
}

export const ViewportAlertBanner: Story = {
  render: () => <ViewportToastExample />,
};

function AnchoredPopoverExample() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className={layoutStyles.row}>
      <Button ref={triggerRef} variant="secondary" onClick={() => setIsOpen((prev) => !prev)}>
        Toggle Anchored Menu
      </Button>
      <Overlay
        isOpen={isOpen}
        anchorRef={triggerRef}
        placement="bottom-start"
        onClose={() => setIsOpen(false)}
      >
        <div className={layoutStyles.resizableBox}>
          <div className={layoutStyles.stackSm}>
            <Text variant="mono-label" tone="accent">
              ANCHORED POPOVER
            </Text>
            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
              Configure Column
            </Button>
            <Button size="sm" variant="ghost" tone="danger" onClick={() => setIsOpen(false)}>
              Delete Column
            </Button>
          </div>
        </div>
      </Overlay>
    </div>
  );
}

export const AnchoredToElement: Story = {
  render: () => <AnchoredPopoverExample />,
};

function CenteredBackdropExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={layoutStyles.row}>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Open Centered Overlay
      </Button>
      <Overlay isOpen={isOpen} placement="center" backdrop onClose={() => setIsOpen(false)}>
        <div className={layoutStyles.resizableBox}>
          <div className={layoutStyles.stackSm}>
            <Text variant="mono" weight="bold">
              Centered Viewport Overlay
            </Text>
            <Text variant="body-sm" tone="secondary">
              Click outside or press Escape to dismiss.
            </Text>
            <Button size="sm" variant="secondary" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Overlay>
    </div>
  );
}

export const CenteredWithBackdrop: Story = {
  render: () => <CenteredBackdropExample />,
};
