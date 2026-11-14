import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './Heading';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Heading> = {
  title: 'Atoms/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'radio',
      options: [1, 2, 3, 4, 5, 6],
    },
    tone: {
      control: 'select',
      options: ['primary', 'secondary', 'muted', 'accent', 'success', 'warning', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const AllLevels: Story = {
  render: () => (
    <div>
      <Heading level={1}>Heading 1 — 2XL Display Monospace</Heading>
      <Paragraph spacing="md" tone="secondary">
        Используется для главных экранов и ключевых экранов аналитики.
      </Paragraph>

      <Heading level={2}>Heading 2 — XL Heading Monospace</Heading>
      <Paragraph spacing="md" tone="secondary">
        Заголовки модальных окон и ключевых панелей рабочей области.
      </Paragraph>

      <Heading level={3}>Heading 3 — LG Title Sans Semibold</Heading>
      <Paragraph spacing="md" tone="secondary">
        Заголовки блоков и карточек вакансий.
      </Paragraph>

      <Heading level={4}>Heading 4 — Base Title Sans Semibold</Heading>
      <Paragraph spacing="md" tone="secondary">
        Заголовки списков требований и групп параметров.
      </Paragraph>

      <Heading level={5}>Heading 5 — SM Monospace Uppercase</Heading>
      <Paragraph spacing="md" tone="secondary">
        Технические лейблы колонок и подсекций.
      </Paragraph>

      <Heading level={6}>Heading 6 — XS Monospace Uppercase</Heading>
      <Paragraph spacing="md" tone="secondary">
        Минималистичные технические подзаголовки и мета-индикаторы.
      </Paragraph>
    </div>
  ),
};

export const ToneVariants: Story = {
  render: () => (
    <div>
      <Heading level={2} tone="primary">Primary Heading</Heading>
      <Heading level={2} tone="accent">Accent Heading</Heading>
      <Heading level={2} tone="success">Success Heading</Heading>
      <Heading level={2} tone="warning">Warning Heading</Heading>
      <Heading level={2} tone="danger">Danger Heading</Heading>
    </div>
  ),
};
