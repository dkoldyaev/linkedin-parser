import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Atoms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Atomic multiline Textarea control for CV prompts, cover letters, and vacancy notes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Paste job description or adaptation instructions...',
    'aria-label': 'Job description',
  },
};

export const MonospacePrompt: Story = {
  args: {
    mono: true,
    defaultValue:
      'SYSTEM PROMPT: Highlight React 19, TypeScript, and Atomic Design experience.',
    'aria-label': 'System prompt',
  },
};

export const InvalidState: Story = {
  args: {
    invalid: true,
    defaultValue: 'Prompt is too short.',
    'aria-label': 'Invalid prompt',
  },
};

export const DisabledState: Story = {
  args: {
    disabled: true,
    defaultValue: 'Locked CV template content.',
    'aria-label': 'Disabled textarea',
  },
};
