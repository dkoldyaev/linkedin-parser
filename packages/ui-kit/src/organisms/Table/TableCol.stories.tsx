import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusDot, Text } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { TableCol } from './TableCol';
import { TableHeader } from './TableHeader';

const meta: Meta<typeof TableCol> = {
  title: 'Organisms/Table/TableCol',
  component: TableCol,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Вертикальная колонка `TableCol` (`Table.Col`, `role="region"`) для Канбан-досок и колоночных таблиц. Выравнивает ширину строго кратно 32px ячейкам сетки Blueprint (`gridUnits`, по умолчанию `10` = 320px), поддерживает адаптивное растяжение (`fluid`) и визуальную подсветку активной зоны сброса при перетаскивании карточек (`isDragOver`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    gridUnits: 10,
    fluid: false,
    isDragOver: false,
  },
  argTypes: {
    gridUnits: {
      control: { type: 'number', min: 6, max: 16, step: 2 },
      description:
        'Ширина колонки в 32px ячейках сетки (`6` = 192px, `8` = 256px, `10` = 320px, `12` = 384px, `14` = 448px, `16` = 512px или произвольное число).',
    },
    fluid: {
      control: 'boolean',
      description: 'Если `true`, колонка растягивается на всю доступную ширину (`flex: 1 1 0`).',
    },
    isDragOver: {
      control: 'boolean',
      description: 'Включает акцентную подсветку drop-зоны при наведении перетаскиваемой карточки (Drag-and-Drop).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableCol>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `TableCol`. Настраивайте `gridUnits`, `fluid` и `isDragOver` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          TableCol — Вертикальная колонка на 32px сетке (gridUnits={args.gridUnits})
        </Text>
        <Text variant="caption" tone="secondary">
          Ширина колонки равна {Number(args.gridUnits ?? 10) * 32}px ({args.gridUnits ?? 10} × 32px).
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <TableCol {...args}>
            <TableHeader>
              <Text as="span" variant="mono" weight="semibold" tone="accent">
                [ 01 ]
              </Text>
              <StatusDot tone="primary" size="md" />
              <Text as="span" variant="mono-label" weight="semibold" tone="primary">
                {args.fluid ? 'Fluid Column' : `${args.gridUnits} Units (${Number(args.gridUnits ?? 10) * 32}px)`}
              </Text>
            </TableHeader>
            <TableBody padding="sm">
              <TableCell padding="none">
                <div className={layoutStyles.box}>
                  <Text as="p" variant="caption">
                    Содержимое колонки TableCol.
                  </Text>
                </div>
              </TableCell>
            </TableBody>
          </TableCol>
        </div>
      </div>
    </div>
  ),
};

export const PropGridUnitsAndFluid: Story = {
  name: 'Пропсы: gridUnits и fluid (Ширина в ячейках 32px или резиновая)',
  args: {
    gridUnits: 8,
    fluid: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `gridUnits` фиксирует ширину колонки в кратных 32px единицах, а `fluid={true}` переключает колонку в резиновый режим `flex: 1 1 0`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: gridUnits &amp; fluid
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение колонки из Controls и стандартных ширин 8 (256px) и 10 (320px) ячеек:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <TableCol {...args}>
            <TableHeader>
              <StatusDot tone="info" size="md" />
              <Text as="span" variant="mono-label" weight="semibold">
                Активный образец ({args.fluid ? 'fluid' : `${args.gridUnits}u`})
              </Text>
            </TableHeader>
            <TableBody padding="sm">
              <TableCell padding="sm" bordered>
                <Text variant="caption">Настраиваемая колонка</Text>
              </TableCell>
            </TableBody>
          </TableCol>

          <TableCol gridUnits={10}>
            <TableHeader>
              <StatusDot tone="success" size="md" />
              <Text as="span" variant="mono-label" weight="semibold">
                10 Units (320px)
              </Text>
            </TableHeader>
            <TableBody padding="sm">
              <TableCell padding="sm" bordered>
                <Text variant="caption">Эталонная колонка 320px</Text>
              </TableCell>
            </TableBody>
          </TableCol>
        </div>
      </div>
    </div>
  ),
};

export const PropIsDragOver: Story = {
  name: 'Пропс: isDragOver (Подсветка активной зоны сброса Drag-and-Drop)',
  args: {
    gridUnits: 10,
    isDragOver: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `isDragOver` подсвечивает колонку при наведении перетаскиваемой карточки кандидата.',
      },
    },
  },
  render: Base.render,
};
