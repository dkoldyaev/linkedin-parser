import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Layers,
  Settings,
  RefreshCw,
  ExternalLink,
  MapPin,
  Laptop,
  Banknote,
  FileText,
  Shield,
  Briefcase,
} from 'lucide-react';
import { ModalHeader } from './ModalHeader';
import { Button, Icon, Badge } from '../../atoms';
import { Tabs } from '../../molecules/Tabs';
import styles from './ModalStory.module.css';

const meta: Meta<typeof ModalHeader> = {
  title: 'Organisms/ModalHeader',
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
    <div className={styles.container}>
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
    <div className={styles.container}>
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
      <div className={styles.containerWide}>
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
              <Badge tone="neutral" icon={<Icon icon={MapPin} size="xs" />}>
                Berlin, Germany
              </Badge>
              <Badge tone="info" icon={<Icon icon={Laptop} size="xs" />}>
                Remote
              </Badge>
              <Badge tone="success" icon={<Icon icon={Banknote} size="xs" />}>
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
    <div className={styles.container}>
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
    <div className={styles.container}>
      <ModalHeader
        title="Confirm Permanent Deletion"
        onClose={() => alert('Close clicked')}
      />
    </div>
  ),
};
