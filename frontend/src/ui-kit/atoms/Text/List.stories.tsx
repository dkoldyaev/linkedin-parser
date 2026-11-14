import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { List, OrderedList, UnorderedList, ListItem } from './List';
import { Paragraph } from './Paragraph';
import { Icon } from '../Icon';

const meta: Meta<typeof List> = {
  title: 'Atoms/List',
  component: List,
  tags: ['autodocs'],
  argTypes: {
    ordered: { control: 'boolean' },
    spacing: {
      control: 'radio',
      options: ['compact', 'normal', 'relaxed'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof List>;

export const UnorderedListDefault: Story = {
  render: () => (
    <UnorderedList spacing="normal">
      <ListItem>Опыт глубокой разработки на TypeScript и React 19 от 6 лет</ListItem>
      <ListItem>Понимание архитектуры дизайн-систем и композиции UI-компонентов</ListItem>
      <ListItem>Оптимизация Core Web Vitals (LCP &lt; 2.5s, CLS &lt; 0.1)</ListItem>
      <ListItem>Тестирование через Vitest, Testing Library и Playwright</ListItem>
    </UnorderedList>
  ),
};

export const OrderedListNumbered: Story = {
  render: () => (
    <OrderedList spacing="normal">
      <ListItem>Отклик на вакансию через расширение браузера или Batch Import</ListItem>
      <ListItem>Автоматический парсинг описания, зарплатной вилки и стека</ListItem>
      <ListItem>AI-анализ совпадения с профилем кандидата и расчет Score (0–100%)</ListItem>
      <ListItem>Перемещение карточки по этапам Канбан-доски до оффера</ListItem>
    </OrderedList>
  ),
};

export const CustomIconList: Story = {
  render: () => (
    <UnorderedList spacing="normal">
      <ListItem
        icon={<Icon icon={CheckCircle2} size="xs" tone="success" />}
        tone="primary"
      >
        6+ лет опыта с React и экосистемой TypeScript (полное совпадение)
      </ListItem>
      <ListItem
        icon={<Icon icon={CheckCircle2} size="xs" tone="success" />}
        tone="primary"
      >
        Опыт разработки дизайн-систем и UI-библиотек с нуля
      </ListItem>
      <ListItem
        icon={<Icon icon={AlertCircle} size="xs" tone="warning" />}
        tone="secondary"
      >
        GraphQL Apollo Federation v2 (желательно, но не блокирует)
      </ListItem>
      <ListItem
        icon={<Icon icon={ArrowRight} size="xs" tone="accent" />}
        tone="primary"
      >
        Назначена дата лайв-кодинг сессии на вторник
      </ListItem>
    </UnorderedList>
  ),
};

export const SpacingVariants: Story = {
  render: () => (
    <div>
      <Paragraph spacing="sm">
        <strong>spacing=&quot;compact&quot;:</strong>
      </Paragraph>
      <UnorderedList spacing="compact">
        <ListItem>Элемент 1 (compact 4px gap)</ListItem>
        <ListItem>Элемент 2 (compact 4px gap)</ListItem>
      </UnorderedList>

      <Paragraph spacing="sm">
        <strong>spacing=&quot;normal&quot;:</strong>
      </Paragraph>
      <UnorderedList spacing="normal">
        <ListItem>Элемент 1 (normal 8px gap)</ListItem>
        <ListItem>Элемент 2 (normal 8px gap)</ListItem>
      </UnorderedList>

      <Paragraph spacing="sm">
        <strong>spacing=&quot;relaxed&quot;:</strong>
      </Paragraph>
      <UnorderedList spacing="relaxed">
        <ListItem>Элемент 1 (relaxed 12px gap)</ListItem>
        <ListItem>Элемент 2 (relaxed 12px gap)</ListItem>
      </UnorderedList>
    </div>
  ),
};
