import { Badge, Icon } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Tag } from 'lucide-react';
import { TokenList } from './TokenList';

const meta: Meta<typeof TokenList> = {
  title: 'Molecules/TokenList',
  component: TokenList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TokenList>;

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.container}>
      <TokenList>
        <Badge variant="chip" size="sm" tone="info">
          TypeScript
        </Badge>
        <Badge variant="chip" size="sm" tone="accent">
          React
        </Badge>
        <Badge variant="chip" size="sm" tone="success">
          Node.js
        </Badge>
        <Badge variant="chip" size="sm" tone="neutral">
          Docker
        </Badge>
      </TokenList>
    </div>
  ),
};

export const TagsWithRemove: Story = {
  render: () => (
    <div className={layoutStyles.container}>
      <TokenList>
        <Badge
          variant="outline"
          size="xs"
          tone="neutral"
          icon={<Icon icon={Tag} size="2xs" />}
          onRemove={() => alert('Remove fintech')}
        >
          fintech
        </Badge>
        <Badge
          variant="outline"
          size="xs"
          tone="neutral"
          icon={<Icon icon={Tag} size="2xs" />}
          onRemove={() => alert('Remove remote')}
        >
          remote
        </Badge>
        <Badge
          variant="outline"
          size="xs"
          tone="neutral"
          icon={<Icon icon={Tag} size="2xs" />}
          onRemove={() => alert('Remove b2b')}
        >
          b2b
        </Badge>
      </TokenList>
    </div>
  ),
};
