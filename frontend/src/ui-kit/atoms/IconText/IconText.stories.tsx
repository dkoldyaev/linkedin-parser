import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar, Flame, Globe, Sparkles } from 'lucide-react';
import {
  IconText,
  WorkplaceText,
  LocationText,
  SalaryText,
  CompanyLink,
  HistoryText,
  AiPendingText,
  type WorkplaceType,
} from './IconText';
import { MatchBadge } from '../Badge';
import layoutStyles from '../../stories/StoryLayout.module.css';

interface EditableIconTextStoryArgs {
  readonly company: string;
  readonly sourceUrl: string;
  readonly matchScore: number;
  readonly workplace: WorkplaceType;
  readonly location: string;
  readonly salary: string;
  readonly historyCount: number;
  readonly hasComment: boolean;
}

const meta: Meta<EditableIconTextStoryArgs> = {
  title: 'Atoms/IconText',
  tags: ['autodocs'],
  args: {
    company: 'Unknown',
    sourceUrl: 'https://linkedin.com/jobs/view/1',
    matchScore: 65,
    workplace: 'remote',
    location: 'Worldwide',
    salary: 'USD11 200 / мес',
    historyCount: 2,
    hasComment: false,
  },
  argTypes: {
    company: { control: 'text' },
    sourceUrl: { control: 'text' },
    matchScore: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    workplace: {
      control: 'inline-radio',
      options: ['remote', 'hybrid', 'onsite'],
    },
    location: { control: 'text' },
    salary: { control: 'text' },
    historyCount: { control: { type: 'number', min: 0, max: 50, step: 1 } },
    hasComment: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<EditableIconTextStoryArgs>;

export const VacancyCardMetaElements: Story = {
  name: 'Vacancy Card Meta Row Elements (Editable via Controls)',
  render: (args) => (
    <div className={layoutStyles.stackSm}>
      <div className={layoutStyles.row}>
        <CompanyLink company={args.company} href={args.sourceUrl} />
      </div>
      <div className={layoutStyles.row}>
        <MatchBadge score={args.matchScore} />
        <WorkplaceText workplace={args.workplace} />
        <LocationText>{args.location}</LocationText>
      </div>
      <div className={layoutStyles.row}>
        <SalaryText>{args.salary}</SalaryText>
      </div>
      <div className={layoutStyles.row}>
        <HistoryText count={args.historyCount} hasComment={args.hasComment} />
      </div>
    </div>
  ),
};

export const WorkplaceVariants: Story = {
  name: 'Workplace Types (Remote / Hybrid / Onsite)',
  render: () => (
    <div className={layoutStyles.row}>
      <WorkplaceText workplace="remote" />
      <WorkplaceText workplace="hybrid" />
      <WorkplaceText workplace="onsite" />
    </div>
  ),
};

export const LocationAndSalary: Story = {
  name: 'Location & Salary Indicators',
  render: () => (
    <div className={layoutStyles.row}>
      <LocationText>Worldwide</LocationText>
      <LocationText>Berlin, Germany (EU)</LocationText>
      <SalaryText>USD11 200 / мес</SalaryText>
      <SalaryText>EUR6 500–8 000 / мес</SalaryText>
    </div>
  ),
};

export const HistoryAndAiQueueIndicators: Story = {
  name: 'Card Footer History & AI Queue Indicators',
  render: (args) => (
    <div className={layoutStyles.row}>
      <HistoryText count={args.historyCount} hasComment={args.hasComment} />
      <HistoryText
        count={4}
        hasComment
        title="Перемещений: 4 (есть заметки)"
      />
      <AiPendingText />
    </div>
  ),
};

export const GenericIconTexts: Story = {
  name: 'Generic Icon + Text Combinations',
  render: () => (
    <div className={layoutStyles.row}>
      <IconText icon={Calendar} tone="muted" mono>
        6 нояб.
      </IconText>
      <IconText icon={Globe} tone="primary" mono uppercase>
        LinkedIn Jobs
      </IconText>
      <IconText icon={Sparkles} tone="mint" mono>
        AI Summary Ready
      </IconText>
      <IconText icon={Flame} tone="danger" mono>
        5 дн. подряд
      </IconText>
    </div>
  ),
};
