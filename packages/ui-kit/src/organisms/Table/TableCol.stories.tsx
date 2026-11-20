import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableCol } from './TableCol';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { StatusDot, Text } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof TableCol> = {
  title: 'Organisms/Table/TableCol',
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
    <div className={layoutStyles.row}>
      <TableCol gridUnits={10}>
        <TableHeader>
          <Text as="span" variant="mono" weight="semibold" tone="accent">
            [ 01 ]
          </Text>
          <StatusDot palette="blue" size="md" />
          <Text as="span" variant="mono-label" weight="semibold" tone="primary">
            10 Grid Units (320px)
          </Text>
        </TableHeader>
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={layoutStyles.box}>
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
    <div className={layoutStyles.row}>
      <TableCol gridUnits={8}>
        <TableHeader>
          <Text as="span" variant="mono" weight="semibold" tone="accent">
            8
          </Text>
          <StatusDot palette="cyan" size="md" />
          <Text as="span" variant="mono-label" weight="semibold" tone="primary">
            8 Units (256px)
          </Text>
        </TableHeader>
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={layoutStyles.box}>
              <Text as="p" variant="caption">Compact column</Text>
            </div>
          </TableCell>
        </TableBody>
      </TableCol>

      <TableCol gridUnits={10}>
        <TableHeader>
          <Text as="span" variant="mono" weight="semibold" tone="accent">
            10
          </Text>
          <StatusDot palette="emerald" size="md" />
          <Text as="span" variant="mono-label" weight="semibold" tone="primary">
            10 Units (320px)
          </Text>
        </TableHeader>
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={layoutStyles.box}>
              <Text as="p" variant="caption">Standard column</Text>
            </div>
          </TableCell>
        </TableBody>
      </TableCol>

      <TableCol gridUnits={12}>
        <TableHeader>
          <Text as="span" variant="mono" weight="semibold" tone="accent">
            12
          </Text>
          <StatusDot palette="purple" size="md" />
          <Text as="span" variant="mono-label" weight="semibold" tone="primary">
            12 Units (384px)
          </Text>
        </TableHeader>
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={layoutStyles.box}>
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
    <div className={layoutStyles.row}>
      <TableCol gridUnits={10} isDragOver>
        <TableHeader>
          <Text as="span" variant="mono" weight="semibold" tone="accent">
            [ DROP ]
          </Text>
          <StatusDot palette="amber" size="md" />
          <Text as="span" variant="mono-label" weight="semibold" tone="primary">
            Drop Target
          </Text>
        </TableHeader>
        <TableBody padding="sm">
          <TableCell padding="none">
            <div className={layoutStyles.box}>
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
