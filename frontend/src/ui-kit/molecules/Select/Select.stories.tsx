import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Select> = {
  title: 'Molecules/Select',
  component: Select,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

const STATUS_OPTIONS = [
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Technical Interview' },
  { value: 'offer', label: 'Offer Received' },
  { value: 'archived', label: 'Archived (Disabled)', disabled: true },
] as const;

function SelectDemo(): React.ReactElement {
  const [status, setStatus] = useState('interview');
  return (
    <div className={layoutStyles.stack}>
      <Select
        value={status}
        onValueChange={setStatus}
        options={STATUS_OPTIONS}
        ariaLabel="Vacancy pipeline stage"
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <SelectDemo />,
};
