import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical, Plus } from 'lucide-react';
import { TableHeader } from './TableHeader';
import { Button, Icon, Text } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof TableHeader> = {
  title: 'Organisms/Table/TableHeader',
  component: TableHeader,
  tags: ['autodocs'],
  argTypes: {
    index: { control: 'text' },
    indicatorColor: {
      control: 'select',
      options: ['blue', 'emerald', 'amber', 'rose', 'cyan', 'indigo', 'purple', 'slate'],
    },
    title: { control: 'text' },
    badge: { control: 'text' },
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
        index="[ 01 ]"
        indicatorColor="blue"
        title="Backlog"
        badge="4"
        actions={
          <Button variant="ghost" size="icon-sm" aria-label="More actions">
            <Icon icon={MoreVertical} size="sm" />
          </Button>
        }
      />
    </div>
  ),
};

export const SizeMedium: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <TableHeader
        size="md"
        index="STAGE 03"
        indicatorColor="emerald"
        title="Техническое интервью"
        badge="12 кандидатов"
        actions={
          <Button variant="ghost" size="icon-sm" aria-label="Add candidate">
            <Icon icon={Plus} size="sm" />
          </Button>
        }
      />
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
