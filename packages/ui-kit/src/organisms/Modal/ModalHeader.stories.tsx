import { Badge, Button, Icon } from '../../atoms';
import {
  Banknote,
  Briefcase,
  ExternalLink,
  FileText,
  Laptop,
  Layers,
  MapPin,
  RefreshCw,
  Settings,
  Shield,
} from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { ModalHeader } from './ModalHeader';
import { Tabs } from '../../molecules/Tabs';

const meta: Meta<typeof ModalHeader> = {
  title: 'Organisms/Modal/ModalHeader',
  component: ModalHeader,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    hideCloseButton: { control: 'boolean' },
    closeLabel: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ModalHeader>;

export const Basic: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <ModalHeader
        title="Create Pipeline Column"
        description="Add a new stage to your candidate Kanban board."
        onClose={() => alert('Close clicked')}
      />
    </div>
  ),
};

export const WithIconAndActions: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <ModalHeader
        title="Sync Configuration"
        description="Mercure SSE real-time stream status and poll frequency."
        icon={<Icon icon={Settings} size="md" tone="accent" />}
        actions={
          <Button variant="ghost" size="sm" onClick={() => alert('Syncing...')}>
            <Icon icon={RefreshCw} size="sm" />
            <span>Sync</span>
          </Button>
        }
        onClose={() => alert('Close clicked')}
      />
    </div>
  ),
};

export const CompoundWithTabsAndBadges: Story = {
  render: () => {
    return (
      <div className={layoutStyles.panel}>
        <ModalHeader
          title="Senior Frontend Platform Engineer"
          description="Linear • Berlin, Germany"
          icon={<Icon icon={Briefcase} size="md" tone="accent" />}
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => alert('Reparse')}>
                <Icon icon={RefreshCw} size="sm" />
                <span>Reparse</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => alert('Open LinkedIn')}>
                <Icon icon={ExternalLink} size="sm" />
                <span>LinkedIn</span>
              </Button>
            </>
          }
          onClose={() => alert('Close clicked')}
          meta={
            <>
              <Badge tone="neutral" size="xs" icon={<Icon icon={MapPin} size="xs" />}>
                Berlin, Germany
              </Badge>
              <Badge tone="info" size="xs" icon={<Icon icon={Laptop} size="xs" />}>
                Remote
              </Badge>
              <Badge tone="success" size="xs" icon={<Icon icon={Banknote} size="xs" />}>
                €85,000 – €110,000 / yr
              </Badge>
            </>
          }
          tabs={
            <Tabs
              defaultValue="details"
              items={[
                {
                  value: 'details',
                  label: 'Details',
                  icon: <Icon icon={FileText} size="sm" />,
                },
                {
                  value: 'compatibility',
                  label: 'Compatibility 88%',
                  icon: <Icon icon={Shield} size="sm" />,
                },
              ]}
            />
          }
        />
      </div>
    );
  },
};

export const WithoutCloseButton: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <ModalHeader
        title="Step 2 of 3: Account Verification"
        description="Please complete verification before continuing."
        icon={<Icon icon={Layers} size="md" tone="accent" />}
        hideCloseButton
      />
    </div>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <ModalHeader title="Confirm Permanent Deletion" onClose={() => alert('Close clicked')} />
    </div>
  ),
};
