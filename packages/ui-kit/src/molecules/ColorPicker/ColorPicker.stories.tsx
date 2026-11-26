import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof ColorPicker> = {
  title: 'Molecules/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

function ColorPickerDemo(): React.ReactElement {
  const [color, setColor] = useState<string>('emerald');
  return (
    <div className={layoutStyles.stack}>
      <ColorPicker value={color} onChange={setColor} />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <ColorPickerDemo />,
};
