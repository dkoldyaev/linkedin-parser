import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from './Form';
import { Input } from '../../atoms';
import { ColorPicker, FormField } from '../../molecules';
import { useForm } from '../../hooks';
import type { StatusDotPalette } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Form> = {
  title: 'Organisms/Form',
  component: Form,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Form>;

function ColumnFormDemo(): React.ReactElement {
  const form = useForm<{ title: string; color: StatusDotPalette }>({
    initialValues: {
      title: 'Technical Screening',
      color: 'blue',
    },
    validate: (values) => {
      if (values.title.trim().length === 0) {
        return { title: 'Column name is required' };
      }
      return {};
    },
    onSubmit: async () => undefined,
  });

  return (
    <div className={layoutStyles.stack}>
      <Form
        onSubmit={(e) => void form.handleSubmit(e)}
        errorMessage={form.submitError}
        submitLabel="Save Column"
        onCancel={() => form.resetForm()}
        isSubmitting={form.isSubmitting}
      >
        <FormField label="Column Title" required error={form.errors.title}>
          {(a11yProps) => (
            <Input
              {...a11yProps}
              value={form.values.title}
              onChange={(e) => form.setFieldValue('title', e.target.value)}
            />
          )}
        </FormField>
        <FormField label="Column Palette">
          <ColorPicker
            value={form.values.color}
            onChange={(c) => form.setFieldValue('color', c)}
          />
        </FormField>
      </Form>
    </div>
  );
}

export const InteractiveForm: Story = {
  render: () => <ColumnFormDemo />,
};
