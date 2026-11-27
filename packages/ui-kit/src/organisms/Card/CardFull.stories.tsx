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
import { CardFooter, CardFull } from './Card';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof CardFull> = {
  title: 'Organisms/Card/CardFull',
  component: CardFull,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Организм полноразмерной карточки `CardFull` (`Card.Full`). Отображает многострочную структуру карточки с `CardHeader`, квантованным по 32px сетке `CardBody` (мета-бейджи, описание, технологический стек) и 32px футером `CardFooter`. При `isLoading={true}` делегирует рендеринг в `<CardFullLoading>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'Staff Frontend Architect — UI Platform',
    subtitle: 'Design Systems & Platform Engineering',
    overline: 'Stripe',
    overlineHref: 'https://stripe.com',
    tone: 'success',
    selected: false,
    interactive: true,
    horizontal: false,
    snapToGrid: true,
    isLoading: false,
    selectable: false,
    checked: false,
  },
  argTypes: {
    title: { control: 'text', description: 'Основной заголовок карточки.' },
    subtitle: { control: 'text', description: 'Подзаголовок карточки.' },
    overline: { control: 'text', description: 'Верхняя моноширинная метка (компания/источник).' },
    overlineHref: { control: 'text', description: 'URL внешней ссылки для `overline`.' },
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
      description: 'Семантический цветовой тон акцентной полосы карточки.',
    },
    selected: { control: 'boolean', description: 'Визуальное выделение выбранной карточки.' },
    interactive: { control: 'boolean', description: 'Включает интерактивный hover и `tabIndex={0}`.' },
    horizontal: { control: 'boolean', description: 'Горизонтальная ориентация карточки.' },
    snapToGrid: { control: 'boolean', description: 'Квантование высоты тела карточки кратно 32px.' },
    isLoading: { control: 'boolean', description: 'Переключает карточку в скелетон `<CardFullLoading>`.' },
    selectable: { control: 'boolean', description: 'Показывает чекбокс выбора в шапке.' },
    checked: { control: 'boolean', description: 'Состояние чекбокса выбора.' },
  },
};

export default meta;
type Story = StoryObj<typeof CardFull>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `CardFull`. Настраивайте все пропсы (`tone`, `selected`, `interactive`, `horizontal`, `snapToGrid`, `isLoading`, `selectable`) через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          CardFull — Полноразмерная многострочная карточка
        </Text>
        <Text variant="caption" tone="secondary">
          Используется для отображения подробных карточек вакансий на Канбан-доске.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardFull
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
              Проектирование и развитие дизайн-системы Blueprint с автоматической проверкой токенов.
            </Paragraph>
            <TokenList>
              {['TypeScript', 'React 19', 'Storybook 10', 'Radix UI'].map((tech) => (
                <Badge key={tech} size="xs" variant="chip">
                  {tech}
                </Badge>
              ))}
            </TokenList>
          </CardFull>
        </div>
      </div>
    </div>
  ),
};

export const PropToneAndSelected: Story = {
  name: 'Пропсы: tone и selected (Семантический тон и выделение)',
  args: {
    tone: 'accent',
    selected: true,
    overline: 'Vercel',
    title: 'Staff Design Systems Engineer',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропсы `tone` и `selected` управляют цветовой маркировкой и рамкой активной карточки.',
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
          Переключайте tone и selected в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardFull {...args}>
            <Paragraph size="sm" tone="secondary" spacing="none">
              Демонстрация выбранной карточки с акцентным тоном.
            </Paragraph>
          </CardFull>
        </div>
      </div>
    </div>
  ),
};

export const PropIsLoading: Story = {
  name: 'Пропс: isLoading (Переключение в скелетон CardFullLoading)',
  args: {
    isLoading: true,
    tone: 'success',
  },
  parameters: {
    docs: {
      description: {
        story: 'При `isLoading={true}` вместо контента рендерится скелетон `<CardFullLoading>`.',
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
          Переключите флаг isLoading в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardFull {...args} />
        </div>
      </div>
    </div>
  ),
};
