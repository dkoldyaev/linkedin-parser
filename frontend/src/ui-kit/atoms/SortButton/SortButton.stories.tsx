import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SortButton, type SortDirection } from './SortButton';
import styles from './SortButtonStory.module.css';

const meta: Meta<typeof SortButton> = {
  title: 'Atoms/SortButton',
  component: SortButton,
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['none', 'asc', 'desc'],
      description: 'Current sort direction',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Component height (sm=24px, md=32px grid slot)',
    },
    tone: {
      control: 'select',
      options: ['default', 'accent', 'muted'],
    },
    iconPosition: {
      control: 'select',
      options: ['start', 'end'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SortButton>;

export const Default: Story = {
  args: {
    children: 'Company',
    direction: 'none',
    size: 'sm',
  },
};

export const Ascending: Story = {
  args: {
    children: 'Date Added',
    direction: 'asc',
    size: 'sm',
  },
};

export const Descending: Story = {
  args: {
    children: 'Tokens Spent',
    direction: 'desc',
    size: 'sm',
  },
};

export const GridSize32px: Story = {
  args: {
    children: 'Sort by Match Score',
    direction: 'desc',
    size: 'md',
    tone: 'accent',
  },
};

export const InteractiveToggle: Story = {
  render: () => {
    const InteractiveExample = () => {
      const [direction, setDirection] = useState<SortDirection>('none');
      return (
        <div className={styles.interactiveRow}>
          <SortButton
            direction={direction}
            onToggle={(next) => setDirection(next)}
            size="md"
          >
            Vacancy Title [{direction}]
          </SortButton>
          <button
            type="button"
            onClick={() => setDirection('none')}
            className={styles.resetBtn}
          >
            Reset
          </button>
        </div>
      );
    };
    return <InteractiveExample />;
  },
};

export const HeaderToolbarGroup: Story = {
  render: () => {
    const ToolbarGroup = () => {
      const [activeField, setActiveField] = useState<string>('date');
      const [direction, setDirection] = useState<SortDirection>('desc');

      const handleToggle = (field: string) => {
        if (activeField === field) {
          setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
          setActiveField(field);
          setDirection('asc');
        }
      };

      return (
        <div className={styles.toolbarGroup}>
          <span className={styles.toolbarLabel}>
            Sort by:
          </span>
          <SortButton
            size="sm"
            direction={activeField === 'title' ? direction : 'none'}
            active={activeField === 'title'}
            onToggle={() => handleToggle('title')}
          >
            Title
          </SortButton>
          <SortButton
            size="sm"
            direction={activeField === 'company' ? direction : 'none'}
            active={activeField === 'company'}
            onToggle={() => handleToggle('company')}
          >
            Company
          </SortButton>
          <SortButton
            size="sm"
            direction={activeField === 'date' ? direction : 'none'}
            active={activeField === 'date'}
            onToggle={() => handleToggle('date')}
          >
            Date
          </SortButton>
        </div>
      );
    };
    return <ToolbarGroup />;
  },
};
