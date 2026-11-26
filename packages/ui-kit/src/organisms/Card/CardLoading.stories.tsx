import { CardCollapsedLoading, CardFullLoading } from './index';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta = {
  title: 'Organisms/Card/CardLoading',
  tags: ['autodocs'],
};

export default meta;

export const FullLoading: StoryObj<typeof CardFullLoading> = {
  render: () => (
    <div className={layoutStyles.narrowBox}>
      <CardFullLoading tone="accent" />
    </div>
  ),
};

export const CollapsedLoading: StoryObj<typeof CardCollapsedLoading> = {
  render: () => (
    <div className={layoutStyles.stackSm}>
      <div className={layoutStyles.narrowBox}>
        <Text variant="caption" tone="muted">
          Collapsed Skeleton (32px single cell)
        </Text>
        <CardCollapsedLoading tone="success" />
      </div>
      <div className={layoutStyles.narrowBox}>
        <CardCollapsedLoading tone="warning" />
      </div>
      <div className={layoutStyles.narrowBox}>
        <CardCollapsedLoading tone="danger" />
      </div>
    </div>
  ),
};
