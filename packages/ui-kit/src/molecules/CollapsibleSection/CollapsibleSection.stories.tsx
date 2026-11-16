import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Info, Settings, SlidersHorizontal } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Badge, Button, Icon, Paragraph } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Molecules/CollapsibleSection',
  component: CollapsibleSection,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <CollapsibleSection
        title="System Diagnostics"
        icon={<Icon icon={Info} size="sm" />}
      >
        <Paragraph size="sm">
          Background processing worker is active. Performance metrics are streamed in real time.
        </Paragraph>
      </CollapsibleSection>
    </div>
  ),
};

export const WithBadgeAccessory: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <CollapsibleSection
        title="Analytical Report"
        icon={<Icon icon={FileText} size="sm" />}
        accessory={<Badge size="sm" tone="success">Ready</Badge>}
      >
        <Paragraph size="sm">
          Full analysis report has been generated and stored in the local database.
        </Paragraph>
      </CollapsibleSection>
    </div>
  ),
};

export const WithButtonAccessory: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <CollapsibleSection
        title="Integration Settings"
        icon={<Icon icon={SlidersHorizontal} size="sm" />}
        accessory={
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label="Settings"
          >
            <Icon icon={Settings} size="sm" />
          </Button>
        }
      >
        <Paragraph size="sm">
          Synchronization intervals and network timeouts are configured.
        </Paragraph>
      </CollapsibleSection>
    </div>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <CollapsibleSection
        title="Activity Log"
        defaultOpen
        expandLabel="Details"
        collapseLabel="Hide"
      >
        <Paragraph size="sm">
          Section is expanded by default. Displays recent session events.
        </Paragraph>
      </CollapsibleSection>
    </div>
  ),
};
