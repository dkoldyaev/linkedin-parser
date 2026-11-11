import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColorPicker } from './ColorPicker';
import type { StatusDotPalette } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof ColorPicker> = {
  title: 'Molecules/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

function ColorPickerDemo(): React.ReactElement {
  const [color, setColor] = useState<StatusDotPalette>('emerald');
  return (
    <div className={layoutStyles.stack}>
      <ColorPicker value={color} onChange={setColor} />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <ColorPickerDemo />,
};
