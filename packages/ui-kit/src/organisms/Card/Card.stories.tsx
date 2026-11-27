import {
  Award,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Globe,
  History,
  MapPin,
  X,
} from 'lucide-react';
import { Badge, Button, Icon, Paragraph, Text } from '../../atoms';
import { ButtonGroup, TokenList } from '../../molecules';
import { Card, CardFooter } from './Card';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Card> = {
  title: 'Organisms/Card/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Универсальный организм карточки `Card` на 32px сетке Blueprint. Автоматически делегирует рендеринг в `<CardCollapsed>` при `compact={true}` или в `<CardFull>` при `compact={false}`. Поддерживает как передачу пропсов-слотов (`title`, `subtitle`, `overline`, `overlineHref`, `statusIndicators`, `footer`), так и ручную композицию через `<Card.Header>`, `<Card.Body>` и `<Card.Footer>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'Staff Frontend Architect — UI Platform',
    subtitle: 'Core Design Systems & Infrastructure',
    overline: 'Stripe',
    overlineHref: 'https://stripe.com',
    tone: 'success',
    selected: false,
    interactive: true,
    compact: false,
    isLoading: false,
    selectable: false,
    checked: false,
    horizontal: false,
    snapToGrid: true,
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Основной заголовок карточки (`<Heading level={3}>`).',
    },
    subtitle: {
      control: 'text',
      description: 'Подзаголовок карточки под основным заголовком.',
    },
    overline: {
      control: 'text',
      description: 'Верхняя моноширинная строка метаданных (например название компании или категория).',
    },
    overlineHref: {
      control: 'text',
      description: 'Если передан, превращает `overline` во внешнюю ссылку `<Link external>`.',
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
      description: 'Семантический цветовой акцент верхней/боковой полосы карточки.',
    },
    compact: {
      control: 'boolean',
      description: 'Переключает карточку в однострочный сжатый формат высотой 32px (`<CardCollapsed>`).',
    },
    isLoading: {
      control: 'boolean',
      description: 'Отображает анимированный скелетон загрузки (`<CardFullLoading>` или `<CardCollapsedLoading>`).',
    },
    selected: {
      control: 'boolean',
      description: 'Подсвечивает карточку как выбранную.',
    },
    interactive: {
      control: 'boolean',
      description: 'Включает hover-эффект и фокусировку с клавиатуры (`tabIndex={0}`).',
    },
    selectable: {
      control: 'boolean',
      description: 'Отображает чекбокс выбора карточки в шапке рядом с `overline`.',
    },
    checked: {
      control: 'boolean',
      description: 'Состояние отметки чекбокса при `selectable={true}`.',
    },
    horizontal: {
      control: 'boolean',
      description: 'Включает горизонтальную раскладку карточки.',
    },
    snapToGrid: {
      control: 'boolean',
      description: 'Квантует высоту `CardBody` кратно ячейке 32px (`--ui-grid-cell`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Card`. Переключайте `compact`, `isLoading`, `tone`, `selected`, `interactive`, `selectable` и другие пропсы в панели Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Card — Универсальный организм карточки на 32px сетке
        </Text>
        <Text variant="caption" tone="secondary">
          Автоматически переключается между полной и компактной (32px) версией, а также скелетоном
          загрузки.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card
            {...args}
            statusIndicators={
              <Badge variant="outline" tone="info" size="xs">
                Interview
              </Badge>
            }
            footer={
              <CardFooter
                metaSlot={
                  <div className={layoutStyles.row}>
                    <Text variant="caption" tone="muted">
                      14 Nov
                    </Text>
                    <Text
                      variant="caption"
                      tone="muted"
                      startIcon={<Icon icon={History} size="2xs" />}
                    >
                      3
                    </Text>
                  </div>
                }
                actionsSlot={
                  <ButtonGroup>
                    <Button variant="ghost" size="icon" aria-label="Move previous">
                      <Icon icon={ChevronLeft} size="sm" />
                    </Button>
                    <Button variant="ghost" size="icon" tone="danger" aria-label="Dismiss card">
                      <Icon icon={X} size="sm" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Move next">
                      <Icon icon={ChevronRight} size="sm" />
                    </Button>
                  </ButtonGroup>
                }
              />
            }
          >
            <div className={layoutStyles.row}>
              <Badge
                variant="solid"
                tone="success"
                size="xs"
                icon={<Icon icon={Award} size="2xs" />}
              >
                92%
              </Badge>
              <Text variant="caption" tone="accent" startIcon={<Icon icon={Globe} size="xs" />}>
                Remote
              </Text>
              <Text variant="caption" tone="secondary" startIcon={<Icon icon={MapPin} size="xs" />}>
                EU / Dublin
              </Text>
              <Text variant="mono" tone="success" startIcon={<Icon icon={Banknote} size="xs" />}>
                €140k – €165k
              </Text>
            </div>
            <Paragraph size="sm" tone="secondary" spacing="none">
              Архитектура и развитие библиотеки компонентов Blueprint со строгим контролем токенов.
            </Paragraph>
            <TokenList>
              {['TypeScript', 'React 19', 'Storybook 10', 'Radix UI'].map((tech) => (
                <Badge key={tech} size="xs" variant="chip">
                  {tech}
                </Badge>
              ))}
            </TokenList>
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const PropCompact: Story = {
  name: 'Пропс: compact (Полный режим / Сжатый 32px режим)',
  args: {
    compact: true,
    tone: 'success',
    overline: 'Stripe',
    title: 'Staff Frontend Architect',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `compact` переключает карточку в однострочный режим `CardCollapsed` высотой в 1 ячейку сетки (32px).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: compact (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг compact в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card
            {...args}
            statusIndicators={
              <Badge variant="outline" tone="info" size="xs">
                Interview
              </Badge>
            }
          />
        </div>
      </div>
    </div>
  ),
};

export const PropToneAndSelected: Story = {
  name: 'Пропсы: tone и selected (Цветовой акцент и выделение)',
  args: {
    tone: 'warning',
    selected: true,
    overline: 'Revolut',
    title: 'Senior Fullstack Engineer',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` окрашивает акцентную линию карточки (`success`, `warning`, `danger`, `accent`, `info`), а `selected` добавляет рамку активного выбора.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: tone &amp; selected
        </Text>
        <Text variant="caption" tone="secondary">
          Измените tone и selected в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropIsLoading: Story = {
  name: 'Пропс: isLoading (Скелетон загрузки)',
  args: {
    isLoading: true,
    compact: false,
    tone: 'accent',
  },
  parameters: {
    docs: {
      description: {
        story:
          'При `isLoading={true}` карточка автоматически рендерит `<CardFullLoading>` (или `<CardCollapsedLoading>` при `compact={true}`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: isLoading (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте isLoading и compact в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card {...args} />
        </div>
      </div>
    </div>
  ),
};
