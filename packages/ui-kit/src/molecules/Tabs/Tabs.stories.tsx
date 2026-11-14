import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './Tabs';
import { Text } from '../../atoms';

const meta: Meta<typeof Tabs> = {
  title: 'Molecules/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs
      ariaLabel="Vacancy sections"
      items={[
        {
          value: 'overview',
          label: 'Overview & Keywords',
          count: 14,
          content: (
            <Text as="p" variant="body">
              Extracted technology tokens, company details, and salary range.
            </Text>
          ),
        },
        {
          value: 'cv',
          label: 'Adapted CV Versions',
          count: 3,
          content: (
            <Text as="p" variant="body">
              Version history of tailored resumes generated for this vacancy.
            </Text>
          ),
        },
        {
          value: 'letter',
          label: 'Cover Letter',
          content: (
            <Text as="p" variant="body">
              AI-generated cover letter aligned to hiring manager requirements.
            </Text>
          ),
        },
      ]}
    />
  ),
};
