import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Stepper } from './Stepper';

const meta: Meta<typeof Stepper> = {
  title: 'Molecules/Stepper',
  component: Stepper,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Stepper>;

const SAMPLE_STEPS = [
  {
    id: 'step-1',
    label: 'Parsed from Source',
    timestamp: '10 May, 09:15',
    tone: 'neutral' as const,
    description: 'Initial record created automatically by background worker.',
  },
  {
    id: 'step-2',
    fromLabel: 'Parsed',
    label: 'CV Adapted',
    duration: '12m',
    timestamp: '10 May, 09:27',
    tone: 'info' as const,
    description: 'Tailored resume v2 generated with 91% keyword alignment.',
  },
  {
    id: 'step-3',
    fromLabel: 'CV Adapted',
    label: 'Applied',
    duration: '2h',
    timestamp: '10 May, 11:30',
    tone: 'accent' as const,
  },
  {
    id: 'step-4',
    fromLabel: 'Applied',
    label: 'Technical Interview',
    duration: '4d',
    timestamp: '14 May, 15:00',
    tone: 'success' as const,
    active: true,
    description: 'Scheduled 60-minute system design interview.',
  },
];

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Stepper items={SAMPLE_STEPS} />
    </div>
  ),
};

export const CollapsibleHistory: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Stepper items={SAMPLE_STEPS} maxCollapsedItems={2} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Stepper
        items={[]}
        emptyTitle="No transitions yet"
        emptyDescription="Timeline events will appear here as stages progress."
      />
    </div>
  ),
};
