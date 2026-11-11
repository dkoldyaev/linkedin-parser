import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Badge,
  MatchBadge,
  TechChip,
  TagChip,
  StageBadge,
  ClosedBadge,
  SeverityBadge,
  CvSyncBadge,
} from './Badge';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    tone: 'primary',
    size: 'md',
    children: 'Badge Text',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
    },
    children: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const EditableBadge: Story = {
  name: 'Editable Badge (Controls)',
  render: (args) => <Badge {...args} />,
};

export const MatchScoreBadges: StoryObj<typeof MatchBadge> = {
  name: 'Match Score Badges (KanbanCard & VacancyModal)',
  args: {
    score: 65,
    showIcon: true,
  },
  argTypes: {
    score: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    showIcon: {
      control: 'boolean',
    },
  },
  render: (args) => (
    <div className={layoutStyles.row}>
      <MatchBadge score={args.score} showIcon={args.showIcon} />
      <MatchBadge score={92} title="AI Match Score: 92%" />
      <MatchBadge score={65} title="AI Match Score: 65%" />
      <MatchBadge score={38} title="AI Match Score: 38%" />
    </div>
  ),
};

export const TechAndTagChips: Story = {
  name: 'Tech Stack & Tag Chips (KanbanCard)',
  args: {
    children: 'Javascript',
  },
  render: (args) => (
    <div className={layoutStyles.stackSm}>
      <div className={layoutStyles.row}>
        <TechChip>{args.children}</TechChip>
        <TechChip>Typescript</TechChip>
        <TechChip>Php</TechChip>
        <TechChip>Swift</TechChip>
        <TechChip title="React, Node.js, Docker">+3</TechChip>
      </div>
      <div className={layoutStyles.row}>
        <TagChip>{args.children}</TagChip>
        <TagChip>referral</TagChip>
        <TagChip>fintech</TagChip>
      </div>
    </div>
  ),
};

export const StageAndClosedBadges: Story = {
  name: 'Stage (Lane) & Closed Badges (Card Top-Right)',
  args: {
    children: 'Закрыта',
  },
  render: (args) => (
    <div className={layoutStyles.row}>
      <StageBadge stageTone="backlog">Backlog</StageBadge>
      <StageBadge stageTone="applied">Applied</StageBadge>
      <StageBadge stageTone="interview">Interview</StageBadge>
      <StageBadge stageTone="assessment">Test</StageBadge>
      <StageBadge stageTone="offer">Offer</StageBadge>
      <ClosedBadge>{args.children}</ClosedBadge>
    </div>
  ),
};

export const CompatibilitySeverityBadges: Story = {
  name: 'Compatibility Severity Badges (VacancyModal)',
  render: () => (
    <div className={layoutStyles.row}>
      <SeverityBadge severity="critical">Critical</SeverityBadge>
      <SeverityBadge severity="high">High</SeverityBadge>
      <SeverityBadge severity="medium">Medium</SeverityBadge>
      <SeverityBadge severity="low">Low</SeverityBadge>
    </div>
  ),
};

export const CvSyncStatusBadges: Story = {
  name: 'CV Sync Status Badges (CvPage & Header)',
  render: () => (
    <div className={layoutStyles.row}>
      <CvSyncBadge status="approved">CV одобрено</CvSyncBadge>
      <CvSyncBadge status="outdated">Требует пересчёта</CvSyncBadge>
      <CvSyncBadge status="draft">Черновик</CvSyncBadge>
    </div>
  ),
};

export const AllTones: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Badge tone="neutral">Neutral (12)</Badge>
      <Badge tone="primary">Primary</Badge>
      <Badge tone="success">Completed</Badge>
      <Badge tone="warning">Queued</Badge>
      <Badge tone="danger">Failed</Badge>
      <Badge tone="info">Remote</Badge>
    </div>
  ),
};
