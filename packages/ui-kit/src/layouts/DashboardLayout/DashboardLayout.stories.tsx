import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardLayout } from './DashboardLayout';
import { Card, Header, Table, TableBody, TableCell, TableCol, TableHeader } from '../../organisms';
import { FilterBar, SearchBar } from '../../molecules';
import { Text } from '../../atoms';

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
          <TableHeader index="[ 01 ]" indicatorColor="blue" title="Queued" badge="2" />
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <Card title="Design Tokens Audit" subtitle="Core System" accentTone="accent" />
            </TableCell>
            <TableCell padding="none">
              <Card title="Accessibility Verification" subtitle="QA Pipeline" accentTone="success" />
            </TableCell>
          </TableBody>
        </TableCol>
        <TableCol gridUnits={10}>
          <TableHeader index="[ 02 ]" indicatorColor="emerald" title="Completed" badge="1" />
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <Card
                title="Standalone Package Build"
                subtitle="@blueprint/ui-kit"
                accentTone="success"
                footer={<Text variant="caption" tone="muted">Verified</Text>}
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
