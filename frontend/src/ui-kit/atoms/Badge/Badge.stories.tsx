import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const AllTones: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Badge tone="neutral">Neutral (12)</Badge>
      <Badge tone="primary">Primary</Badge>
      <Badge tone="success">Completed</Badge>
      <Badge tone="warning">Queued</Badge>
      <Badge tone="danger">Failed</Badge>
      <Badge tone="info">Remote</Badge>
    </div>
  ),
};

export const RemovableTokens: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Badge tone="primary" onRemove={() => undefined}>
        TypeScript
      </Badge>
      <Badge tone="success" onRemove={() => undefined}>
        React 19
      </Badge>
      <Badge tone="neutral" size="sm">
        Small Badge
      </Badge>
    </div>
  ),
};
