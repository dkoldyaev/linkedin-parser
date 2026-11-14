import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Award,
  Ban,
  CheckCircle2,
  Clock,
  FileEdit,
  MapPin,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Badge } from './Badge';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    tone: 'primary',
    variant: 'badge',
    size: 'md',
    children: 'Badge Text',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'success',
        'warning',
        'danger',
        'info',
        'backlog',
        'applied',
        'interview',
        'assessment',
        'offer',
        'rejected',
        'critical',
        'high',
        'medium',
        'low',
      ],
    },
    variant: {
      control: 'select',
      options: ['badge', 'chip', 'ghost', 'match', 'stage', 'severity', 'sync'],
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    children: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  name: 'Interactive Badge (Controls)',
  render: (args) => <Badge {...args} />,
};

export const WithIcons: Story = {
  name: 'Badges with Icons (icon prop)',
  render: () => (
    <div className={layoutStyles.row}>
      <Badge icon={<Sparkles size={12} />} tone="primary">
        AI Generated
      </Badge>
      <Badge icon={<MapPin size={12} />} tone="neutral">
        Berlin, Germany
      </Badge>
      <Badge icon={<Award size={12} />} tone="success">
        Match 92%
      </Badge>
      <Badge icon={<Tag size={12} />} tone="info">
        Full-time
      </Badge>
      <Badge icon={<Ban size={12} />} tone="danger">
        Closed
      </Badge>
    </div>
  ),
};

export const MatchScoreVariants: Story = {
  name: 'Match Score Badges (variant="match")',
  render: () => (
    <div className={layoutStyles.row}>
      <Badge variant="match" tone="high" icon={<Award size={11} aria-hidden />}>
        92%
      </Badge>
      <Badge variant="match" tone="medium" icon={<Award size={11} aria-hidden />}>
        65%
      </Badge>
      <Badge variant="match" tone="low" icon={<Award size={11} aria-hidden />}>
        38%
      </Badge>
    </div>
  ),
};

export const TechAndTagChips: Story = {
  name: 'Tech & Tag Chips (variant="ghost" and variant="chip")',
  render: () => (
    <div className={layoutStyles.stackSm}>
      <div className={layoutStyles.row}>
        <Badge variant="ghost" size="xs">TypeScript</Badge>
        <Badge variant="ghost" size="xs">React 19</Badge>
        <Badge variant="ghost" size="xs">Vite</Badge>
        <Badge variant="ghost" size="xs">Docker</Badge>
        <Badge variant="ghost" size="xs" tone="neutral">+3</Badge>
      </div>
      <div className={layoutStyles.row}>
        <Badge variant="ghost" size="xs" tone="primary" icon={<Tag size={10} aria-hidden />}>
          referral
        </Badge>
        <Badge variant="ghost" size="xs" tone="primary" icon={<Tag size={10} aria-hidden />}>
          fintech
        </Badge>
        <Badge variant="ghost" size="xs" tone="primary" icon={<Tag size={10} aria-hidden />}>
          senior-level
        </Badge>
      </div>
      <div className={layoutStyles.row}>
        <Badge variant="chip" size="sm" tone="primary" onRemove={() => alert('Removed')}>
          Editable Token 1
        </Badge>
        <Badge variant="chip" size="sm" tone="success" onRemove={() => alert('Removed')}>
          Editable Token 2
        </Badge>
      </div>
    </div>
  ),
};

export const StageAndClosedVariants: Story = {
  name: 'Stage (Lane) & Closed Badges (variant="stage")',
  render: () => (
    <div className={layoutStyles.row}>
      <Badge variant="stage" tone="backlog">Backlog</Badge>
      <Badge variant="stage" tone="applied">Applied</Badge>
      <Badge variant="stage" tone="interview">Interview</Badge>
      <Badge variant="stage" tone="assessment">Test</Badge>
      <Badge variant="stage" tone="offer">Offer</Badge>
      <Badge variant="stage" tone="rejected" icon={<Ban size={11} aria-hidden />}>
        Закрыта
      </Badge>
    </div>
  ),
};

export const SeverityVariants: Story = {
  name: 'Compatibility Severity Badges (variant="severity")',
  render: () => (
    <div className={layoutStyles.row}>
      <Badge variant="severity" tone="critical">Critical</Badge>
      <Badge variant="severity" tone="high">High</Badge>
      <Badge variant="severity" tone="medium">Medium</Badge>
      <Badge variant="severity" tone="low">Low</Badge>
    </div>
  ),
};

export const CvSyncStatusVariants: Story = {
  name: 'CV Sync Status Badges (variant="sync")',
  render: () => (
    <div className={layoutStyles.row}>
      <Badge variant="sync" tone="success" icon={<CheckCircle2 size={13} aria-hidden />}>
        CV одобрено
      </Badge>
      <Badge variant="sync" tone="warning" icon={<Clock size={13} aria-hidden />}>
        Требует пересчёта
      </Badge>
      <Badge variant="sync" tone="primary" icon={<FileEdit size={13} aria-hidden />}>
        Черновик
      </Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  name: 'Sizes (size="xs" | "sm" | "md" | "lg")',
  render: () => (
    <div className={layoutStyles.row}>
      <Badge size="xs" tone="primary">XS Badge</Badge>
      <Badge size="sm" tone="primary">SM Badge</Badge>
      <Badge size="md" tone="primary">MD Badge</Badge>
      <Badge size="lg" tone="primary">LG Badge</Badge>
    </div>
  ),
};
