import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical, Inbox } from 'lucide-react';
import { Table, TableCol, TableHeader, TableBody, TableCell, TableRow, TableFooter } from './Table';
import { Button, Badge, Icon, Text } from '../../atoms';
import { EmptyState } from '../../molecules';
import { Card } from '../Card';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Table> = {
  title: 'Organisms/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: 'radio',
      options: ['columns', 'rows'],
    },
    snapScroll: {
      control: 'boolean',
    },
    bordered: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const KanbanColumnsLayout: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <Table layout="columns" snapScroll bordered>
        <TableCol gridUnits={10}>
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
              2
            </Badge>
          </TableHeader>
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <Card title="Senior Frontend Engineer" subtitle="Datadog • Paris" matchScore={84} />
            </TableCell>
            <TableCell padding="none">
              <Card title="Full Stack Developer" subtitle="Supabase • Remote" matchScore={72} />
            </TableCell>
          </TableBody>
        </TableCol>

        <TableCol gridUnits={10}>
          <TableHeader
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="More actions">
                <Icon icon={MoreVertical} size="sm" />
              </Button>
            }
          >
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 02 ]
            </Text>
            <StatusDot palette="cyan" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
              Applied
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              1
            </Badge>
          </TableHeader>
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <Card title="Staff UI Architect" subtitle="Stripe • Remote" matchScore={91} />
            </TableCell>
          </TableBody>
        </TableCol>

        <TableCol gridUnits={10}>
          <TableHeader
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="More actions">
                <Icon icon={MoreVertical} size="sm" />
              </Button>
            }
          >
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 03 ]
            </Text>
            <StatusDot palette="amber" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
              Screening
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              0
            </Badge>
          </TableHeader>
          <TableBody
            scrollable
            snapScroll
            padding="sm"
            emptyState={
              <EmptyState
                icon={<Icon icon={Inbox} size="md" tone="muted" />}
                title="Empty Stage"
                description="No items in this column yet."
              />
            }
          />
        </TableCol>
      </Table>
    </div>
  ),
};

export const FlexRowsLayout: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Table layout="rows" bordered>
        <TableHeader size="md">
          <Text as="span" variant="mono" tone="accent">
            ID
          </Text>
          <Text as="span" variant="mono" tone="primary">
            ENTITY TITLE
          </Text>
          <Text as="span" variant="mono" tone="secondary">
            STAGE
          </Text>
        </TableHeader>
        <TableBody padding="none">
          <TableRow interactive bordered>
            <TableCell padding="md">
              <Text variant="mono">ENT-101</Text>
            </TableCell>
            <TableCell padding="md">
              <Text variant="body-sm">Principal Design Systems Engineer</Text>
            </TableCell>
            <TableCell padding="md">
              <Badge tone="info" size="sm">Screening</Badge>
            </TableCell>
          </TableRow>
          <TableRow interactive bordered>
            <TableCell padding="md">
              <Text variant="mono">ENT-102</Text>
            </TableCell>
            <TableCell padding="md">
              <Text variant="body-sm">Senior React Platform Engineer</Text>
            </TableCell>
            <TableCell padding="md">
              <Badge tone="success" size="sm">Offer</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter justify="between">
          <Text as="span" variant="caption" tone="secondary">
            Showing 2 active records
          </Text>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </TableFooter>
      </Table>
    </div>
  ),
};
