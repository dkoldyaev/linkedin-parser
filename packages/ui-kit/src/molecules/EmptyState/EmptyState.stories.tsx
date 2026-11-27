import { Briefcase, Inbox, Plus, RefreshCw, Search } from 'lucide-react';
import { Button, Icon, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState';
import layoutStyles from '../../stories/StoryLayout.module.css';

const ICON_MAP = {
  none: undefined,
  Briefcase: <Icon icon={Briefcase} size="lg" tone="accent" />,
  Inbox: <Icon icon={Inbox} size="lg" tone="muted" />,
  Search: <Icon icon={Search} size="lg" tone="info" />,
} as const;

const ACTION_MAP = {
  none: undefined,
  AddJobButton: (
    <Button variant="primary" size="sm" startIcon={<Icon icon={Plus} size="xs" />}>
      Добавить вакансию
    </Button>
  ),
  RefreshButton: (
    <Button variant="secondary" size="sm" startIcon={<Icon icon={RefreshCw} size="xs" />}>
      Обновить список
    </Button>
  ),
} as const;

const meta: Meta<typeof EmptyState> = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула пустого состояния `EmptyState` для таблиц без данных, пустых колонок Канбан-доски и очередей задач. Автоматически квантует высоту кратно 32px сетке Blueprint (`data-min-grids="4"`, `useBlueprintGrid`) и композирует `<Text variant="mono-label">`, описание `<Text variant="caption">` и слоты `icon` / `action`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    icon: <Icon icon={Briefcase} size="lg" tone="accent" />,
    title: 'НЕТ АКТИВНЫХ ЗАДАЧ В ОЧЕРЕДИ',
    description: 'Все задачи парсинга LinkedIn и AI-адаптации резюме успешно завершены.',
    action: (
      <Button variant="primary" size="sm" startIcon={<Icon icon={Plus} size="xs" />}>
        Добавить URL вакансии
      </Button>
    ),
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Основной моноширинный заголовок пустого состояния (`<h3>`).',
    },
    description: {
      control: 'text',
      description: 'Поясняющий текст под заголовком.',
    },
    icon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Иконка над заголовком (`<Icon />`).',
    },
    action: {
      control: 'select',
      options: Object.keys(ACTION_MAP),
      mapping: ACTION_MAP,
      description: 'Слот для кнопки целевого действия (`<Button />`) в нижней части блока.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `EmptyState`. Настраивайте `title`, `description`, `icon` и `action` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          EmptyState — Заглушка пустого списка или колонки
        </Text>
        <Text variant="caption" tone="secondary">
          Минимальная высота составляет 4 ячейки сетки (128px) с автоматическим выравниванием по
          центру.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <EmptyState {...args} />
      </div>
    </div>
  ),
};

export const PropTitleAndDescription: Story = {
  name: 'Пропсы: title и description (Заголовок и пояснение)',
  args: {
    title: 'ЭТАП ПУСТ',
    description: 'Перетащите карточку кандидата в эту колонку для смены статуса.',
    icon: undefined,
    action: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `title` обязателен и задает заголовок блока, а `description` добавляет вторичный поясняющий текст.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: title &amp; description
        </Text>
        <Text variant="caption" tone="secondary">
          Отредактируйте title и description в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <EmptyState {...args} />
      </div>
    </div>
  ),
};

export const PropIconAndAction: Story = {
  name: 'Пропсы: icon и action (Иконка и кнопка действия)',
  args: {
    icon: <Icon icon={Search} size="lg" tone="info" />,
    title: 'НИЧЕГО НЕ НАЙДЕНО ПО ФИЛЬТРАМ',
    description: 'Попробуйте сбросить поисковый запрос или выбранные теги.',
    action: (
      <Button variant="secondary" size="sm" startIcon={<Icon icon={RefreshCw} size="xs" />}>
        Сбросить фильтры
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `icon` добавляет визуальный маркер сверху, а `action` рендерит CTA-кнопку для выхода из пустого состояния.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: icon &amp; action
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите варианты icon и action в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <EmptyState {...args} />
      </div>
    </div>
  ),
};
