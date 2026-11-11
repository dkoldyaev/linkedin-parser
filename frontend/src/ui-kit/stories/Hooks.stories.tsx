import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Badge,
  Button,
  Card,
  Input,
  Text,
  useCopyToClipboard,
  useDebounce,
  useDisclosure,
  useKeyboardNavigation,
  useMediaQuery,
} from '../index';
import layoutStyles from './StoryLayout.module.css';

const meta: Meta = {
  title: 'Hooks/Hooks Showcase',
  tags: ['autodocs'],
};

export default meta;

function HooksInteractivePlayground(): React.ReactElement {
  const disclosure = useDisclosure({ defaultIsOpen: true });
  const [rawQuery, setRawQuery] = useState('React 19 Design System');
  const debouncedQuery = useDebounce(rawQuery, 350);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { isCopied, copy } = useCopyToClipboard(1500);

  const stageItems = [
    '1. Inbox / Not Contacted',
    '2. CV Adapted & Applied',
    '3. Technical Screening',
    '4. Architecture Interview',
  ] as const;

  const nav = useKeyboardNavigation({
    items: stageItems,
    initialIndex: 0,
    loop: true,
    orientation: 'vertical',
  });

  return (
    <div className={layoutStyles.stack}>
      <Card
        title="useDisclosure + useControllableState"
        subtitle="Controls boolean open/close state for modals, drawers, and panels."
        headerActions={
          <Badge tone={disclosure.isOpen ? 'success' : 'neutral'}>
            {disclosure.isOpen ? 'OPEN' : 'CLOSED'}
          </Badge>
        }
      >
        <div className={layoutStyles.row}>
          <Button size="sm" variant="primary" onClick={disclosure.toggle}>
            Toggle Disclosure
          </Button>
          <Button size="sm" variant="secondary" onClick={disclosure.open}>
            Open
          </Button>
          <Button size="sm" variant="secondary" onClick={disclosure.close}>
            Close
          </Button>
        </div>
      </Card>

      <Card
        title="useDebounce (350ms)"
        subtitle="Debounces high-frequency search input before triggering filtering."
      >
        <Input
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          aria-label="Debounced input demo"
        />
        <Text variant="mono" tone="accent">
          Debounced output: {debouncedQuery}
        </Text>
      </Card>

      <Card
        title="useKeyboardNavigation"
        subtitle="Focus the button below and press ArrowUp / ArrowDown / Home / End."
      >
        <div
          tabIndex={0}
          onKeyDown={nav.handleKeyDown}
          role="listbox"
          aria-label="Pipeline stages keyboard navigation"
          className={layoutStyles.stack}
        >
          {stageItems.map((item, idx) => (
            <Badge
              key={item}
              tone={idx === nav.activeIndex ? 'primary' : 'neutral'}
            >
              {idx === nav.activeIndex ? `▶ ${item}` : item}
            </Badge>
          ))}
        </div>
      </Card>

      <Card
        title="useMediaQuery & useCopyToClipboard"
        subtitle="Viewport reactivity and clipboard state management."
      >
        <div className={layoutStyles.row}>
          <Badge tone={isDesktop ? 'success' : 'warning'}>
            (min-width: 1024px): {String(isDesktop)}
          </Badge>
          <Button
            size="sm"
            variant="mint"
            onClick={() => void copy('npx storybook dev -p 6006')}
          >
            {isCopied ? 'Copied Command!' : 'Copy Storybook CLI Command'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export const InteractiveHooksDemo: StoryObj = {
  render: () => <HooksInteractivePlayground />,
};
