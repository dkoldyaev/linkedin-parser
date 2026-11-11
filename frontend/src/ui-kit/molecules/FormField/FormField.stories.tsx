import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField } from './FormField';
import { Input } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const DefaultWithHint: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <FormField
        label="Column Title"
        required
        hint="Displayed in the Kanban board column header."
      >
        {(a11yProps) => (
          <Input {...a11yProps} placeholder="e.g. Technical Interview" />
        )}
      </FormField>
    </div>
  ),
};

export const WithValidationError: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <FormField
        label="Target Salary Range"
        required
        error="Salary minimum cannot exceed salary maximum."
      >
        {(a11yProps) => (
          <Input
            {...a11yProps}
            invalid
            defaultValue="$180,000 - $120,000"
          />
        )}
      </FormField>
    </div>
  ),
};
