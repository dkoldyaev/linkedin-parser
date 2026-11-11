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
    lineHeight: {
      control: 'select',
      options: ['auto', 'grid', 0.5],
      description:
        'Высота строки: "auto" (натуральный интерлиньяж), "grid" (1 ячейка = 32px) или 0.5 (половина ячейки = 16px)',
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
    lineHeight: 'auto',
  },
  render: (args) => (
    <div className={layoutStyles.stack}>
      <Text
        as="h1"
        variant="display"
        snapToGrid={args.snapToGrid}
        lineHeight={args.lineHeight}
      >
        Display — CV.ALTER Blueprint v2.0
      </Text>
      <Text
        as="h2"
        variant="heading"
        snapToGrid={args.snapToGrid}
        lineHeight={args.lineHeight}
      >
        Heading — Vacancy Adaptation Pipeline
      </Text>
      <Text
        as="h3"
        variant="title"
        snapToGrid={args.snapToGrid}
        lineHeight={args.lineHeight}
      >
        Title — Senior Frontend Systems Architect
      </Text>
      <Text
        as="div"
        variant="mono-label"
        tone="accent"
        snapToGrid={args.snapToGrid}
        lineHeight={args.lineHeight}
      >
        Mono-Label — STATUS: ACTIVE_WORKER
      </Text>
      <Text
        as="p"
        variant="body"
        snapToGrid={args.snapToGrid}
        lineHeight={args.lineHeight}
      >
        Body — Clean presentation typography using Inter without hardcoded pixel literals.
      </Text>
      <Text
        as="p"
        variant="caption"
        tone="secondary"
        snapToGrid={args.snapToGrid}
        lineHeight={args.lineHeight}
      >
        Caption — Secondary metadata and timestamps.
      </Text>
      <Text
        as="code"
        variant="mono"
        tone="success"
        snapToGrid={args.snapToGrid}
        lineHeight={args.lineHeight}
      >
        Mono — --ui-grid-cell: 32px
      </Text>
    </div>
  ),
};

export const LineHeightGridOptions: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Text as="div" variant="mono-label" tone="accent" lineHeight="grid">
        lineHeight="grid" (1 ячейка = 32px)
      </Text>
      <Text as="div" variant="mono-label" tone="accent" lineHeight={0.5}>
        lineHeight=0.5 (половина ячейки = 16px)
      </Text>
      <Text as="div" variant="mono-label" tone="accent" lineHeight="auto">
        lineHeight="auto" (натуральный интерлиньяж)
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
