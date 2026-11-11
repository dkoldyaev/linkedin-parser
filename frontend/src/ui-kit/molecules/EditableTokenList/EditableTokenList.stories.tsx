import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EditableTokenList,
  type EditableTokenListProps,
} from './EditableTokenList';

import styles from './EditableTokenListStory.module.css';

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
    value: DEFAULT_TECH_TOKENS,
    addMode: false,
    placeholder: 'Добавить технологию...',
    showTagIcon: false,
    readOnly: false,
    tone: 'neutral',
  },
  argTypes: {
    value: { control: 'object' },
    addMode: { control: 'boolean' },
    placeholder: { control: 'text' },
    label: { control: 'text' },
    showTagIcon: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    tone: {
      control: 'select',
      options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditableTokenList>;

function ControlledTokenListStory(
  props: EditableTokenListProps
): React.ReactElement {
  const [value, setValue] = useState<readonly string[]>(
    props.value ?? props.tokens ?? DEFAULT_TECH_TOKENS
  );
  const [addMode, setAddMode] = useState<boolean>(Boolean(props.addMode));

  useEffect(() => {
    setValue(props.value ?? props.tokens ?? DEFAULT_TECH_TOKENS);
  }, [props.value, props.tokens]);

  useEffect(() => {
    setAddMode(Boolean(props.addMode));
  }, [props.addMode]);

  return (
    <EditableTokenList
      {...props}
      value={value}
      addMode={addMode}
      onChange={setValue}
      onAddModeChange={setAddMode}
    />
  );
}

export const Interactive: Story = {
  render: (args) => <ControlledTokenListStory {...args} />,
};

export const AddModeActive: Story = {
  args: {
    value: DEFAULT_TECH_TOKENS,
    addMode: true,
    placeholder: 'Добавить технологию...',
  },
  render: (args) => <ControlledTokenListStory {...args} />,
};

export const WithHeaderAndTagIcon: Story = {
  args: {
    label: 'Пользовательские теги',
    value: ['remote-eu', 'high-priority', 'product-company', 'b2b-saas'],
    addMode: false,
    placeholder: 'Добавить тег через запятую...',
    showTagIcon: true,
    tone: 'primary',
  },
  render: (args) => <ControlledTokenListStory {...args} />,
};

export const ToneVariants: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <ControlledTokenListStory
        label="Neutral Tone (Default)"
        value={['React', 'TypeScript', 'Node.js']}
        tone="neutral"
      />
      <ControlledTokenListStory
        label="Primary Tone"
        value={['React', 'TypeScript', 'Vite']}
        tone="primary"
      />
      <ControlledTokenListStory
        label="Success Tone"
        value={['CI Passed', 'Tested', 'Approved']}
        tone="success"
      />
      <ControlledTokenListStory
        label="Warning Tone"
        value={['Deprecated', 'Review Needed']}
        tone="warning"
      />
      <ControlledTokenListStory
        label="Danger Tone"
        value={['Critical Bug', 'Security Alert']}
        tone="danger"
      />
      <ControlledTokenListStory
        label="Info Tone"
        value={['Documentation', 'Draft']}
        tone="info"
      />
    </div>
  ),
};
