import { Badge, Button, Icon, Text } from '../../atoms';
import { Ban, MoreVertical } from 'lucide-react';
import { Card, CardBody, CardHeader } from './Card';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const STATUS_MAP = {
  none: undefined,
  InterviewBadge: (
    <Badge variant="outline" tone="info" size="xs">
      Interview
    </Badge>
  ),
  ClosedBadge: (
    <Badge variant="outline" tone="danger" size="xs" icon={<Icon icon={Ban} size="2xs" />}>
      Closed
    </Badge>
  ),
} as const;

const ACTIONS_MAP = {
  none: undefined,
  MoreMenuBtn: (
    <Button variant="ghost" size="icon-xs" aria-label="Card actions">
      <Icon icon={MoreVertical} size="xs" />
    </Button>
  ),
} as const;

const meta: Meta<typeof CardHeader> = {
  title: 'Organisms/Card/CardHeader',
  component: CardHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент верхней части карточки `CardHeader` (`Card.Header`). Рендерит опциональный чекбокс выбора (`selectable`, `checked`), моноширинный `overline` (или внешнюю ссылку при `overlineHref`), заголовок `<Heading level={3}>`, подзаголовок `subtitle`, правый слот статусных бейджей `statusIndicators` и слот кнопок `headerActions`. В режиме `compact` объединяет `overline / title` в одну строку с многоточием.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'Staff Frontend Architect (Design Systems)',
    subtitle: 'Core product infra & design systems team',
    overline: 'Stripe',
    overlineHref: 'https://stripe.com',
    selectable: true,
    checked: false,
    checkboxAriaLabel: 'Выбрать карточку',
    compact: false,
    statusIndicators: STATUS_MAP.InterviewBadge,
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Основной заголовок карточки.',
    },
    subtitle: {
      control: 'text',
      description: 'Вторичный подзаголовок под заголовком.',
    },
    overline: {
      control: 'text',
      description: 'Верхняя моноширинная метка (например название компании).',
    },
    overlineHref: {
      control: 'text',
      description: 'URL для превращения `overline` во внешнюю ссылку `<Link external>`.',
    },
    selectable: {
      control: 'boolean',
      description: 'Включает отображение чекбокса массового выбора в мета-строке.',
    },
    checked: {
      control: 'boolean',
      description: 'Отмеченное состояние чекбокса.',
    },
    checkboxAriaLabel: {
      control: 'text',
      description: 'Доступная метка `aria-label` для чекбокса.',
    },
    statusIndicators: {
      control: 'select',
      options: Object.keys(STATUS_MAP),
      mapping: STATUS_MAP,
      description: 'Слот для статусных бейджей в правом верхнем углу.',
    },
    headerActions: {
      control: 'select',
      options: Object.keys(ACTIONS_MAP),
      mapping: ACTIONS_MAP,
      description: 'Слот для кнопок действий в шапке карточки.',
    },
    compact: {
      control: 'boolean',
      description: 'Включает однострочный компактный режим `overline / title`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardHeader>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `CardHeader`. Настраивайте `title`, `subtitle`, `overline`, `overlineHref`, `selectable`, `checked`, `compact` и `statusIndicators` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          CardHeader — Заголовочная секция карточки
        </Text>
        <Text variant="caption" tone="secondary">
          Композирует Checkbox, Link, Heading(level=3), Text и слоты индикаторов.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card tone="success">
            <CardBody snapToGrid={false}>
              <CardHeader {...args} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const PropOverlineAndOverlineHref: Story = {
  name: 'Пропсы: overline и overlineHref (Компания и внешняя ссылка)',
  args: {
    overline: 'Linear',
    overlineHref: 'https://linear.app',
  },
  parameters: {
    controls: { include: ['overline', 'overlineHref'] },
    docs: {
      description: {
        story:
          'Когда задан `overlineHref`, текст `overline` рендерится как внешняя ссылка `<Link external>` с иконкой перехода; если `overlineHref` пуст — как статический моноширинный текст. Доступны только контролы `overline` и `overlineHref`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: overline &amp; overlineHref — Контролы: [overline, overlineHref]
        </Text>
        <Text variant="caption" tone="secondary">
          Очистите overlineHref в Controls, чтобы сравнить ссылку и обычный текст:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card tone="accent">
            <CardBody snapToGrid={false}>
              <CardHeader
                overline={args.overline}
                overlineHref={args.overlineHref}
                title="Principal UI Engineer"
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const PropSelectableAndChecked: Story = {
  name: 'Пропсы: selectable, checked и checkboxAriaLabel',
  args: {
    selectable: true,
    checked: true,
    checkboxAriaLabel: 'Выбрать вакансию Stripe для пакетного действия',
  },
  parameters: {
    controls: { include: ['selectable', 'checked', 'checkboxAriaLabel'] },
    docs: {
      description: {
        story:
          'Пропс `selectable` включает чекбокс выбора карточки (клик по чекбоксу перехватывает `stopPropagation`, чтобы не открывать модальное окно карточки). Доступны только контролы `selectable`, `checked` и `checkboxAriaLabel`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: selectable, checked &amp; checkboxAriaLabel — Контролы: [selectable, checked, checkboxAriaLabel]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте selectable и checked в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card tone="success" selected={args.checked}>
            <CardBody snapToGrid={false}>
              <CardHeader
                overline="Stripe"
                title="Staff Frontend Architect"
                selectable={args.selectable}
                checked={args.checked}
                checkboxAriaLabel={args.checkboxAriaLabel}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const PropCompact: Story = {
  name: 'Пропс: compact (Однострочная шапка)',
  args: {
    compact: true,
  },
  parameters: {
    controls: { include: ['compact'] },
    docs: {
      description: {
        story:
          'В режиме `compact={true}` `overline` и `title` объединяются через слэш `/` в одну компактную строку с обрезкой многоточием. Доступен только контрол `compact`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: compact (boolean) — Контролы: [compact]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг compact в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card tone="info">
            <CardHeader
              compact={args.compact}
              overline="Figma"
              title="Lead Design Systems Engineer"
              statusIndicators={STATUS_MAP.InterviewBadge}
            />
          </Card>
        </div>
      </div>
    </div>
  ),
};
