import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Building2,
  CheckCircle2,
  DollarSign,
  Globe,
  History,
  MapPin,
} from 'lucide-react';
import { Icon } from '../Icon';
import { Spinner } from '../Spinner';
import { StatusDot } from '../StatusDot';
import {
  Blockquote,
  Code,
  Heading,
  Kbd,
  Link,
  List,
  Paragraph,
  Text,
} from './Text';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Text> = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
  args: {
    variant: 'body',
    tone: 'primary',
    snapToGrid: false,
    lineHeight: 'auto',
    children: 'Blueprint architectural typography specimen.',
  },
  argTypes: {
    snapToGrid: {
      control: 'boolean',
      description:
        'Snaps height to multiples of the 32px Blueprint drafting grid cell.',
    },
    lineHeight: {
      control: 'select',
      options: ['auto', 'grid', 0.5],
      description:
        'Line height mode: "auto", "grid" (32px), or 0.5 (16px).',
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
        'info',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Playground: Story = {};

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
        Display — Blueprint Design System v2.0
      </Text>
      <Text
        as="h2"
        variant="heading"
        snapToGrid={args.snapToGrid}
        lineHeight={args.lineHeight}
      >
        Heading — System Architecture & Primitives
      </Text>
      <Text
        as="h3"
        variant="title"
        snapToGrid={args.snapToGrid}
        lineHeight={args.lineHeight}
      >
        Title — Distributed Systems Lead
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
        Body — Clean presentation typography using Inter and strict CSS custom properties.
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

export const WithStartAndEndIcons: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Text
        variant="caption"
        tone="info"
        weight="semibold"
        startIcon={<Icon icon={Globe} size="xs" />}
      >
        Remote
      </Text>
      <Text
        variant="caption"
        tone="secondary"
        startIcon={<Icon icon={MapPin} size="xs" />}
      >
        Berlin, Germany
      </Text>
      <Text
        variant="mono"
        tone="success"
        weight="bold"
        startIcon={<Icon icon={DollarSign} size="xs" />}
      >
        7,500 EUR / mo
      </Text>
      <Text
        variant="mono"
        size="2xs"
        tone="muted"
        startIcon={<Icon icon={History} size="2xs" />}
        endIcon={<StatusDot tone="info" size="sm" glow />}
      >
        4
      </Text>
      <Text
        variant="caption"
        tone="muted"
        startIcon={<Spinner size="xs" />}
      >
        Processing background job...
      </Text>
    </div>
  ),
};

export const HeadingsAndParagraphs: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Heading level={1}>H1 Blueprint Main Heading</Heading>
      <Heading level={2} tone="accent">
        H2 Section Heading (Accent)
      </Heading>
      <Heading level={3}>H3 Subsection Title</Heading>
      <Paragraph spacing="sm">
        Primary paragraph text aligned with Blueprint typography tokens and predictable vertical rhythm.
      </Paragraph>
      <Paragraph spacing="none" tone="secondary">
        Secondary paragraph providing supporting context without bottom margin.
      </Paragraph>
    </div>
  ),
};

export const ListsBlockquotesAndCode: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <List spacing="compact">
        <List.Item icon={<Icon icon={CheckCircle2} size="sm" tone="success" />}>
          Strict 32px drafting grid quantization
        </List.Item>
        <List.Item icon={<Icon icon={CheckCircle2} size="sm" tone="success" />}>
          Zero hardcoded pixel or hex values outside tokens
        </List.Item>
      </List>
      <Blockquote tone="accent" author="Blueprint Architecture Guide">
        Every component composes lower-level primitives rather than reinventing markup.
      </Blockquote>
      <div className={layoutStyles.row}>
        <Code>--ui-grid-cell: 32px</Code>
        <Kbd>Ctrl + K</Kbd>
        <Link
          href="https://example.com"
          external
          startIcon={<Icon icon={Building2} size="xs" />}
        >
          External Documentation
        </Link>
      </div>
    </div>
  ),
};

export const TruncatedLongContent: Story = {
  render: () => (
    <div className={layoutStyles.narrowBox}>
      <Text as="div" variant="body" truncate>
        Extremely long title that truncates cleanly with an ellipsis inside a narrow container
      </Text>
    </div>
  ),
};
