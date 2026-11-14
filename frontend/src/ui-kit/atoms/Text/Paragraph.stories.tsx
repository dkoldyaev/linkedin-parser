import type { Meta, StoryObj } from '@storybook/react-vite';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Paragraph> = {
  title: 'Atoms/Paragraph',
  component: Paragraph,
  tags: ['autodocs'],
  argTypes: {
    spacing: {
      control: 'radio',
      options: ['none', 'sm', 'md', 'lg'],
    },
    tone: {
      control: 'select',
      options: ['primary', 'secondary', 'muted', 'accent', 'success', 'warning', 'danger'],
    },
    weight: {
      control: 'radio',
      options: ['regular', 'medium', 'semibold', 'bold'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Paragraph>;

export const Default: Story = {
  render: () => (
    <div>
      <Paragraph spacing="md">
        Архитектура дизайн-системы Blueprint построена на строгой сетке кратности 32px.
        Каждый элемент интерфейса (кнопки, ячейки, карточки, модальные окна) синхронизирован
        с чертежным полотном, исключая случайные сдвиги и расхождения верстки.
      </Paragraph>
      <Paragraph spacing="md" tone="secondary">
        Вторичный абзац текста: отображает пояснительную информацию, технические комментарии
        или вспомогательные сведения с уменьшенной контрастностью.
      </Paragraph>
    </div>
  ),
};

export const SpacingVariants: Story = {
  render: () => (
    <div>
      <Paragraph spacing="none">
        <strong>spacing=&quot;none&quot;</strong> — абзац без нижнего отступа, вплотную к следующему элементу.
      </Paragraph>
      <Paragraph spacing="sm">
        <strong>spacing=&quot;sm&quot;</strong> — компактный отступ (8px).
      </Paragraph>
      <Paragraph spacing="md">
        <strong>spacing=&quot;md&quot;</strong> — стандартный межстрочный интервал (12px).
      </Paragraph>
      <Paragraph spacing="lg">
        <strong>spacing=&quot;lg&quot;</strong> — увеличенный отступ разделов (16px).
      </Paragraph>
    </div>
  ),
};

export const ToneVariants: Story = {
  render: () => (
    <div>
      <Paragraph tone="primary">Primary tone: основной читаемый текст интерфейса.</Paragraph>
      <Paragraph tone="secondary">Secondary tone: пояснительный и мета-текст.</Paragraph>
      <Paragraph tone="muted">Muted tone: неактивный или третичный текст.</Paragraph>
      <Paragraph tone="accent">Accent tone: выделение ссылок и технологических токенов.</Paragraph>
      <Paragraph tone="success">Success tone: успешные подтверждения и совпадения требований.</Paragraph>
      <Paragraph tone="warning">Warning tone: предупреждения и временные лимиты.</Paragraph>
      <Paragraph tone="danger">Danger tone: критические расхождения и отказы.</Paragraph>
    </div>
  ),
};
