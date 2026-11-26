import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { TagsList } from './TagsList';
import { useState } from 'react';

const meta: Meta<typeof TagsList> = {
  title: 'Organisms/TagsList',
  component: TagsList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TagsList>;

export const Default: Story = {
  render: () => {
    const [tags, setTags] = useState(['React', 'TypeScript', 'Node.js']);
    return (
      <div className={layoutStyles.container}>
        <TagsList
          value={tags}
          onChange={setTags}
          deletable
          addable
          placeholder="Добавить технологию..."
        />
      </div>
    );
  },
};

export const WithMaxVisibleTruncation: Story = {
  render: () => {
    const [tags, setTags] = useState([
      'TypeScript',
      'React 19',
      'Storybook 10',
      'Design Systems',
      'Radix UI',
      'CSS Modules',
      'Vitest',
    ]);
    return (
      <div className={layoutStyles.container}>
        <TagsList
          value={tags}
          onChange={setTags}
          maxVisible={4}
          deletable
          addable
          placeholder="Добавить..."
        />
      </div>
    );
  },
};
