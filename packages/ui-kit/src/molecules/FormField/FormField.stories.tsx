import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField } from './FormField';
import { Input } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  tags: ['autodocs'],
  args: {
    label: 'Column Title',
    required: true,
    disabled: false,
    hint: 'Displayed in the Kanban board column header.',
    error: '',
  },
  argTypes: {
    label: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    hint: { control: 'text' },
    error: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const DefaultWithHint: Story = {
  render: (args) => (
    <div className={layoutStyles.stack}>
      <FormField
        label={args.label}
        required={args.required}
        disabled={args.disabled}
        hint={args.hint}
        error={args.error}
      >
        {(a11yProps) => (
          <Input {...a11yProps} placeholder="e.g. Technical Interview" />
        )}
      </FormField>
    </div>
  ),
};

export const WithValidationError: Story = {
  args: {
    label: 'Target Salary Range',
    required: true,
    disabled: false,
    hint: '',
    error: 'Salary minimum cannot exceed salary maximum.',
  },
  render: (args) => (
    <div className={layoutStyles.stack}>
      <FormField
        label={args.label}
        required={args.required}
        disabled={args.disabled}
        hint={args.hint}
        error={args.error}
      >
        {(a11yProps) => (
          <Input
            {...a11yProps}
            invalid={Boolean(args.error)}
            defaultValue="$180,000 - $120,000"
          />
        )}
      </FormField>
    </div>
  ),
};
