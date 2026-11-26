import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Variants: Story = {
  render: () => (
    <div className={layoutStyles.stackSm}>
      <Skeleton variant="text" width="60" />
      <Skeleton variant="text" width="100" />
      <div className={layoutStyles.row}>
        <Skeleton variant="circle" height="xl" className={layoutStyles.gridLabelRow} />
        <Skeleton variant="chip" width="25" />
        <Skeleton variant="chip" width="25" />
      </div>
      <Skeleton variant="rect" width="100" height="xl" />
    </div>
  ),
};
