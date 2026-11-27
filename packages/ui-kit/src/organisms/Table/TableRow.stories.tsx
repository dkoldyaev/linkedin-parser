import { Badge, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Table } from './Table';
import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { TableRow } from './TableRow';

const meta: Meta<typeof TableRow> = {
  title: 'Organisms/Table/TableRow',
  component: TableRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Горизонтальная строка записи `TableRow` (`Table.Row`, `role="row"`) для таблиц в режиме `<Table layout="rows">`. Поддерживает нижнюю разделительную границу (`bordered`), интерактивную подсветку при наведении (`interactive`) и выделение выбранной строки (`selected`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    bordered: true,
    interactive: true,
    selected: false,
  },
  argTypes: {
    bordered: {
      control: 'boolean',
      description: 'Отображает нижнюю разделительную линию строки.',
    },
    interactive: {
      control: 'boolean',
      description: 'Включает hover-подсветку и курсор `pointer` для кликабельных строк.',
    },
    selected: {
      control: 'boolean',
      description: 'Подсвечивает строку как выбранную/активную.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableRow>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `TableRow`. Переключайте `bordered`, `interactive` и `selected` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          TableRow — Горизонтальная строка таблицы (role=&quot;row&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          bordered={String(args.bordered)} | interactive={String(args.interactive)} | selected=
          {String(args.selected)}
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Table layout="rows" fullHeight={false} bordered>
          <TableBody padding="none">
            <TableRow {...args}>
              <TableCell padding="md">
                <Text variant="mono">ENT-101</Text>
              </TableCell>
              <TableCell padding="md">
                <Text variant="body-sm">Principal Design Systems Engineer</Text>
              </TableCell>
              <TableCell padding="md">
                <Badge tone="success" size="sm">
                  94% Match
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  ),
};

export const PropSelectedAndInteractive: Story = {
  name: 'Пропсы: selected, interactive и bordered',
  args: {
    selected: true,
    interactive: true,
    bordered: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Сравнение выбранной строки (`selected={true}`) и обычной строки в одной таблице.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: selected, interactive &amp; bordered
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаг selected в панели Controls для первой строки:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Table layout="rows" fullHeight={false} bordered>
          <TableBody padding="none">
            <TableRow {...args}>
              <TableCell padding="md">
                <Text variant="mono">ENT-101 (Настраиваемая строка)</Text>
              </TableCell>
              <TableCell padding="md">
                <Badge tone="accent" size="sm">
                  Selected={String(args.selected)}
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow bordered interactive selected={false}>
              <TableCell padding="md">
                <Text variant="mono">ENT-102 (Обычная строка)</Text>
              </TableCell>
              <TableCell padding="md">
                <Badge tone="neutral" size="sm">
                  Default
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  ),
};
