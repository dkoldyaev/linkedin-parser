import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardLayout } from './DashboardLayout';
import { VacancyCard, Header } from '../../organisms';
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
      <div className={layoutStyles.grid3}>
        <VacancyCard
          title="Software Engineer — API Integrations & CRM Development"
          company="Unknown"
          sourceUrl="https://linkedin.com/jobs/view/1"
          matchScore={65}
          workplace="remote"
          location="Worldwide"
          salary="USD11 200 / мес"
          summary="Вакансия Software Engineer — API Integrations & CRM Development в Unknown (Worldwide). Ключевой стек: Javascript, Typescript, Php, Swift."
          techStack={['Javascript', 'Typescript', 'Php', 'Swift']}
          date="6 нояб."
          historyCount={2}
        />
        <VacancyCard
          title="Staff Frontend Architect — Design Systems"
          company="Stripe"
          sourceUrl="https://linkedin.com/jobs/view/2"
          matchScore={92}
          workplace="remote"
          location="Remote (EU)"
          salary="USD16 000 / мес"
          summary="Архитектура дизайн-системы и UI-кита на React 19 + TypeScript. Filter: "
          techStack={['React 19', 'Typescript', 'Storybook', 'Playwright']}
          tags={['priority']}
          date="11 нояб."
          historyCount={3}
          hasHistoryComment
        />
      </div>
    </DashboardLayout>
  );
}

export const DefaultWorkspace: Story = {
  render: () => <DashboardDemo />,
};
