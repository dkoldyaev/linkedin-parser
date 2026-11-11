import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EditableTokenList } from './EditableTokenList';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof EditableTokenList> = {
  title: 'Molecules/EditableTokenList',
  component: EditableTokenList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EditableTokenList>;

function TokenListDemo(): React.ReactElement {
  const [tokens, setTokens] = useState<readonly string[]>([
    'React 19',
    'TypeScript',
    'Atomic Design',
    'Storybook',
    'Playwright',
  ]);

  return (
    <div className={layoutStyles.stack}>
      <EditableTokenList
        label="Extracted Tech Stack Tokens"
        tone="primary"
        tokens={tokens}
        onAddToken={(token) => setTokens((prev) => [...prev, token])}
        onRemoveToken={(_token, idx) =>
          setTokens((prev) => prev.filter((_, i) => i !== idx))
        }
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <TokenListDemo />,
};

export const EmptyReadOnly: Story = {
  args: {
    label: 'Stop Words',
    tokens: [],
    readOnly: true,
    emptyMessage: 'No stop words configured for this profile.',
  },
};
