import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { StatusDot } from './StatusDot';

const meta: Meta<typeof StatusDot> = {
  title: 'Atoms/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusDot>;

export const SemanticDots: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <StatusDot tone="neutral" label="Neutral" />
      <StatusDot tone="primary" label="Active" />
      <StatusDot tone="secondary" label="Secondary" />
      <StatusDot tone="muted" label="Muted" />
      <StatusDot tone="accent" label="Accent" />
      <StatusDot tone="success" pulse label="Worker online" />
      <StatusDot tone="warning" label="Pending" />
      <StatusDot tone="danger" label="Error" />
      <StatusDot tone="info" label="Info" />
    </div>
  ),
};
