import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableCol } from './TableCol';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { Text } from '../../atoms';
import styles from './TableStory.module.css';

const meta: Meta<typeof TableCol> = {
  title: 'Organisms/TableCol',
  component: TableCol,
  tags: ['autodocs'],
  argTypes: {
    gridUnits: {
      control: 'radio',
      options: [6, 8, 10, 12, 14, 16],
    },
    fluid: { control: 'boolean' },
    isDragOver: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TableCol>;

export const DefaultGridUnits10: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <TableCol gridUnits={10}>
        <TableHeader index="[ 01 ]" indicatorColor="blue" title="10 Grid Units (320px)" />
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={styles.sampleCard}>
              <Text as="p" variant="caption">
                Standard Kanban Column width snapped to 10 × 32px cells.
              </Text>
            </div>
          </TableCell>
        </TableBody>
      </TableCol>
    </div>
  ),
};

export const WidthVariants: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <TableCol gridUnits={8}>
        <TableHeader index="8" indicatorColor="cyan" title="8 Units (256px)" />
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={styles.sampleCard}>
              <Text as="p" variant="caption">Compact column</Text>
            </div>
          </TableCell>
        </TableBody>
      </TableCol>

      <TableCol gridUnits={10}>
        <TableHeader index="10" indicatorColor="emerald" title="10 Units (320px)" />
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={styles.sampleCard}>
              <Text as="p" variant="caption">Standard column</Text>
            </div>
          </TableCell>
        </TableBody>
      </TableCol>

      <TableCol gridUnits={12}>
        <TableHeader index="12" indicatorColor="purple" title="12 Units (384px)" />
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={styles.sampleCard}>
              <Text as="p" variant="caption">Wide column</Text>
            </div>
          </TableCell>
        </TableBody>
      </TableCol>
    </div>
  ),
};

export const DragOverActiveDropzone: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <TableCol gridUnits={10} isDragOver>
        <TableHeader index="[ DROP ]" indicatorColor="amber" title="Drop Target" />
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={styles.sampleCard}>
              <Text as="p" variant="caption">
                Highlighted dropzone when dragging candidate cards over this column.
              </Text>
            </div>
          </TableCell>
        </TableBody>
      </TableCol>
    </div>
  ),
};
