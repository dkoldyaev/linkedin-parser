import { Badge, StatusDot, Text } from '../../atoms';
import { Card, Header, Table, TableBody, TableCell, TableCol, TableHeader } from '../../organisms';
import { FilterBar, SearchBar } from '../../molecules';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';

const meta: Meta<typeof DashboardLayout> = {
  title: 'Layouts/DashboardLayout',
  component: DashboardLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DashboardLayout>;

function UniversalDashboardDemo(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');

  return (
    <DashboardLayout
      header={
        <Header
          title="BLUEPRINT.UI"
          subtitle="WORKSPACE SHELL"
          search={
            <SearchBar
              value={search}
              onValueChange={setSearch}
              placeholder="Search items..."
              aria-label="Search workspace"
              expandOnFocus
            />
          }
          showThemeToggle
          user={{ name: 'Alex Morgan' }}
        />
      }
      filterBar={
        <FilterBar
          selects={[
            {
              id: 'region',
              value: region,
              onChange: setRegion,
              options: [
                { value: '', label: 'All Regions' },
                { value: 'eu', label: 'Europe' },
                { value: 'us', label: 'North America' },
              ],
            },
          ]}
          tags={[
            { label: 'Core', count: 8 },
            { label: 'Infrastructure', count: 4 },
          ]}
          onReset={() => setRegion('')}
        />
      }
    >
      <Table layout="columns" snapScroll fullHeight>
        <TableCol gridUnits={10}>
          <TableHeader>
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 01 ]
            </Text>
            <StatusDot tone="primary" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary">
              Queued
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              2
            </Badge>
          </TableHeader>
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <Card title="Design Tokens Audit" subtitle="Core System" tone="accent" />
            </TableCell>
            <TableCell padding="none">
              <Card
                title="Accessibility Verification"
                subtitle="QA Pipeline"
                tone="success"
              />
            </TableCell>
          </TableBody>
        </TableCol>
        <TableCol gridUnits={10}>
          <TableHeader>
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 02 ]
            </Text>
            <StatusDot tone="success" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary">
              Completed
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              1
            </Badge>
          </TableHeader>
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <Card
                title="Standalone Package Build"
                subtitle="@blueprint/ui-kit"
                tone="success"
                footer={
                  <Text variant="caption" tone="muted">
                    Verified
                  </Text>
                }
              />
            </TableCell>
          </TableBody>
        </TableCol>
      </Table>
    </DashboardLayout>
  );
}

export const DefaultWorkspace: Story = {
  render: () => <UniversalDashboardDemo />,
};
