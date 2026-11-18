import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from './Accordion';
import { Text } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Accordion> = {
  title: 'Molecules/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Accordion
        items={[
          {
            id: '1',
            title: '6+ years of deep experience with React and TypeScript ecosystem',
            actionLabel: 'Evidence',
            content: '8 years working with React (Redux, Zustand, Radix, Storybook). Built reusable UI component libraries.',
          },
          {
            id: '2',
            title: 'Experience designing UI-Kits and Design Systems from scratch',
            actionLabel: 'Evidence',
            content: 'Authored the Blueprint design system architecture across 3 projects with canonical tokens and dark/light themes.',
          },
          {
            id: '3',
            title: 'Strong Web Core Vitals & rendering optimization expertise',
            actionLabel: 'Evidence',
            content: 'Improved LCP from 3.8s to 1.1s on a 50,000+ row dashboard via virtualization and CSS layers.',
          },
        ]}
      />
    </div>
  ),
};

export const WithExpandedItem: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Accordion
        defaultExpandedIds={['1']}
        items={[
          {
            id: '1',
            title: '6+ years of deep experience with React and TypeScript ecosystem',
            actionLabel: 'Evidence',
            content: '8 years working with React (Redux, Zustand, Radix, Storybook). Built reusable UI component libraries.',
          },
          {
            id: '2',
            title: 'Experience designing UI-Kits and Design Systems from scratch',
            actionLabel: 'Evidence',
            content: 'Authored the Blueprint design system architecture across 3 projects with canonical tokens and dark/light themes.',
          },
        ]}
      />
    </div>
  ),
};

export const WithoutBullets: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Accordion
        bullet={false}
        defaultActionLabel="Details"
        items={[
          {
            id: '1',
            title: 'Vite build pipeline migration',
            content: 'Migrated from Webpack 5 to Vite 6, reducing production build time from 45s to 3.2s.',
          },
          {
            id: '2',
            title: 'Playwright integration test suite',
            content: 'Implemented end-to-end verification for critical user journeys.',
          },
        ]}
      />
    </div>
  ),
};

export const ComposedAccordion: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Accordion defaultExpandedIds={['step-1']}>
        <Accordion.Item
          id="step-1"
          title="Step 1: Configuration"
          content={<Text variant="body-sm" tone="secondary">Configure workspace settings and tokens.</Text>}
        />
        <Accordion.Item
          id="step-2"
          title="Step 2: Verification"
          content={<Text variant="body-sm" tone="secondary">Run automated verification suites.</Text>}
        />
      </Accordion>
    </div>
  ),
};
