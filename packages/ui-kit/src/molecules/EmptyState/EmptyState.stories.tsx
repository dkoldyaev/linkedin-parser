import type { Meta, StoryObj } from '@storybook/react-vite';
import { Briefcase, Plus } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Button, Icon } from '../../atoms';

const meta: Meta<typeof EmptyState> = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  render: () => (
    <EmptyState
      icon={<Icon icon={Briefcase} size="lg" tone="accent" />}
      title="No Active Tasks in Queue"
      description="All LinkedIn job parsing and CV adaptation tasks have completed."
      action={
        <Button variant="primary" startIcon={<Icon icon={Plus} size="sm" />}>
          Add Job URL
        </Button>
      }
    />
  ),
};
