import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageLayout } from './PageLayout';
import { Card, Header } from '../../organisms';
import { AlertBanner } from '../../molecules';
import { Button, Text } from '../../atoms';

const meta: Meta<typeof PageLayout> = {
  title: 'Layouts/PageLayout',
  component: PageLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof PageLayout>;

export const DefaultBlueprintPage: Story = {
  render: () => (
    <PageLayout
      header={
        <Header
          title="BLUEPRINT.UI"
          subtitle="PAGE LAYOUT"
          showThemeToggle
          user={{ name: 'Alex Morgan' }}
          actions={<Button size="sm" variant="primary">Dashboard</Button>}
        />
      }
      banner={
        <AlertBanner tone="info" title="System Maintenance Notice">
          Scheduled worker index optimization at 02:00 UTC.
        </AlertBanner>
      }
      footer={
        <Text variant="mono" tone="muted">
          BLUEPRINT.UI // 32PX ARCHITECTURE GRID
        </Text>
      }
    >
      <Card
        title="Application Workspace Overview"
        subtitle="Universal layout container with zero domain coupling."
      >
        <Text as="p" variant="body">
          This PageLayout provides the 32px Blueprint drafting grid, semantic header/main/footer landmarks, and optional system banner slot.
        </Text>
      </Card>
    </PageLayout>
  ),
};
