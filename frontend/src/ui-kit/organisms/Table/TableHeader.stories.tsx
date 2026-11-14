import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical, Plus } from 'lucide-react';
import { TableHeader } from './TableHeader';
import { Text } from '../../atoms';
import styles from './TableStory.module.css';

const meta: Meta<typeof TableHeader> = {
  title: 'Organisms/TableHeader',
  component: TableHeader,
  tags: ['autodocs'],
  argTypes: {
    index: { control: 'text' },
    indicatorColor: { control: 'text' },
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
    <div className={styles.storyWrapperSmall}>
      <TableHeader
        index="[ 01 ]"
        indicatorColor="blue"
        title="Не связывались"
        badge="[4]"
        actions={
          <button type="button" className={styles.colActionsBtn} aria-label="More actions">
            <MoreVertical size={14} />
          </button>
        }
      />
    </div>
  ),
};

export const SizeMedium: Story = {
  render: () => (
    <div className={styles.storyWrapperMedium}>
      <TableHeader
        size="md"
        index="STAGE 03"
        indicatorColor="emerald"
        title="Техническое интервью"
        badge="[12 кандидатов]"
        actions={
          <button type="button" className={styles.colActionsBtn} aria-label="Add candidate">
            <Plus size={16} />
          </button>
        }
      />
    </div>
  ),
};

export const CustomChildren: Story = {
  render: () => (
    <div className={styles.storyWrapperMedium}>
      <TableHeader size="md">
        <div className={styles.cellId}>
          <Text as="span" variant="mono" tone="accent">
            REF
          </Text>
        </div>
        <div className={styles.cellTitle}>
          <Text as="span" variant="mono" tone="primary">
            POSITION TITLE
          </Text>
        </div>
        <div className={styles.cellStatus}>
          <Text as="span" variant="mono" tone="secondary">
            STATUS
          </Text>
        </div>
      </TableHeader>
    </div>
  ),
};
