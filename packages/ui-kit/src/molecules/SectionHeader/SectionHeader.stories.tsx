import { Badge, Button, Icon } from '../../atoms';
import {
  Banknote,
  Check,
  Edit3,
  History,
  Plus,
  RefreshCw,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { SectionHeader } from './SectionHeader';

const meta: Meta<typeof SectionHeader> = {
  title: 'Molecules/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const TechStackAddAccessory: Story = {
  args: {
    title: 'Tech Stack',
    accessory: (
      <Button size="icon-sm" variant="secondary" aria-label="Add technology">
        <Icon icon={Plus} size="sm" />
      </Button>
    ),
  },
};

export const AiSummaryWithReanalyze: Story = {
  args: {
    title: 'AI Summary',
    icon: <Icon icon={Sparkles} size="sm" tone="success" />,
    accessory: (
      <Button size="sm" variant="secondary" startIcon={<Icon icon={RefreshCw} size="xs" />}>
        Re-analyze
      </Button>
    ),
  },
};

export const HistoryWithCounter: Story = {
  args: {
    title: 'Stage History',
    icon: <Icon icon={History} size="sm" tone="accent" />,
    badge: (
      <Badge size="sm" tone="info">
        3 stages
      </Badge>
    ),
  },
};

export const SalaryWithEditAction: Story = {
  args: {
    title: 'Compensation Range',
    icon: <Icon icon={Banknote} size="sm" tone="success" />,
    badge: (
      <Badge size="sm" tone="success">
        €95 000 – €110 000 / yr
      </Badge>
    ),
    accessory: (
      <Button size="sm" variant="secondary" startIcon={<Icon icon={Edit3} size="xs" />}>
        Edit
      </Button>
    ),
  },
};

export const NotesWithSaveAction: Story = {
  args: {
    title: 'Personal Notes',
    icon: <Icon icon={StickyNote} size="sm" tone="muted" />,
    accessory: (
      <Button size="sm" variant="secondary" startIcon={<Icon icon={Check} size="xs" />}>
        Save
      </Button>
    ),
  },
};

export const SemanticTonesAndDividers: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <SectionHeader title="MATCHES [3]" variant="mono" tone="mint" divider />
      <SectionHeader title="GAPS [2]" variant="mono" tone="warning" divider />
      <SectionHeader title="CRITICAL BLOCKERS [1]" variant="mono" tone="danger" divider />
      <SectionHeader title="ACCENT SECTION" variant="mono" tone="accent" divider />
      <SectionHeader title="MUTED SECTION" variant="mono" tone="muted" divider />
    </div>
  ),
};
