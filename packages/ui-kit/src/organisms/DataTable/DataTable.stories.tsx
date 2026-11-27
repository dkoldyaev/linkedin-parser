import { Badge, Button, Text } from '../../atoms';
import { DataTable, type DataTableColumn } from './DataTable';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

interface QueueRow {
  readonly id: string;
  readonly jobTitle: string;
  readonly company: string;
  readonly status: 'processing' | 'queued' | 'failed';
  readonly attempts: number;
}

const SAMPLE_ROWS: readonly QueueRow[] = [
  {
    id: 'TASK-101',
    jobTitle: 'Principal Design Systems Engineer',
    company: 'Linear',
    status: 'processing',
    attempts: 1,
  },
  {
    id: 'TASK-102',
    jobTitle: 'Senior React Platform Engineer',
    company: 'Vercel',
    status: 'queued',
    attempts: 0,
  },
  {
    id: 'TASK-103',
    jobTitle: 'Staff UI Engineer',
    company: 'Figma',
    status: 'failed',
    attempts: 3,
  },
];

const COLUMNS: readonly DataTableColumn<QueueRow>[] = [
  {
    id: 'id',
    header: 'Task ID',
    accessor: 'id',
    sortable: true,
    gridUnits: 4,
    cell: (row) => <Text variant="mono">{row.id}</Text>,
  },
  {
    id: 'jobTitle',
    header: 'Vacancy Title',
    accessor: 'jobTitle',
    sortable: true,
    gridUnits: 8,
  },
  {
    id: 'company',
    header: 'Company',
    accessor: 'company',
    sortable: true,
    gridUnits: 4,
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    gridUnits: 4,
    sortValue: (row) => row.status,
    cell: (row) => (
      <Badge
        size="sm"
        tone={
          row.status === 'processing' ? 'accent' : row.status === 'queued' ? 'warning' : 'danger'
        }
      >
        {row.status}
      </Badge>
    ),
  },
];

const meta: Meta<typeof DataTable<QueueRow>> = {
  title: 'Organisms/DataTable/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Типизированный табличный организм `DataTable<T>` на 32px сетке Blueprint. Поддерживает декларативное описание колонок (`columns` с ширинами `gridUnits`), сортировку через `<SortButton>`, состояние загрузки (`loading` -> `<DataTableLoading>`), пустое состояние (`<EmptyState>`) и кликабельные строки (`onRowClick`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    columns: COLUMNS,
    data: SAMPLE_ROWS,
    getRowId: (row: QueueRow) => row.id,
    loading: false,
    loadingLabel: 'Синхронизация очереди фоновых задач...',
    emptyTitle: 'Очередь задач пуста',
    emptyDescription: 'Все задачи парсинга и LLM-адаптации завершены.',
    caption: 'Активные задачи фонового воркера',
  },
  argTypes: {
    columns: {
      control: 'object',
      description: 'Массив описаний колонок `DataTableColumn<T>[]` (`id`, `header`, `accessor`, `cell`, `sortable`, `gridUnits`).',
    },
    data: {
      control: 'object',
      description: 'Массив строк данных `T[]`.',
    },
    loading: {
      control: 'boolean',
      description: 'Если `true`, вместо таблицы рендерит `<DataTableLoading>` со спиннером.',
    },
    loadingLabel: {
      control: 'text',
      description: 'Текст статуса загрузки для `<DataTableLoading>`.',
    },
    emptyTitle: {
      control: 'text',
      description: 'Заголовок `<EmptyState>` при пустом массиве `data`.',
    },
    emptyDescription: {
      control: 'text',
      description: 'Описание `<EmptyState>` при пустом массиве `data`.',
    },
    caption: {
      control: 'text',
      description: 'Семантический заголовок `<caption>` таблицы.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable<QueueRow>>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `DataTable`. Кликните по заголовкам колонок для сортировки или настройте `loading`, `loadingLabel`, `caption` в панели Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          DataTable — Типизированная таблица с сортировкой и 32px сеткой колонок
        </Text>
        <Text variant="caption" tone="secondary">
          Нажмите на заголовки Task ID, Vacancy Title, Company или Status для сортировки строк.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <DataTable {...args} />
      </div>
    </div>
  ),
};

export const PropColumnsAndData: Story = {
  name: 'Пропсы: columns и data (Схема колонок и массив записей)',
  args: {
    columns: COLUMNS,
    data: SAMPLE_ROWS,
  },
  parameters: {
    controls: { include: ['data', 'caption'] },
    docs: {
      description: {
        story:
          'Пропс `columns` задает заголовки, ширину в ячейках 32px (`gridUnits`), рендереры ячеек (`cell`) и флаги сортировки (`sortable`), а `data` передает строки таблицы. Доступны только контролы `data` и `caption`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: columns &amp; data — Контролы: [data, caption]
        </Text>
        <Text variant="caption" tone="secondary">
          Таблица с 4 колонками, квантованными по сетке через useDataTableColumns:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <DataTable
          columns={COLUMNS}
          data={args.data}
          caption={args.caption}
          getRowId={(row: QueueRow) => row.id}
        />
      </div>
    </div>
  ),
};

export const PropLoadingAndLoadingLabel: Story = {
  name: 'Пропсы: loading и loadingLabel (Состояние загрузки)',
  args: {
    loading: true,
    loadingLabel: 'Загрузка очереди парсинга из Mercure...',
  },
  parameters: {
    controls: { include: ['loading', 'loadingLabel'] },
    docs: {
      description: {
        story:
          'При `loading={true}` компонент делегирует рендеринг подкомпоненту `<DataTableLoading label={loadingLabel} />`. Доступны только контролы `loading` и `loadingLabel`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: loading &amp; loadingLabel — Контролы: [loading, loadingLabel]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг loading и измените loadingLabel в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <DataTable
          columns={COLUMNS}
          data={SAMPLE_ROWS}
          getRowId={(row: QueueRow) => row.id}
          loading={args.loading}
          loadingLabel={args.loadingLabel}
        />
      </div>
    </div>
  ),
};

export const PropEmptyStateFallbacks: Story = {
  name: 'Пропсы: emptyTitle, emptyDescription (Пустая таблица)',
  args: {
    emptyTitle: 'ОЧЕРЕДЬ ЗАДАЧ ПУСТА',
    emptyDescription: 'Добавьте новую ссылку на вакансию для запуска фонового парсинга.',
  },
  parameters: {
    controls: { include: ['emptyTitle', 'emptyDescription'] },
    docs: {
      description: {
        story:
          'Когда `data.length === 0` и `loading === false`, вместо `<table>` рендерится молекула `<EmptyState>` с переданными пропсами `emptyTitle`, `emptyDescription` и `emptyAction`. Доступны только контролы `emptyTitle` и `emptyDescription`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: emptyTitle &amp; emptyDescription (при data=[]) — Контролы: [emptyTitle, emptyDescription]
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте заголовок и описание пустого состояния в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <DataTable
          columns={COLUMNS}
          data={[]}
          getRowId={(row: QueueRow) => row.id}
          emptyTitle={args.emptyTitle}
          emptyDescription={args.emptyDescription}
          emptyAction={
            <Button variant="primary" size="sm">
              Обновить очередь
            </Button>
          }
        />
      </div>
    </div>
  ),
};
