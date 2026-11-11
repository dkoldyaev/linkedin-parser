import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Badge,
  Button,
  Card,
  Input,
  Text,
  useBlueprintGrid,
  useCopyToClipboard,
  useDebounce,
  useDisclosure,
  useGridScroll,
  useKeyboardNavigation,
  useMediaQuery,
} from '../index';
import layoutStyles from './StoryLayout.module.css';

const meta: Meta = {
  title: 'Hooks/Hooks Showcase',
  tags: ['autodocs'],
};

export default meta;

function BlueprintGridAndScrollDemo(): React.ReactElement {
  const [extraLines, setExtraLines] = useState<number>(1);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const gridContainerRef = useBlueprintGrid<HTMLDivElement>([extraLines]);
  const handleGridScroll = useGridScroll();

  const scrollRows = [
    'Row 01 — 0px..64px (2 Grid Cells)',
    'Row 02 — 64px..128px (2 Grid Cells)',
    'Row 03 — 128px..192px (2 Grid Cells)',
    'Row 04 — 192px..256px (2 Grid Cells)',
    'Row 05 — 256px..320px (2 Grid Cells)',
    'Row 06 — 320px..384px (2 Grid Cells)',
  ] as const;

  return (
    <div ref={gridContainerRef} className={layoutStyles.stack}>
      <Card
        title="useBlueprintGrid (32px Column & Height Quantization)"
        subtitle="Quantizes .bp-grid-row[data-cols] column widths and snaps .bp-snap heights to exact multiples of 32px (--ui-grid-cell)."
        headerActions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => setExtraLines((c) => (c % 4) + 1)}
          >
            Add Dynamic Content ({extraLines}x)
          </Button>
        }
      >
        <div
          className={`bp-grid-row ${layoutStyles.gridDemoRow}`}
          data-cols="2"
        >
          <div
            className={`bp-snap ${layoutStyles.gridDemoCell}`}
            data-min-grids="2"
          >
            <Text variant="mono-label" tone="accent">
              .bp-snap [data-min-grids=&quot;2&quot;]
            </Text>
            <Text variant="caption" tone="secondary">
              Snaps to ≥ 64px (2 × 32px). Dynamic lines: {extraLines}
            </Text>
            {Array.from({ length: extraLines }).map((_, idx) => (
              <Text key={idx} variant="mono">
                Line #{idx + 1} snapped to 32px grid
              </Text>
            ))}
          </div>
          <div
            className={`bp-snap ${layoutStyles.gridDemoCell}`}
            data-min-grids="3"
          >
            <Text variant="mono-label" tone="success">
              .bp-snap [data-min-grids=&quot;3&quot;]
            </Text>
            <Text variant="caption" tone="secondary">
              Minimum 96px (3 × 32px) height quantization.
            </Text>
          </div>
        </div>
      </Card>

      <Card
        title="useGridScroll (180ms 32px Scroll Settling)"
        subtitle="Scroll the box below and release — scrollTop smoothly settles onto the nearest multiple of 32px."
        headerActions={
          <Badge tone="primary">scrollTop: {Math.round(scrollOffset)}px</Badge>
        }
      >
        <div
          className={layoutStyles.scrollDemoViewport}
          onScroll={(event) => {
            setScrollOffset(event.currentTarget.scrollTop);
            handleGridScroll(event, 'y');
          }}
        >
          {scrollRows.map((row) => (
            <div key={row} className={layoutStyles.scrollDemoItem}>
              <Text variant="mono">{row}</Text>
              <Badge size="sm" tone="neutral">
                64px
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export const BlueprintGridAndScrollHooks: StoryObj = {
  name: 'useBlueprintGrid & useGridScroll',
  render: () => <BlueprintGridAndScrollDemo />,
};

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
