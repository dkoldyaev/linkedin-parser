import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';
import { Text } from '../Text';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Label> = {
  title: 'Atoms/Label',
  component: Label,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Column Title',
  },
};

export const RequiredAndDisabled: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Label required>Required Field Label</Label>
      <Label disabled>Disabled Field Label</Label>
      <Text
        variant="mono-label"
        tone="accent"
        snapToGrid
      >
        Related Text Atom (mono-label variant)
      </Text>
    </div>
  ),
};
