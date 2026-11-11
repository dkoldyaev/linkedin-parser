import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Settings } from 'lucide-react';
import { SearchBar, type SearchBarProps } from './SearchBar';
import { Button, Icon, Text } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof SearchBar> = {
  title: 'Molecules/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  args: {
    value: 'Senior React Architect',
    placeholder: 'Поиск по компании, должности, стеку...',
    expandOnFocus: false,
    disabled: false,
    clearLabel: 'Clear search',
  },
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    expandOnFocus: { control: 'boolean' },
    disabled: { control: 'boolean' },
    clearLabel: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

function ControlledSearchBarStory(props: SearchBarProps): React.ReactElement {
  const [query, setQuery] = useState(props.value);

  useEffect(() => {
    setQuery(props.value);
  }, [props.value]);

  return (
    <div className={layoutStyles.stack}>
      <SearchBar
        {...props}
        value={query}
        onValueChange={setQuery}
        aria-label="Filter vacancies"
      />
    </div>
  );
}

export const Interactive: Story = {
  render: (args) => <ControlledSearchBarStory {...args} />,
};

export const ExpandOnFocus: Story = {
  args: {
    value: 'Typescript, React',
    placeholder: 'Кликните для раскрытия по фокусу...',
    expandOnFocus: true,
  },
  render: (args) => <ControlledSearchBarStory {...args} />,
};

function AdaptiveHeaderDemo(props: SearchBarProps): React.ReactElement {
  const [query, setQuery] = useState(props.value);

  useEffect(() => {
    setQuery(props.value);
  }, [props.value]);

  return (
    <div className={layoutStyles.adaptiveHeaderDemo}>
      <div className={layoutStyles.adaptiveHeaderBrand}>
        <Text variant="mono" weight="bold">
          LINKEDIN PARSER
        </Text>
      </div>
      <div className={layoutStyles.adaptiveHeaderCenter}>
        <SearchBar
          {...props}
          value={query}
          onValueChange={setQuery}
          aria-label="Search in header"
        />
      </div>
      <div className={layoutStyles.adaptiveHeaderActions}>
        <Button variant="primary" size="icon" aria-label="Add vacancy">
          <Icon icon={Plus} size="sm" />
        </Button>
        <Button variant="secondary" size="icon" aria-label="Settings">
          <Icon icon={Settings} size="sm" />
        </Button>
      </div>
    </div>
  );
}

export const AdaptiveHeaderExpandOnFocus: Story = {
  args: {
    value: '',
    placeholder: 'Поиск вакансий (фокус скрывает соседние элементы шапки)...',
    expandOnFocus: false,
  },
  render: (args) => <AdaptiveHeaderDemo {...args} />,
};
