import { Button, Icon, Input, Text } from '../../atoms';
import { Edit3, MessageSquare, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { StepperItem } from './StepperItem';

const ACTIONS_MAP = {
  none: undefined,
  EditAndDeleteBtns: (
    <div className={layoutStyles.row}>
      <Button variant="ghost" size="icon-xs" aria-label="Edit comment">
        <Icon icon={Edit3} size="2xs" />
      </Button>
      <Button variant="ghost" size="icon-xs" tone="danger" aria-label="Delete comment">
        <Icon icon={Trash2} size="2xs" />
      </Button>
    </div>
  ),
  AddCommentBtn: (
    <Button variant="ghost" size="icon-xs" aria-label="Add comment">
      <Icon icon={MessageSquare} size="2xs" />
    </Button>
  ),
} as const;

const CONTENT_SLOT_MAP = {
  none: undefined,
  CommentEditor: (
    <div className={layoutStyles.row}>
      <Input size="sm" defaultValue="Интервьюер отметил глубокие знания React 19" aria-label="Comment input" />
      <Button size="sm" variant="primary">
        Сохранить
      </Button>
    </div>
  ),
} as const;

const meta: Meta<typeof StepperItem> = {
  title: 'Molecules/Stepper/StepperItem',
  component: StepperItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент отдельного шага таймлайна `StepperItem` (`Stepper.Item`). Отображает индикатор `<StatusDot>`, вертикальную соединительную линию (`!isLast`), бейджи перехода (`fromLabel` -> `label`), длительность (`duration`), метку времени (`timestamp`), описание (`description`), а также слоты `actions` и `contentSlot` (например для инлайн-редактора комментария к этапу).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    id: 'step-item-demo',
    fromLabel: 'Отклик отправлен',
    label: 'Техническое интервью',
    timestamp: '14 нояб., 15:00',
    duration: '4д',
    description: 'Проведено 60-минутное системное интервью с архитектором.',
    tone: 'success',
    active: true,
    isLast: false,
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Название целевого этапа перехода (отображается в `<Badge>`).',
    },
    fromLabel: {
      control: 'text',
      description: 'Название исходного этапа перед стрелкой `ArrowRight`.',
    },
    timestamp: {
      control: 'text',
      description: 'Дата и время события (`<Text as="time" variant="mono">`).',
    },
    duration: {
      control: 'text',
      description: 'Длительность пребывания на этапе (`<Badge variant="counter">`).',
    },
    description: {
      control: 'text',
      description: 'Комментарий или описание под шапкой шага.',
    },
    tone: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'secondary',
        'muted',
        'accent',
        'success',
        'warning',
        'danger',
        'info',
      ],
      description: 'Семантический цветовой тон точки `StatusDot` и бейджа `label`.',
    },
    active: {
      control: 'boolean',
      description: 'Отмечает шаг как текущий активный (включает пульсацию `StatusDot` и заливку `solid`).',
    },
    isLast: {
      control: 'boolean',
      description: 'Если `true`, скрывает нижнюю соединительную линию таймлайна.',
    },
    actions: {
      control: 'select',
      options: Object.keys(ACTIONS_MAP),
      mapping: ACTIONS_MAP,
      description: 'Слот для кнопок действий (например редактирование/удаление комментария) в правой части шапки шага.',
    },
    contentSlot: {
      control: 'select',
      options: Object.keys(CONTENT_SLOT_MAP),
      mapping: CONTENT_SLOT_MAP,
      description: 'Интерактивный слот под описанием шага (например форма ввода комментария).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StepperItem>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `StepperItem`. Настраивайте все пропсы (`fromLabel`, `label`, `duration`, `timestamp`, `description`, `tone`, `active`, `isLast`, `actions`, `contentSlot`) через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          StepperItem — Отдельный шаг вертикального таймлайна
        </Text>
        <Text variant="caption" tone="secondary">
          Композирует StatusDot, Badge, Icon(ArrowRight), Text и интерактивные слоты.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ol>
          <StepperItem {...args} />
        </ol>
      </div>
    </div>
  ),
};

export const PropFromLabelAndLabel: Story = {
  name: 'Пропсы: fromLabel, label, duration, timestamp',
  args: {
    fromLabel: 'CV Adapted',
    label: 'Technical Screening',
    duration: '2д',
    timestamp: '14 нояб., 15:00',
  },
  parameters: {
    controls: { include: ['fromLabel', 'label', 'duration', 'timestamp'] },
    docs: {
      description: {
        story:
          'Если передан `fromLabel`, перед основным бейджем `label` рендерится контурный бейдж предыдущего этапа и иконка стрелки `ArrowRight`. Доступны только контролы `fromLabel`, `label`, `duration` и `timestamp`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: fromLabel, label, duration &amp; timestamp — Контролы: [fromLabel, label, duration, timestamp]
        </Text>
        <Text variant="caption" tone="secondary">
          Очистите fromLabel в Controls, чтобы увидеть одиночный бейдж без стрелки перехода:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ol>
          <StepperItem
            id="from-label-demo"
            fromLabel={args.fromLabel}
            label={args.label}
            duration={args.duration}
            timestamp={args.timestamp}
            tone="info"
          />
        </ol>
      </div>
    </div>
  ),
};

export const PropActiveToneAndIsLast: Story = {
  name: 'Пропсы: active, tone и isLast (Состояние точки и линии трека)',
  args: {
    tone: 'success',
    active: true,
    isLast: true,
  },
  parameters: {
    controls: { include: ['active', 'tone', 'isLast'] },
    docs: {
      description: {
        story:
          'Пропс `active` включает пульсацию `StatusDot`, `tone` задает семантический цвет, а `isLast={true}` убирает вертикальную соединительную линию под точкой. Доступны только контролы `active`, `tone` и `isLast`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: active, tone &amp; isLast — Контролы: [active, tone, isLast]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаги active, tone и isLast в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ol>
          <StepperItem
            id="active-tone-demo"
            label="Финальный оффер"
            tone={args.tone}
            active={args.active}
            isLast={args.isLast}
            description="Состояние индикатора и соединительной линии."
          />
        </ol>
      </div>
    </div>
  ),
};

export const PropActionsAndContentSlot: Story = {
  name: 'Пропсы: actions и contentSlot (Кнопки действий и инлайн-редактор)',
  args: {
    actions: ACTIONS_MAP.EditAndDeleteBtns,
    contentSlot: CONTENT_SLOT_MAP.CommentEditor,
  },
  parameters: {
    controls: { include: ['actions', 'contentSlot'] },
    docs: {
      description: {
        story:
          'Пропс `actions` размещает иконочные кнопки справа от времени шага, а `contentSlot` рендерит произвольную интерактивную форму (например редактирование комментария) под шагом. Доступны только контролы `actions` и `contentSlot`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: actions &amp; contentSlot — Контролы: [actions, contentSlot]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте варианты actions и contentSlot в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ol>
          <StepperItem
            id="actions-slot-demo"
            label="Собеседование с CTO"
            timestamp="15 нояб., 18:00"
            actions={args.actions}
            contentSlot={args.contentSlot}
          />
        </ol>
      </div>
    </div>
  ),
};
