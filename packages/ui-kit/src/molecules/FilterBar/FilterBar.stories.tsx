import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterBar } from './FilterBar';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof FilterBar> = {
  title: 'Molecules/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

function InteractiveFilterBar(): React.ReactElement {
  const [workplace, setWorkplace] = useState('remote');
  const [score, setScore] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['TypeScript']);

  const handleReset = () => {
    setWorkplace('');
    setScore('');
    setSelectedTags([]);
  };

  return (
    <div className={layoutStyles.stack}>
      <FilterBar
        selects={[
          {
            id: 'workplace',
            ariaLabel: 'Workplace filter',
            value: workplace,
            onChange: setWorkplace,
            options: [
              { value: '', label: 'All Workplaces' },
              { value: 'remote', label: 'Remote' },
              { value: 'hybrid', label: 'Hybrid' },
              { value: 'onsite', label: 'On-site' },
            ],
          },
          {
            id: 'score',
            ariaLabel: 'Minimum match score',
            value: score,
            onChange: setScore,
            options: [
              { value: '', label: 'Any Match Score' },
              { value: '80', label: '80% and above' },
              { value: '60', label: '60% and above' },
            ],
          },
        ]}
        tags={[
          { label: 'TypeScript', count: 14 },
          { label: 'React', count: 12 },
          { label: 'Node.js', count: 8 },
          { label: 'Fintech', count: 5 },
        ]}
        selectedTags={selectedTags}
        onToggleTag={(tag) =>
          setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
          )
        }
        onReset={handleReset}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveFilterBar />,
};
