import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableCell } from './TableCell';
import { TableCol } from './TableCol';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { Text, Badge } from '../../atoms';
import styles from './TableStory.module.css';

const meta: Meta<typeof TableCell> = {
  title: 'Organisms/TableCell',
  component: TableCell,
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'radio',
      options: ['none', 'sm', 'md'],
    },
    bordered: { control: 'boolean' },
    interactive: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TableCell>;

export const Default: Story = {
  render: () => (
    <div className={styles.storyWrapperSmall}>
      <TableCol gridUnits={12}>
        <TableHeader title="Cell Padding Variants" />
        <TableBody padding="none">
          <TableCell padding="none">
            <div className={styles.sampleCard}>
              <Text as="p" variant="caption">padding=&quot;none&quot; (direct edge-to-edge card container)</Text>
            </div>
          </TableCell>
          <TableCell padding="sm" bordered>
            <Text as="p" variant="caption">padding=&quot;sm&quot; (8px vertical / horizontal)</Text>
          </TableCell>
          <TableCell padding="md" bordered>
            <Text as="p" variant="caption">padding=&quot;md&quot; (12px vertical / horizontal)</Text>
          </TableCell>
        </TableBody>
      </TableCol>
    </div>
  ),
};

export const InteractiveCells: Story = {
  render: () => (
    <div className={styles.storyWrapperSmall}>
      <TableCol gridUnits={12}>
        <TableHeader title="Clickable Table Cells" />
        <TableBody padding="none">
          <TableCell interactive bordered onClick={() => alert('Cell 1 clicked')}>
            <Text as="span" variant="body">
              Clickable candidate row 1
            </Text>
            <Badge tone="success">Active</Badge>
          </TableCell>
          <TableCell interactive bordered onClick={() => alert('Cell 2 clicked')}>
            <Text as="span" variant="body">
              Clickable candidate row 2
            </Text>
            <Badge tone="warning">Pending</Badge>
          </TableCell>
        </TableBody>
      </TableCol>
    </div>
  ),
};
