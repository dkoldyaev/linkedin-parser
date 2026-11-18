import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardCollapsedLoading } from './CardCollapsedLoading';
import { CardFullLoading } from './CardFullLoading';
import { Text } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta = {
  title: 'Organisms/Card/CardLoading',
  tags: ['autodocs'],
};

export default meta;

export const FullLoading: StoryObj<typeof CardFullLoading> = {
  render: () => (
    <div className={layoutStyles.narrowBox}>
      <CardFullLoading accentTone="accent" />
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
        <CardCollapsedLoading accentTone="success" />
      </div>
      <div className={layoutStyles.narrowBox}>
        <CardCollapsedLoading accentTone="warning" />
      </div>
      <div className={layoutStyles.narrowBox}>
        <CardCollapsedLoading accentTone="danger" />
      </div>
    </div>
  ),
};

