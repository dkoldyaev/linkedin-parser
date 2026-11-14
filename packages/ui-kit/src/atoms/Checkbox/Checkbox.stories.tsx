import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Checkbox> = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const States: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Checkbox label="Auto-adapt CV on vacancy import" defaultChecked />
      <Checkbox label="Include salary estimation" />
      <Checkbox label="Disabled enterprise setting" disabled />
    </div>
  ),
};
