import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Text> = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    snapToGrid: {
      control: 'boolean',
      description:
        'Принудительное выравнивание по чертёжной сетке Blueprint 32px (высота кратна 32px, вертикальное центрирование)',
    },
    variant: {
      control: 'select',
      options: [
        'display',
        'heading',
        'title',
        'mono-label',
        'body',
        'caption',
        'mono',
      ],
    },
    tone: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'muted',
        'accent',
        'success',
        'warning',
        'danger',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const AllVariants: Story = {
  args: {
    snapToGrid: true,
  },
  render: (args) => (
    <div className={layoutStyles.stack}>
      <Text as="h1" variant="display" snapToGrid={args.snapToGrid}>
        Display — CV.ALTER Blueprint v2.0
      </Text>
      <Text as="h2" variant="heading" snapToGrid={args.snapToGrid}>
        Heading — Vacancy Adaptation Pipeline
      </Text>
      <Text as="h3" variant="title" snapToGrid={args.snapToGrid}>
        Title — Senior Frontend Systems Architect
      </Text>
      <Text
        as="div"
        variant="mono-label"
        tone="accent"
        snapToGrid={args.snapToGrid}
      >
        Mono-Label — STATUS: ACTIVE_WORKER
      </Text>
      <Text as="p" variant="body" snapToGrid={args.snapToGrid}>
        Body — Clean presentation typography using Inter without hardcoded pixel literals.
      </Text>
      <Text
        as="p"
        variant="caption"
        tone="secondary"
        snapToGrid={args.snapToGrid}
      >
        Caption — Secondary metadata and timestamps.
      </Text>
      <Text as="code" variant="mono" tone="success" snapToGrid={args.snapToGrid}>
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
