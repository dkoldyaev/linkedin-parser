import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageLayout } from './PageLayout';
import { Card, Header } from '../../organisms';
import { AlertBanner } from '../../molecules';
import { Button, Text } from '../../atoms';

const meta: Meta<typeof PageLayout> = {
  title: 'Templates/PageLayout',
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
          title="CV.ALTER"
          subtitle="BLUEPRINT ARCHITECTURE"
          showThemeToggle
          user={{ name: 'Denis Koldyaev' }}
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
          CV.ALTER // 32PX BLUEPRINT ARCHITECTURE GRID
        </Text>
      }
    >
      <Card
        title="Vacancy Analytics Overview"
        subtitle="Pure template layout without hardcoded API or routing dependencies."
      >
        <Text as="p" variant="body">
          This PageLayout template provides the 32px Blueprint drafting grid, semantic header/main/footer landmarks, and optional system banner slot.
        </Text>
      </Card>
    </PageLayout>
  ),
};
