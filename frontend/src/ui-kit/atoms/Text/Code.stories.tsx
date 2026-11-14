import type { Meta, StoryObj } from '@storybook/react-vite';
import { Code, Kbd } from './Code';
import { Link } from './Link';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Code> = {
  title: 'Atoms/Code',
  component: Code,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Code>;

export const InlineCodeSnippet: Story = {
  render: () => (
    <div>
      <Paragraph spacing="md">
        Для управления состоянием колонок используйте хук <Code>useControllableState</Code> или
        проп <Code>layout=&quot;columns&quot;</Code> компонента <Code>&lt;Table&gt;</Code>.
      </Paragraph>
      <Paragraph spacing="md">
        Ширина дорожки канбана фиксируется переменной <Code>calc(var(--ui-grid-cell) * 10)</Code> для
        полного соответствия чертежной сетке 32px.
      </Paragraph>
    </div>
  ),
};

export const KeyboardShortcuts: Story = {
  render: () => (
    <div>
      <Paragraph spacing="sm">
        Быстрый поиск по вакансиям: <Kbd>⌘</Kbd> <Kbd>K</Kbd> или <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
      </Paragraph>
      <Paragraph spacing="sm">
        Сброс выделения карточек: <Kbd>Esc</Kbd>
      </Paragraph>
      <Paragraph spacing="sm">
        Перемещение выбранной вакансии на следующий этап: <Kbd>Shift</Kbd> + <Kbd>→</Kbd>
      </Paragraph>
      <Paragraph spacing="sm">
        Сохранение заметок: <Kbd>⌘</Kbd> + <Kbd>Enter</Kbd>
      </Paragraph>
    </div>
  ),
};

export const Hyperlinks: Story = {
  render: () => (
    <div>
      <Paragraph spacing="sm">
        Ознакомьтесь с <Link href="https://linkedin.com" external>оригиналом вакансии на LinkedIn</Link>.
      </Paragraph>
      <Paragraph spacing="sm">
        Перейти в раздел <Link href="#details">детальной совместимости с резюме</Link>.
      </Paragraph>
    </div>
  ),
};
