import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardLayout } from './DashboardLayout';
import { Card, Header } from '../../organisms';
import { SearchBar } from '../../molecules';
import { Badge, Button, Text } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof DashboardLayout> = {
  title: 'Templates/DashboardLayout',
  component: DashboardLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DashboardLayout>;

function DashboardDemo(): React.ReactElement {
  const [search, setSearch] = useState('');
  return (
    <DashboardLayout
      header={
        <Header
          title="CV.ALTER WORKSPACE"
          versionBadge="v2.0"
          statusLabel="MERCURE SSE ACTIVE"
          statusPulse
        />
      }
      toolbar={
        <>
          <div className={layoutStyles.narrowBox}>
            <SearchBar
              value={search}
              onValueChange={setSearch}
              placeholder="Search vacancies..."
              aria-label="Search vacancies"
            />
          </div>
          <Button size="sm" variant="primary">
            + New Column
          </Button>
        </>
      }
      sidebar={
        <div className={layoutStyles.stack}>
          <Text variant="mono-label" tone="secondary">
            Pipeline Stages
          </Text>
          <Badge tone="primary">Applied (14)</Badge>
          <Badge tone="success">Interview (5)</Badge>
          <Badge tone="warning">Offer (2)</Badge>
        </div>
      }
    >
      <Card
        title="Kanban Workspace Zone"
        subtitle="Multi-pane Blueprint workspace layout with header, toolbar, sidebar, and main canvas."
      >
        <Text as="p" variant="body">
          Filter query: {search.length > 0 ? search : '(none)'}
        </Text>
      </Card>
    </DashboardLayout>
  );
}

export const DefaultWorkspace: Story = {
  render: () => <DashboardDemo />,
};
