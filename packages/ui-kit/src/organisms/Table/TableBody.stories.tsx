import { Icon, StatusDot, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../Card';
import { EmptyState } from '../../molecules';
import { Inbox } from 'lucide-react';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { TableCol } from './TableCol';
import { TableHeader } from './TableHeader';

const EMPTY_STATE_MAP = {
  none: undefined,
  EmptyColumnState: (
    <EmptyState
      icon={<Icon icon={Inbox} size="md" tone="muted" />}
      title="Колонка пуста"
      description="Нет карточек на данном этапе."
    />
  ),
} as const;

const meta: Meta<typeof TableBody> = {
  title: 'Organisms/Table/TableBody',
  component: TableBody,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Прокручиваемый вертикальный контейнер тела колонки или таблицы `TableBody` (`Table.Body`). Интегрирует хук `useGridScroll()` для автоматической доводки вертикального скролла по 32px сетке Blueprint (`snapScroll`), поддерживает настройку внутренних отступов (`padding`), расстояния между карточками (`gap`) и слот пустого состояния (`emptyState`), отображаемый при отсутствии дочерних элементов.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    scrollable: true,
    snapScroll: true,
    gap: 'sm',
    padding: 'sm',
    emptyState: EMPTY_STATE_MAP.EmptyColumnState,
  },
  argTypes: {
    scrollable: {
      control: 'boolean',
      description: 'Включает вертикальную прокрутку контейнера (`overflow-y: auto`).',
    },
    snapScroll: {
      control: 'boolean',
      description: 'При `scrollable={true}` плавно выравнивает позицию скролла кратно 32px сетке.',
    },
    gap: {
      control: 'inline-radio',
      options: ['none', 'sm', 'md'],
      description: 'Вертикальное расстояние (`gap`) между дочерними ячейками `<TableCell>`.',
    },
    padding: {
      control: 'inline-radio',
      options: ['none', 'sm', 'md'],
      description: 'Внутренние отступы тела колонки/таблицы.',
    },
    emptyState: {
      control: 'select',
      options: Object.keys(EMPTY_STATE_MAP),
      mapping: EMPTY_STATE_MAP,
      description: 'React-узел (обычно `<EmptyState>`), отображаемый когда `children` пусты.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableBody>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `TableBody`. Настраивайте `scrollable`, `snapScroll`, `gap` и `padding` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          TableBody — Тело колонки/таблицы с 32px snap-скроллом
        </Text>
        <Text variant="caption" tone="secondary">
          padding=&quot;{args.padding}&quot; | gap=&quot;{args.gap}&quot; | snapScroll=
          {String(args.snapScroll)}
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <TableCol gridUnits={10}>
            <TableHeader>
              <StatusDot tone="primary" size="md" />
              <Text variant="mono-label" weight="semibold">
                Активные карточки
              </Text>
            </TableHeader>
            <TableBody {...args}>
              <TableCell padding="none">
                <Card compact interactive tone="success" overline="Stripe" title="Staff UI Architect" />
              </TableCell>
              <TableCell padding="none">
                <Card compact interactive tone="warning" overline="Linear" title="Product Engineer" />
              </TableCell>
            </TableBody>
          </TableCol>
        </div>
      </div>
    </div>
  ),
};

export const PropPaddingAndGap: Story = {
  name: 'Пропсы: padding и gap (Отступы и интервал между ячейками)',
  args: {
    padding: 'md',
    gap: 'md',
  },
  parameters: {
    controls: { include: ['padding', 'gap'] },
    docs: {
      description: {
        story:
          'Пропсы `padding` и `gap` принимают значения `"none" | "sm" | "md"`. Доступны только контролы `padding` и `gap`.',
      },
    },
  },
  render: Base.render,
};

export const PropEmptyState: Story = {
  name: 'Пропс: emptyState (Заглушка при пустом списке children)',
  args: {
    emptyState: EMPTY_STATE_MAP.EmptyColumnState,
  },
  parameters: {
    controls: { include: ['emptyState'] },
    docs: {
      description: {
        story:
          'Если внутрь `<TableBody>` не передано ни одного дочернего элемента (`React.Children.count(children) === 0`), автоматически рендерится содержимое пропса `emptyState`. Доступен только контрол `emptyState`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: emptyState (при отсутствии children) — Контролы: [emptyState]
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите вариант emptyState в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <TableCol gridUnits={10}>
            <TableHeader>
              <StatusDot tone="muted" size="md" />
              <Text variant="mono-label" weight="semibold">
                Пустая колонка
              </Text>
            </TableHeader>
            <TableBody padding="sm" emptyState={args.emptyState} />
          </TableCol>
        </div>
      </div>
    </div>
  ),
};
