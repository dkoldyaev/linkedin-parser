import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical, Plus } from 'lucide-react';
import { TableHeader } from './TableHeader';
import { Badge, Button, Icon, StatusDot, Text } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof TableHeader> = {
  title: 'Organisms/Table/TableHeader',
  component: TableHeader,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableHeader>;

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.narrowBox}>
      <TableHeader
        actions={
          <Button variant="ghost" size="icon-sm" aria-label="More actions">
            <Icon icon={MoreVertical} size="sm" />
          </Button>
        }
      >
        <Text as="span" variant="mono" weight="semibold" tone="accent">
          [ 01 ]
        </Text>
        <StatusDot palette="blue" size="md" />
        <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
          Backlog
        </Text>
        <Badge variant="counter" size="xs" tone="neutral">
          4
        </Badge>
      </TableHeader>
    </div>
  ),
};

export const SizeMedium: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <TableHeader
        size="md"
        actions={
          <Button variant="ghost" size="icon-sm" aria-label="Add candidate">
            <Icon icon={Plus} size="sm" />
          </Button>
        }
      >
        <Text as="span" variant="mono" weight="semibold" tone="accent">
          STAGE 03
        </Text>
        <StatusDot palette="emerald" size="md" />
        <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
          Техническое интервью
        </Text>
        <Badge variant="counter" size="xs" tone="neutral">
          12 кандидатов
        </Badge>
      </TableHeader>
    </div>
  ),
};

export const CustomChildren: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <TableHeader size="md">
        <Text as="span" variant="mono" tone="accent">
          REF
        </Text>
        <Text as="span" variant="mono" tone="primary">
          POSITION TITLE
        </Text>
        <Text as="span" variant="mono" tone="secondary">
          STATUS
        </Text>
      </TableHeader>
    </div>
  ),
};
