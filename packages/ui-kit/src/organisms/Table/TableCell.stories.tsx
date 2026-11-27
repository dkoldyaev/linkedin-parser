import { Badge, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { TableCol } from './TableCol';
import { TableHeader } from './TableHeader';

const meta: Meta<typeof TableCell> = {
  title: 'Organisms/Table/TableCell',
  component: TableCell,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарная ячейка `TableCell` (`Table.Cell`, `role="cell"`) внутри колонки `<TableCol>` или строки `<TableRow>`. Поддерживает пресеты внутренних полей `padding` (`none`, `sm`, `md`), разделительную рамку `bordered` и интерактивное состояние наведения `interactive`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    padding: 'sm',
    bordered: true,
    interactive: false,
  },
  argTypes: {
    padding: {
      control: 'inline-radio',
      options: ['none', 'sm', 'md'],
      description:
        'Внутренние отступы ячейки (`none` — для вложенных карточек `Card` от края до края, `sm` — 8px, `md` — 12px).',
    },
    bordered: {
      control: 'boolean',
      description: 'Добавляет разделительную границу ячейки.',
    },
    interactive: {
      control: 'boolean',
      description: 'Включает курсор `pointer` и подсветку фона при наведении.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableCell>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `TableCell`. Настраивайте `padding`, `bordered` и `interactive` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          TableCell — Ячейка таблицы или колонки (role=&quot;cell&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          padding=&quot;{args.padding}&quot; | bordered={String(args.bordered)} | interactive=
          {String(args.interactive)}
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <TableCol gridUnits={10}>
            <TableHeader>
              <Text variant="mono-label">Демонстрация TableCell</Text>
            </TableHeader>
            <TableBody padding="none">
              <TableCell {...args}>
                <Text as="span" variant="body-sm">
                  Интерактивная ячейка TableCell
                </Text>
                <Badge tone="success" size="xs">
                  Active
                </Badge>
              </TableCell>
            </TableBody>
          </TableCol>
        </div>
      </div>
    </div>
  ),
};

export const PropPadding: Story = {
  name: 'Пропс: padding (Варианты отступов none / sm / md)',
  args: {
    padding: 'md',
    bordered: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `padding` регулирует внутренние отступы ячейки (`none` используется для карточек `Card`, `sm` и `md` — для текстовых строк).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: padding (&quot;none&quot; | &quot;sm&quot; | &quot;md&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените padding в Controls для верхней ячейки и сравните все 3 варианта ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <TableCol gridUnits={10}>
            <TableBody padding="none">
              <TableCell {...args}>
                <Text variant="caption">Активная ячейка: padding=&quot;{args.padding}&quot;</Text>
              </TableCell>
              <TableCell padding="none" bordered>
                <Text variant="caption">padding=&quot;none&quot; (0px)</Text>
              </TableCell>
              <TableCell padding="sm" bordered>
                <Text variant="caption">padding=&quot;sm&quot; (8px)</Text>
              </TableCell>
              <TableCell padding="md" bordered>
                <Text variant="caption">padding=&quot;md&quot; (12px)</Text>
              </TableCell>
            </TableBody>
          </TableCol>
        </div>
      </div>
    </div>
  ),
};

export const PropInteractiveAndBordered: Story = {
  name: 'Пропсы: interactive и bordered (Кликабельная ячейка с рамкой)',
  args: {
    interactive: true,
    bordered: true,
    padding: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `interactive` добавляет визуальный отклик при наведении мыши, а `bordered` отделяет ячейку структурной линией.',
      },
    },
  },
  render: Base.render,
};
