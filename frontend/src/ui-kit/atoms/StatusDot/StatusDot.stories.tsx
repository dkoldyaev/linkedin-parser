import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusDot } from './StatusDot';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof StatusDot> = {
  title: 'Atoms/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusDot>;

export const SemanticAndPaletteDots: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <StatusDot tone="success" pulse label="Worker online" />
      <StatusDot tone="primary" label="Active" />
      <StatusDot tone="warning" label="Pending" />
      <StatusDot tone="danger" label="Error" />
      <StatusDot palette="slate" />
      <StatusDot palette="blue" />
      <StatusDot palette="purple" />
      <StatusDot palette="emerald" />
      <StatusDot palette="amber" />
      <StatusDot palette="rose" />
      <StatusDot palette="cyan" />
      <StatusDot palette="indigo" />
    </div>
  ),
};
