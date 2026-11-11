import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Button } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Tooltip> = {
  title: 'Molecules/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Tooltip content="Triggers background LLM adaptation task via Mercure SSE">
        <Button variant="primary">Hover or Focus for Blueprint Tooltip</Button>
      </Tooltip>
    </div>
  ),
};
