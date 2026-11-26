import { Award, Ban, CheckCircle2, Clock, MapPin, Sparkles, Tag } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    tone: 'primary',
    variant: 'subtle',
    size: 'md',
    children: 'Badge Label',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info'],
    },
    palette: {
      control: 'select',
      options: ['slate', 'blue', 'cyan', 'indigo', 'purple', 'emerald', 'amber', 'rose'],
    },
    variant: {
      control: 'select',
      options: ['subtle', 'solid', 'outline', 'chip', 'counter', 'ghost'],
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

export const SemanticTones: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="primary" icon={<Icon icon={Sparkles} size="2xs" />}>
        Primary
      </Badge>
      <Badge tone="success" icon={<Icon icon={CheckCircle2} size="2xs" />}>
        Success
      </Badge>
      <Badge tone="warning" icon={<Icon icon={Clock} size="2xs" />}>
        Warning
      </Badge>
      <Badge tone="danger" icon={<Icon icon={Ban} size="2xs" />}>
        Danger
      </Badge>
      <Badge tone="info" icon={<Icon icon={MapPin} size="2xs" />}>
        Info
      </Badge>
    </div>
  ),
};

export const PaletteTones: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Badge palette="slate">Slate</Badge>
      <Badge palette="blue">Blue</Badge>
      <Badge palette="cyan">Cyan</Badge>
      <Badge palette="indigo">Indigo</Badge>
      <Badge palette="purple">Purple</Badge>
      <Badge palette="emerald">Emerald</Badge>
      <Badge palette="amber">Amber</Badge>
      <Badge palette="rose">Rose</Badge>
    </div>
  ),
};

export const VariantsAndRemovableChips: Story = {
  render: () => (
    <div className={layoutStyles.stackSm}>
      <div className={layoutStyles.row}>
        <Badge variant="subtle" tone="success" icon={<Icon icon={Award} size="2xs" />}>
          92% Score
        </Badge>
        <Badge variant="counter" tone="neutral">
          12
        </Badge>
        <Badge variant="ghost" size="xs">
          TypeScript
        </Badge>
        <Badge variant="ghost" size="xs" tone="primary" icon={<Icon icon={Tag} size="2xs" />}>
          distributed-systems
        </Badge>
      </div>
      <div className={layoutStyles.row}>
        <Badge variant="chip" size="sm" tone="primary" onRemove={() => undefined}>
          Editable Token 1
        </Badge>
        <Badge variant="chip" size="sm" tone="success" onRemove={() => undefined}>
          Editable Token 2
        </Badge>
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Badge size="xs" tone="primary">
        XS Badge
      </Badge>
      <Badge size="sm" tone="primary">
        SM Badge
      </Badge>
      <Badge size="md" tone="primary">
        MD Badge
      </Badge>
      <Badge size="lg" tone="primary">
        LG Badge
      </Badge>
    </div>
  ),
};
