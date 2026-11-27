import { Button, Icon, StatusDot, Text } from '../../atoms';
import { Card, CardFooter } from './Card';
import { ChevronLeft, ChevronRight, History, RotateCcw, X } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup } from '../../molecules';
import layoutStyles from '../../stories/StoryLayout.module.css';

const META_SLOT_MAP = {
  DateAndHistory: (
    <div className={layoutStyles.row}>
      <Text variant="caption" tone="muted">
        14 нояб.
      </Text>
      <Text
        variant="caption"
        tone="muted"
        startIcon={<Icon icon={History} size="2xs" />}
        endIcon={<StatusDot tone="info" size="xs" />}
      >
        3
      </Text>
    </div>
  ),
  ArchivedDate: (
    <Text variant="caption" tone="muted">
      1 нояб. (В архиве)
    </Text>
  ),
} as const;

const ACTIONS_SLOT_MAP = {
  StageArrowsGroup: (
    <ButtonGroup>
      <Button variant="ghost" size="icon" aria-label="Move left">
        <Icon icon={ChevronLeft} size="sm" />
      </Button>
      <Button variant="ghost" size="icon" tone="danger" aria-label="Reject">
        <Icon icon={X} size="sm" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Move right">
        <Icon icon={ChevronRight} size="sm" />
      </Button>
    </ButtonGroup>
  ),
  RestoreButton: (
    <Button variant="secondary" size="sm" startIcon={<Icon icon={RotateCcw} size="xs" />}>
      Восстановить
    </Button>
  ),
} as const;

const meta: Meta<typeof CardFooter> = {
  title: 'Organisms/Card/CardFooter',
  component: CardFooter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент нижней строки карточки `CardFooter` (`Card.Footer`) фиксированной высоты 32px (1 ячейка сетки Blueprint). Разделен на левый слот метаданных `metaSlot` (даты, счетчик истории) и правый слот быстрых действий `actionsSlot` (кнопки перемещения по этапам с автоматическим `stopPropagation`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    metaSlot: META_SLOT_MAP.DateAndHistory,
    actionsSlot: ACTIONS_SLOT_MAP.StageArrowsGroup,
  },
  argTypes: {
    metaSlot: {
      control: 'select',
      options: Object.keys(META_SLOT_MAP),
      mapping: META_SLOT_MAP,
      description: 'Левый слот для дат, счетчиков истории и индикаторов.',
    },
    actionsSlot: {
      control: 'select',
      options: Object.keys(ACTIONS_SLOT_MAP),
      mapping: ACTIONS_SLOT_MAP,
      description: 'Правый слот для кнопок быстрых действий или `<ButtonGroup>`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardFooter>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `CardFooter`. Переключайте варианты `metaSlot` и `actionsSlot` в панели Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          CardFooter — Нижняя 32px строка метаданных и действий карточки
        </Text>
        <Text variant="caption" tone="secondary">
          Клики по кнопкам в actionsSlot изолированы через stopPropagation.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card tone="success">
            <CardFooter {...args} />
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const PropMetaSlot: Story = {
  name: 'Пропс: metaSlot (Левый слот даты и истории)',
  args: {
    metaSlot: META_SLOT_MAP.DateAndHistory,
  },
  parameters: {
    controls: { include: ['metaSlot'] },
    docs: {
      description: {
        story:
          'Пропс `metaSlot` размещает в левой части футера дату добавления карточки, иконку истории и индикатор наличия комментария. Доступен только контрол `metaSlot`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: metaSlot — Контролы: [metaSlot]
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите вариант metaSlot в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card tone="info">
            <CardFooter metaSlot={args.metaSlot} />
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const PropActionsSlot: Story = {
  name: 'Пропс: actionsSlot (Правый слот быстрых действий)',
  args: {
    actionsSlot: ACTIONS_SLOT_MAP.RestoreButton,
  },
  parameters: {
    controls: { include: ['actionsSlot'] },
    docs: {
      description: {
        story:
          'Пропс `actionsSlot` рендерит кнопки управления карточкой в правой части футера (например стрелки перемещения по колонкам или кнопку восстановления из архива). Доступен только контрол `actionsSlot`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: actionsSlot — Контролы: [actionsSlot]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте actionsSlot между группой стрелок и кнопкой восстановления в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card tone="danger">
            <CardFooter metaSlot={META_SLOT_MAP.ArchivedDate} actionsSlot={args.actionsSlot} />
          </Card>
        </div>
      </div>
    </div>
  ),
};
