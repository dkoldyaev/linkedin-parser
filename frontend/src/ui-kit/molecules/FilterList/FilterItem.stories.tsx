import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterItem, type FilterOption } from './FilterItem';

const meta: Meta<typeof FilterItem> = {
  title: 'Molecules/FilterItem',
  component: FilterItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof FilterItem>;

const SAMPLE_OPTIONS: readonly FilterOption[] = [
  { value: '', label: 'Все страны' },
  { value: 'cyprus', label: 'Кипр', count: 18 },
  { value: 'germany', label: 'Германия', count: 42 },
  { value: 'armenia', label: 'Армения', count: 9 },
  { value: 'georgia', label: 'Грузия', count: 14, disabled: true },
];

export const Default: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState<string>('');
      return (
        <FilterItem
          placeholder="Все страны [4]"
          value={value}
          onChange={setValue}
          options={SAMPLE_OPTIONS}
        />
      );
    };
    return <Component />;
  },
};

export const Selected: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState<string>('germany');
      return (
        <FilterItem
          placeholder="Все страны [4]"
          value={value}
          onChange={setValue}
          options={SAMPLE_OPTIONS}
        />
      );
    };
    return <Component />;
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Фильтр отключен',
    options: SAMPLE_OPTIONS,
    disabled: true,
  },
};
