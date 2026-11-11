import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Text> = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Text>;

export const AllVariants: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Text as="h1" variant="display">
        Display — CV.ALTER Blueprint v2.0
      </Text>
      <Text as="h2" variant="heading">
        Heading — Vacancy Adaptation Pipeline
      </Text>
      <Text as="h3" variant="title">
        Title — Senior Frontend Systems Architect
      </Text>
      <Text as="div" variant="mono-label" tone="accent">
        Mono-Label — STATUS: ACTIVE_WORKER
      </Text>
      <Text as="p" variant="body">
        Body — Clean presentation typography using Inter without hardcoded pixel literals.
      </Text>
      <Text as="p" variant="caption" tone="secondary">
        Caption — Secondary metadata and timestamps.
      </Text>
      <Text as="code" variant="mono" tone="success">
        Mono — --ui-grid-cell: 32px
      </Text>
    </div>
  ),
};

export const TruncatedLongContent: Story = {
  render: () => (
    <div className={layoutStyles.narrowBox}>
      <Text as="div" variant="body" truncate>
        Extremely long vacancy title that truncates cleanly with an ellipsis inside a narrow Kanban card container
      </Text>
    </div>
  ),
};
