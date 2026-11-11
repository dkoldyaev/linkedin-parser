import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { Icon } from './Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const TonesAndSizes: Story = {
  render: () => (
    <div className={layoutStyles.row}>
      <Icon icon={Sparkles} size="xs" tone="accent" label="AI Sparkles XS" />
      <Icon icon={Sparkles} size="sm" tone="accent" label="AI Sparkles SM" />
      <Icon icon={CheckCircle2} size="md" tone="success" label="Success MD" />
      <Icon icon={AlertTriangle} size="lg" tone="warning" label="Warning LG" />
    </div>
  ),
};
