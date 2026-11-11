import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagList, type TagItem } from './TagList';

const meta: Meta<typeof TagList> = {
  title: 'Molecules/TagList',
  component: TagList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof TagList>;

const SAMPLE_TAGS: readonly TagItem[] = [
  { id: 'all', label: 'Все теги', count: 34 },
  { id: 'react', label: 'react', count: 18 },
  { id: 'typescript', label: 'typescript', count: 24 },
  { id: 'bun', label: 'bun', count: 7 },
  { id: 'nextjs', label: 'nextjs', count: 11 },
  { id: 'graphql', label: 'graphql', count: 5 },
  { id: 'tailwind', label: 'tailwind', count: 9 },
];

export const Default: Story = {
  render: () => {
    const Component = () => {
      const [activeTag, setActiveTag] = useState<string>('all');
      return (
        <TagList
          tags={SAMPLE_TAGS}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
        />
      );
    };
    return <Component />;
  },
};

export const ActiveTag: Story = {
  render: () => {
    const Component = () => {
      const [activeTag, setActiveTag] = useState<string>('typescript');
      return (
        <TagList
          tags={SAMPLE_TAGS}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
        />
      );
    };
    return <Component />;
  },
};

export const CustomLabel: Story = {
  render: () => (
    <TagList
      tags={SAMPLE_TAGS.slice(0, 4)}
      activeTag="react"
      label="Навыки:"
    />
  ),
};

export const WithoutIcon: Story = {
  render: () => (
    <TagList
      tags={SAMPLE_TAGS.slice(0, 4)}
      activeTag="react"
      showIcon={false}
      label="Стек:"
    />
  ),
};
