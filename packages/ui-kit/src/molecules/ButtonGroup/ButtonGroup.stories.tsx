import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronLeft, ChevronRight, X, Plus, Minus, Download, Share2, Trash2 } from 'lucide-react';
import { Button, Icon } from '../../atoms';
import { ButtonGroup } from './ButtonGroup';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Molecules/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['attached', 'detached'],
    },
    fullWidth: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <ButtonGroup>
        <Button variant="ghost" size="icon" aria-label="Previous">
          <Icon icon={ChevronLeft} size="sm" />
        </Button>
        <Button variant="ghost" size="icon" tone="danger" aria-label="Reject">
          <Icon icon={X} size="sm" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Next">
          <Icon icon={ChevronRight} size="sm" />
        </Button>
      </ButtonGroup>
    </div>
  ),
};

export const SecondaryActions: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <ButtonGroup>
        <Button variant="secondary" size="sm" startIcon={<Icon icon={Share2} size="xs" />}>
          Share
        </Button>
        <Button variant="secondary" size="sm" startIcon={<Icon icon={Download} size="xs" />}>
          Export
        </Button>
        <Button variant="danger" size="sm" startIcon={<Icon icon={Trash2} size="xs" />}>
          Delete
        </Button>
      </ButtonGroup>
    </div>
  ),
};

export const Detached: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <ButtonGroup variant="detached">
        <Button variant="secondary" size="sm">
          Day
        </Button>
        <Button variant="primary" size="sm">
          Week
        </Button>
        <Button variant="secondary" size="sm">
          Month
        </Button>
      </ButtonGroup>
    </div>
  ),
};

export const StepperButtons: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <ButtonGroup>
        <Button variant="secondary" size="icon-sm" aria-label="Decrease">
          <Icon icon={Minus} size="xs" />
        </Button>
        <Button variant="secondary" size="icon-sm" aria-label="Increase">
          <Icon icon={Plus} size="xs" />
        </Button>
      </ButtonGroup>
    </div>
  ),
};
