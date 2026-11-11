import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EditableTokenList,
  type EditableTokenListProps,
} from './EditableTokenList';

const DEFAULT_TECH_TOKENS = [
  'React',
  'TypeScript',
  'Bun',
  'Vite',
  'TanStack Router',
  'TanStack Query',
  'Chakra UI',
  'Codex',
  'Claude Code',
  'Grafana Faro',
  'test',
  'ping',
];

const meta: Meta<typeof EditableTokenList> = {
  title: 'Molecules/EditableTokenList',
  component: EditableTokenList,
  tags: ['autodocs'],
  args: {
    tokens: DEFAULT_TECH_TOKENS,
    addMode: false,
    placeholder: 'Добавить технологию...',
    showTagIcon: false,
    lowercaseTokens: false,
    readOnly: false,
  },
  argTypes: {
    tokens: { control: 'object' },
    addMode: { control: 'boolean' },
    placeholder: { control: 'text' },
    label: { control: 'text' },
    showTagIcon: { control: 'boolean' },
    lowercaseTokens: { control: 'boolean' },
    readOnly: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof EditableTokenList>;

function ControlledTokenListStory(
  props: EditableTokenListProps
): React.ReactElement {
  const [tokens, setTokens] = useState<readonly string[]>(props.tokens);
  const [addMode, setAddMode] = useState<boolean>(Boolean(props.addMode));

  useEffect(() => {
    setTokens(props.tokens);
  }, [props.tokens]);

  useEffect(() => {
    setAddMode(Boolean(props.addMode));
  }, [props.addMode]);

  return (
    <EditableTokenList
      {...props}
      tokens={tokens}
      addMode={addMode}
      onChange={setTokens}
      onAddModeChange={setAddMode}
    />
  );
}

export const Interactive: Story = {
  render: (args) => <ControlledTokenListStory {...args} />,
};

export const AddModeActive: Story = {
  args: {
    tokens: DEFAULT_TECH_TOKENS,
    addMode: true,
    placeholder: 'Добавить технологию...',
  },
  render: (args) => <ControlledTokenListStory {...args} />,
};

export const WithHeaderAndTagIcon: Story = {
  args: {
    label: 'Пользовательские теги',
    tokens: ['remote-eu', 'high-priority', 'product-company', 'b2b-saas'],
    addMode: false,
    placeholder: 'Добавить тег через запятую...',
    showTagIcon: true,
    lowercaseTokens: true,
  },
  render: (args) => <ControlledTokenListStory {...args} />,
};
