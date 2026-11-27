import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTableLoading } from './DataTableLoading';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta<typeof DataTableLoading> = {
  title: 'Organisms/DataTable/DataTableLoading',
  component: DataTableLoading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент состояния загрузки таблицы `DataTableLoading` (`DataTable.Loading`). Композирует `<Spinner size="md">` и моноширинную подпись `<Text variant="mono" tone="secondary">`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    label: 'Загрузка записей таблицы...',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Текст статуса загрузки, отображаемый рядом со спиннером и передаваемый в `aria-label` спиннера.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс контейнера загрузки.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTableLoading>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `DataTableLoading`. Настройте текст `label` в панели Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          DataTableLoading — Индикатор загрузки табличных данных
        </Text>
        <Text variant="caption" tone="secondary">
          Используется внутри &lt;DataTable loading&gt; или самостоятельно.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <DataTableLoading {...args} />
      </div>
    </div>
  ),
};

export const PropLabel: Story = {
  name: 'Пропс: label (Текст статуса загрузки)',
  args: {
    label: 'Синхронизация данных с сервером...',
  },
  parameters: {
    controls: { include: ['label'] },
    docs: {
      description: {
        story: 'Пропс `label` задает видимую подпись и текст для скринридера. Доступен только контрол `label`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: label (string) — Контролы: [label]
        </Text>
        <Text variant="caption" tone="secondary">
          Измените label в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <DataTableLoading label={args.label} />
      </div>
    </div>
  ),
};
