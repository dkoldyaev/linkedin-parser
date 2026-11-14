import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';
import { Input } from './Input';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Atomic Input control on the 32px Blueprint grid. Supports `sm`/`md`/`lg` sizes, `mono` typography, `invalid` error state, and start/end adornments.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter column title (e.g. Interview)...',
    'aria-label': 'Column title',
  },
};

export const MonospaceWithAdornment: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Input
        mono
        placeholder="https://www.linkedin.com/jobs/view/..."
        aria-label="Job URL"
        startAdornment={<Icon icon={Search} size="sm" />}
      />
    </div>
  ),
};

export const ValidationError: Story = {
  args: {
    invalid: true,
    defaultValue: 'invalid-salary-range',
    'aria-label': 'Salary range',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Read-only system configuration',
    'aria-label': 'Disabled input',
  },
};

export const RTLAndLongValue: Story = {
  render: () => (
    <div dir="rtl" className={layoutStyles.stack}>
      <Input
        defaultValue="مهندس برمجيات أول — Senior Frontend Architect"
        aria-label="RTL Job Title"
      />
    </div>
  ),
};
