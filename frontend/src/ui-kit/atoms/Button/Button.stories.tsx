import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
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
          'Atomic Button component aligned to the 32px Blueprint grid (`--ui-grid-cell`). Supports 6 semantic variants, 4 sizes, loading spinner, icons, and polymorphic `asChild` composition.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'warning', 'mint', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Adapt CV',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Button variant="primary" startIcon={<Icon icon={Sparkles} size="sm" />}>
        Primary Action
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="mint">Mint Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="danger" startIcon={<Icon icon={Trash2} size="sm" />}>
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

export const LongContentAndFullWidth: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Button variant="primary" fullWidth>
        Full-Width Blueprint Button — Sync All LinkedIn Vacancies
      </Button>
    </div>
  ),
};

function InteractiveCounterDemo(): React.ReactElement {
  const [clicks, setClicks] = useState(0);
  return (
    <Button
      variant="primary"
      onClick={() => setClicks((c) => c + 1)}
      data-testid="interactive-btn"
    >
      Clicked {clicks} times
    </Button>
  );
}

export const InteractivePlay: Story = {
  render: () => <InteractiveCounterDemo />,
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector(
      '[data-testid="interactive-btn"]'
    ) as HTMLButtonElement | null;
    if (button) {
      button.focus();
      button.click();
    }
  },
};
