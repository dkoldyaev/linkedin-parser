import type { Meta, StoryObj } from '@storybook/react-vite';
import { Blockquote } from './Blockquote';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Blockquote> = {
  title: 'Atoms/Blockquote',
  component: Blockquote,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'radio',
      options: ['primary', 'accent', 'success', 'warning', 'danger'],
    },
    author: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Blockquote>;

export const Default: Story = {
  render: () => (
    <Blockquote author="Senior Staff Engineer, Design Systems">
      Хорошая дизайн-система — это не просто набор переиспользуемых кнопок, а жесткий контракт
      между чертежной сеткой, токенами доступности и реальной логикой продуктовых экранов.
    </Blockquote>
  ),
};

export const ToneVariants: Story = {
  render: () => (
    <div>
      <Paragraph spacing="sm">
        <strong>tone=&quot;primary&quot;</strong>
      </Paragraph>
      <Blockquote tone="primary" author="Технический скрининг">
        Кандидат подтвердил глубокий опыт с современными стандартами TypeScript и React 19.
      </Blockquote>

      <Paragraph spacing="sm">
        <strong>tone=&quot;accent&quot;</strong>
      </Paragraph>
      <Blockquote tone="accent" author="AI Анализатор вакансий">
        Вакансия соответствует целевому профилю на 94%. Рекомендуется подача отклика в приоритетном порядке.
      </Blockquote>

      <Paragraph spacing="sm">
        <strong>tone=&quot;success&quot;</strong>
      </Paragraph>
      <Blockquote tone="success" author="Оффер">
        Все технические раунды пройдены с наивысшей оценкой комиссии.
      </Blockquote>

      <Paragraph spacing="sm">
        <strong>tone=&quot;warning&quot;</strong>
      </Paragraph>
      <Blockquote tone="warning" author="Внимание к требованиям">
        Позиция требует присутствия в часовом поясе CET (±2 часа) для регулярных синхронизаций.
      </Blockquote>

      <Paragraph spacing="sm">
        <strong>tone=&quot;danger&quot;</strong>
      </Paragraph>
      <Blockquote tone="danger" author="Причина отказа">
        Локация в Германии является строгим требованием из-за юридических ограничений найма.
      </Blockquote>
    </div>
  ),
};

export const WithoutAuthor: Story = {
  render: () => (
    <Blockquote tone="accent">
      Короткая цитата или выделенный блок важного контекста без указания конкретного автора.
    </Blockquote>
  ),
};
