import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Stepper } from './Stepper';
import { Text } from '../../atoms';

const SAMPLE_STEPS = [
  {
    id: 'step-1',
    label: 'Импортировано из LinkedIn',
    timestamp: '10 нояб., 09:15',
    tone: 'neutral' as const,
    description: 'Запись создана автоматически фоновым воркером.',
  },
  {
    id: 'step-2',
    fromLabel: 'Импортировано',
    label: 'CV адаптировано',
    duration: '12м',
    timestamp: '10 нояб., 09:27',
    tone: 'info' as const,
    description: 'Сгенерирована версия резюме v2 с 91% совпадением ключевых слов.',
  },
  {
    id: 'step-3',
    fromLabel: 'CV адаптировано',
    label: 'Отклик отправлен',
    duration: '2ч',
    timestamp: '10 нояб., 11:30',
    tone: 'accent' as const,
  },
  {
    id: 'step-4',
    fromLabel: 'Отклик отправлен',
    label: 'Техническое интервью',
    duration: '4д',
    timestamp: '14 нояб., 15:00',
    tone: 'success' as const,
    active: true,
    description: 'Назначено 60-минутное интервью по архитектуре фронтенда.',
  },
];

const meta: Meta<typeof Stepper> = {
  title: 'Molecules/Stepper/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула вертикального таймлайна `Stepper` для отображения истории переходов по этапам. Композирует дочерние элементы `<StepperItem>`, кнопку сворачивания ранних шагов (`maxCollapsedItems`) и заглушку `<EmptyState>` при пустом массиве `items`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    items: SAMPLE_STEPS,
    maxCollapsedItems: undefined,
    collapseLabel: 'Свернуть ранние этапы',
    emptyTitle: 'История этапов пуста',
    emptyDescription: 'Перемещайте карточку по колонкам Канбан-доски для записи истории.',
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Массив шагов таймлайна `StepperItemData[]`.',
    },
    maxCollapsedItems: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description:
        'Если количество шагов превышает это число, более ранние шаги скрываются под кнопкой раскрытия.',
    },
    collapseLabel: {
      control: 'text',
      description: 'Текст кнопки сворачивания ранее раскрытых шагов истории.',
    },
    emptyTitle: {
      control: 'text',
      description: 'Заголовок `<EmptyState>`, отображаемый при `items.length === 0`.',
    },
    emptyDescription: {
      control: 'text',
      description: 'Описание `<EmptyState>`, отображаемое при `items.length === 0`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Stepper`. Настраивайте `items`, `maxCollapsedItems`, `collapseLabel`, `emptyTitle` и `emptyDescription` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Stepper — Вертикальный таймлайн истории переходов
        </Text>
        <Text variant="caption" tone="secondary">
          Отображает хронологию смены статусов с индикаторами StatusDot, Badge и временем.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Stepper {...args} />
      </div>
    </div>
  ),
};

export const PropMaxCollapsedItemsAndCollapseLabel: Story = {
  name: 'Пропсы: maxCollapsedItems и collapseLabel (Сворачивание истории)',
  args: {
    maxCollapsedItems: 2,
    collapseLabel: 'Скрыть ранние переходы',
  },
  parameters: {
    controls: { include: ['maxCollapsedItems', 'collapseLabel'] },
    docs: {
      description: {
        story:
          'Пропс `maxCollapsedItems` ограничивает число сразу видимых последних шагов и добавляет сверху кнопку раскрытия остальных записей. Доступны только контролы `maxCollapsedItems` и `collapseLabel`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: maxCollapsedItems &amp; collapseLabel — Контролы: [maxCollapsedItems, collapseLabel]
        </Text>
        <Text variant="caption" tone="secondary">
          Нажмите на кнопку над списком для раскрытия 2 скрытых ранних шагов:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Stepper
          items={SAMPLE_STEPS}
          maxCollapsedItems={args.maxCollapsedItems}
          collapseLabel={args.collapseLabel}
        />
      </div>
    </div>
  ),
};

export const PropEmptyTitleAndEmptyDescription: Story = {
  name: 'Пропсы: emptyTitle и emptyDescription (Пустое состояние)',
  args: {
    emptyTitle: 'НЕТ ЗАПИСЕЙ О ПЕРЕМЕЩЕНИЯХ',
    emptyDescription: 'История появится автоматически после первого изменения статуса вакансии.',
  },
  parameters: {
    controls: { include: ['emptyTitle', 'emptyDescription'] },
    docs: {
      description: {
        story:
          'Если массив `items` пуст, `Stepper` автоматически рендерит молекулу `<EmptyState>` с заголовком `emptyTitle` и пояснением `emptyDescription`. Доступны только контролы `emptyTitle` и `emptyDescription`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: emptyTitle &amp; emptyDescription (при items=[]) — Контролы: [emptyTitle, emptyDescription]
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте тексты пустого состояния в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Stepper items={[]} emptyTitle={args.emptyTitle} emptyDescription={args.emptyDescription} />
      </div>
    </div>
  ),
};
