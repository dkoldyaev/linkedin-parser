import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { SortButton, type SortDirection } from './SortButton';
import { Button } from './Button';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Atomic Button & SortButton components aligned to the 32px Blueprint grid (`--ui-grid-cell`). Composes `<Spinner>` for loading state and `<Icon>` for directional indicators.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
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
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon', 'icon-sm', 'icon-xs'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Execute Action',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Button variant="primary" startIcon={<Icon icon={Sparkles} size="sm" />}>
        Primary Action
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="secondary" tone="success">
        Success
      </Button>
      <Button variant="secondary" tone="warning">
        Warning
      </Button>
      <Button variant="secondary" tone="danger" startIcon={<Icon icon={Trash2} size="sm" />}>
        Delete
      </Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Button size="sm" variant="primary">
        Small (24px)
      </Button>
      <Button size="md" variant="primary">
        Medium (32px Grid)
      </Button>
      <Button size="lg" variant="primary">
        Large (40px)
      </Button>
      <Button size="icon" variant="secondary" aria-label="Add item">
        <Icon icon={Plus} size="sm" />
      </Button>
    </div>
  ),
};

export const LoadingAndDisabled: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Button variant="primary" loading>
        Processing Queue...
      </Button>
      <Button variant="secondary" disabled>
        Disabled Button
      </Button>
    </div>
  ),
};

function SortButtonInteractiveDemo(): React.ReactElement {
  const [dir, setDir] = useState<SortDirection>('asc');
  return (
    <div className={layoutStyles.row}>
      <SortButton direction={dir} onToggle={(next) => setDir(next)}>
        Updated Date ({dir.toUpperCase()})
      </SortButton>
      <SortButton direction="none" size="md">
        Priority
      </SortButton>
      <SortButton direction="desc" tone="accent" size="md">
        Score
      </SortButton>
    </div>
  );
}

export const SortButtonComposition: Story = {
  render: () => <SortButtonInteractiveDemo />,
};

function InteractiveCounterDemo(): React.ReactElement {
  const [clicks, setClicks] = useState(0);
  return (
    <Button variant="primary" onClick={() => setClicks((c) => c + 1)} data-testid="interactive-btn">
      Clicked {clicks} times
    </Button>
  );
}

export const InteractivePlay: Story = {
  render: () => <InteractiveCounterDemo />,
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector(
      '[data-testid="interactive-btn"]',
    ) as HTMLButtonElement | null;
    if (button) {
      button.focus();
      button.click();
    }
  },
};
