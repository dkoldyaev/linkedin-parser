import { Button, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Table } from './Table';
import { TableFooter } from './TableFooter';

const meta: Meta<typeof TableFooter> = {
  title: 'Organisms/Table/TableFooter',
  component: TableFooter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент нижней итоговой панели таблицы `TableFooter` (`Table.Footer`, `role="contentinfo"`). Используется для вывода пагинации, количества отображаемых записей и кнопок действий с управляемым горизонтальным выравниванием `justify` (`start`, `center`, `end`, `between`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    justify: 'between',
  },
  argTypes: {
    justify: {
      control: 'inline-radio',
      options: ['start', 'center', 'end', 'between'],
      description: 'Горизонтальное выравнивание элементов внутри футера таблицы.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс контейнера футера.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableFooter>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `TableFooter`. Переключайте `justify` (`start`, `center`, `end`, `between`) через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          TableFooter — Итоговая строка таблицы (role=&quot;contentinfo&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Текущее выравнивание: justify=&quot;{args.justify}&quot;
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Table layout="rows" fullHeight={false} bordered>
          <TableFooter {...args}>
            <Text as="span" variant="caption" tone="secondary">
              Показано 24 из 120 записей
            </Text>
            <Button variant="secondary" size="sm">
              Загрузить ещё
            </Button>
          </TableFooter>
        </Table>
      </div>
    </div>
  ),
};

export const PropJustify: Story = {
  name: 'Пропс: justify (Выравнивание start / center / end / between)',
  args: {
    justify: 'end',
  },
  parameters: {
    controls: { include: ['justify'] },
    docs: {
      description: {
        story:
          'Пропс `justify` определяет распределение дочерних элементов по горизонтали (`between` разносит счетчик и кнопку по краям, `end` прижимает вправо). Доступен только контрол `justify`.',
      },
    },
  },
  render: Base.render,
};
