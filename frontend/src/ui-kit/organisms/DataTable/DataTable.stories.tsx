import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTable, type DataTableColumn } from './DataTable';
import { Badge, Button, Text } from '../../atoms';

interface QueueRow {
  readonly id: string;
  readonly jobTitle: string;
  readonly company: string;
  readonly status: 'processing' | 'queued' | 'failed';
  readonly attempts: number;
}

const SAMPLE_ROWS: readonly QueueRow[] = [
  {
    id: 'TASK-101',
    jobTitle: 'Principal Design Systems Engineer',
    company: 'Linear',
    status: 'processing',
    attempts: 1,
  },
  {
    id: 'TASK-102',
    jobTitle: 'Senior React Platform Engineer',
    company: 'Vercel',
    status: 'queued',
    attempts: 0,
  },
  {
    id: 'TASK-103',
    jobTitle: 'Staff UI Engineer',
    company: 'Figma',
    status: 'failed',
    attempts: 3,
  },
];

const COLUMNS: readonly DataTableColumn<QueueRow>[] = [
  {
    id: 'id',
    header: 'Task ID',
    accessor: 'id',
    sortable: true,
    gridUnits: 5,
    cell: (row) => <Text variant="mono">{row.id}</Text>,
  },
  {
    id: 'jobTitle',
    header: 'Vacancy Title',
    accessor: 'jobTitle',
    sortable: true,
    gridUnits: 13,
  },
  {
    id: 'company',
    header: 'Company',
    accessor: 'company',
    sortable: true,
    gridUnits: 8,
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    gridUnits: 6,
    sortValue: (row) => row.status,
    cell: (row) => (
      <Badge
        size="sm"
        tone={
          row.status === 'processing'
            ? 'primary'
            : row.status === 'queued'
              ? 'warning'
              : 'danger'
        }
      >
        {row.status}
      </Badge>
    ),
  },
  {
    id: 'attempts',
    header: 'Retries',
    accessor: 'attempts',
    sortable: true,
    gridUnits: 6,
    align: 'right',
  },
];

const meta: Meta<typeof DataTable<QueueRow>> = {
  title: 'Organisms/DataTable',
  component: DataTable,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable<QueueRow>>;

export const SortableQueueTable: Story = {
  render: () => (
    <DataTable
      columns={COLUMNS}
      data={SAMPLE_ROWS}
      getRowId={(row) => row.id}
      caption="Active queue tasks"
    />
  ),
};

export const LoadingTable: Story = {
  render: () => (
    <DataTable
      columns={COLUMNS}
      data={[]}
      getRowId={(row) => row.id}
      loading
      loadingLabel="Synchronizing worker queue..."
    />
  ),
};

export const EmptyTable: Story = {
  render: () => (
    <DataTable
      columns={COLUMNS}
      data={[]}
      getRowId={(row) => row.id}
      emptyTitle="Queue is Empty"
      emptyDescription="All background parsing and LLM adaptation tasks have finished."
      emptyAction={<Button variant="primary">Refresh Queue</Button>}
    />
  ),
};
