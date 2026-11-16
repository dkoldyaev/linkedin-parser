import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableCell } from './TableCell';
import { TableCol } from './TableCol';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { Text, Badge } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof TableCell> = {
  title: 'Organisms/Table/TableCell',
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
    <div className={layoutStyles.narrowBox}>
      <TableCol gridUnits={12}>
        <TableHeader title="Cell Padding Variants" />
        <TableBody padding="none">
          <TableCell padding="none">
            <div className={layoutStyles.box}>
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
    <div className={layoutStyles.narrowBox}>
      <TableCol gridUnits={12}>
        <TableHeader title="Clickable Table Cells" />
        <TableBody padding="none">
          <TableCell interactive bordered onClick={() => alert('Cell 1 clicked')}>
            <Text as="span" variant="body">
              Clickable candidate row 1
            </Text>
            <Badge tone="success" size="sm">Active</Badge>
          </TableCell>
          <TableCell interactive bordered onClick={() => alert('Cell 2 clicked')}>
            <Text as="span" variant="body">
              Clickable candidate row 2
            </Text>
            <Badge tone="warning" size="sm">Pending</Badge>
          </TableCell>
        </TableBody>
      </TableCol>
    </div>
  ),
};
