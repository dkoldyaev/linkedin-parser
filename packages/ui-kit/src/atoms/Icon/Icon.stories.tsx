import { AlertTriangle, CheckCircle2, Info, Sparkles, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from './Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
  tags: ['autodocs'],
  args: {
    icon: Sparkles,
    size: 'md',
    tone: 'accent',
    label: 'Icon example',
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Playground: Story = {};

export const TonesAndSizes: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Icon icon={Sparkles} size="2xs" tone="muted" label="Sparkles 2XS" />
      <Icon icon={Sparkles} size="xs" tone="accent" label="Sparkles XS" />
      <Icon icon={Info} size="sm" tone="info" label="Info SM" />
      <Icon icon={CheckCircle2} size="md" tone="success" label="Success MD" />
      <Icon icon={AlertTriangle} size="lg" tone="warning" label="Warning LG" />
      <Icon icon={Trash2} size="xl" tone="danger" label="Danger XL" />
    </div>
  ),
};
