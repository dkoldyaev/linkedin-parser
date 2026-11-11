import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchBar } from './SearchBar';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof SearchBar> = {
  title: 'Molecules/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

function SearchBarDemo(): React.ReactElement {
  const [query, setQuery] = useState('Senior React Architect');
  return (
    <div className={layoutStyles.stack}>
      <SearchBar
        value={query}
        onValueChange={setQuery}
        placeholder="Filter vacancies by title, company, or skill..."
        aria-label="Filter vacancies"
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <SearchBarDemo />,
};
