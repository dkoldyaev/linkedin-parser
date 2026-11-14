import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportAccordion } from './ReportAccordion';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof ReportAccordion> = {
  title: 'Organisms/ReportAccordion',
  component: ReportAccordion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ReportAccordion>;

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <ReportAccordion
        title="AI Compatibility Report"
        scoreLabel="88% Match"
        scoreTone="success"
        summary="Strong alignment across frontend architecture, TypeScript design systems, and automated quality gates."
        onAction={() => undefined}
        sections={[
          {
            id: 'matches',
            title: 'STRENGTHS & MATCHES',
            tone: 'mint',
            defaultExpandedIds: ['m1'],
            items: [
              {
                id: 'm1',
                title: '6+ years with React, TypeScript, and Design Systems',
                content: 'Led architecture of 3 production component libraries with zero token violations.',
              },
              {
                id: 'm2',
                title: 'Performance optimization & Core Web Vitals',
                content: 'Reduced bundle size by 42% and improved LCP to 1.1s.',
              },
            ],
          },
          {
            id: 'gaps',
            title: 'MINOR GAPS',
            tone: 'warning',
            items: [
              {
                id: 'g1',
                title: 'Rust WebAssembly pipeline experience',
                content: 'Has used WASM modules in production, but has not authored Rust crates directly.',
              },
            ],
          },
        ]}
      />
    </div>
  ),
};
