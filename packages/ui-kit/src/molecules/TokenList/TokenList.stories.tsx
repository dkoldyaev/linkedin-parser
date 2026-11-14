import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenList } from './TokenList';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof TokenList> = {
  title: 'Molecules/TokenList',
  component: TokenList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TokenList>;

export const ReadonlyChips: Story = {
  args: {
    mode: 'readonly',
    tokens: ['TypeScript', 'React 19', 'Symfony 7', 'PostgreSQL', 'Docker', 'Mercure SSE'],
    maxVisible: 4,
  },
};

export const ReadonlyTagsWithPrefix: Story = {
  args: {
    mode: 'readonly',
    variant: 'tag',
    prefix: '#',
    tokens: ['fintech', 'visa-sponsorship', 'product-company', 'b2b'],
  },
};

function SelectableDemo(): React.ReactElement {
  const [selected, setSelected] = useState<string[]>(['TypeScript', 'React']);
  return (
    <div className={layoutStyles.stack}>
      <TokenList
        mode="selectable"
        label="Filter by Technology"
        items={[
          { label: 'TypeScript', count: 18 },
          { label: 'React', count: 14 },
          { label: 'Node.js', count: 9 },
          { label: 'GraphQL', count: 5 },
          { label: 'Docker', count: 11 },
        ]}
        selectedTokens={selected}
        onToggleToken={(token) =>
          setSelected((prev) =>
            prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]
          )
        }
      />
    </div>
  );
}

export const Selectable: Story = {
  render: () => <SelectableDemo />,
};

function EditableDemo(): React.ReactElement {
  const [tokens, setTokens] = useState<string[]>([
    'TypeScript',
    'React',
    'Next.js',
    'GraphQL',
  ]);
  return (
    <div className={layoutStyles.stack}>
      <TokenList
        mode="editable"
        label="Tech Stack"
        tokens={tokens}
        onChange={setTokens}
        placeholder="Add technology..."
        addLabel="Add technology"
      />
    </div>
  );
}

export const Editable: Story = {
  render: () => <EditableDemo />,
};
