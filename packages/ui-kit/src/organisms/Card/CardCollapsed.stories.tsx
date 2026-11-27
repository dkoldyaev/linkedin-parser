import { Badge, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardCollapsed } from './Card';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof CardCollapsed> = {
  title: 'Organisms/Card/CardCollapsed',
  component: CardCollapsed,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Организм компактной однострочной карточки `CardCollapsed` (`Card.Collapsed`) высотой ровно 32px (1 ячейка сетки Blueprint). Отображает `overline / title` в одну строку с обрезкой многоточием, опциональный чекбокс выбора (`selectable`, `checked`) и правый слот статусных индикаторов (`statusIndicators`). При `isLoading={true}` рендерит `<CardCollapsedLoading>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    overline: 'Stripe',
    overlineHref: 'https://stripe.com',
    title: 'Staff Frontend Architect — UI Platform',
    tone: 'success',
    selected: false,
    interactive: true,
    selectable: false,
    checked: false,
    isLoading: false,
  },
  argTypes: {
    overline: { control: 'text', description: 'Название компании или источника перед слэшем `/`.' },
    overlineHref: { control: 'text', description: 'URL внешней ссылки для `overline`.' },
    title: { control: 'text', description: 'Заголовок должности/карточки после слэша `/`.' },
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
      description: 'Семантический цветовой тон левого индикатора карточки.',
    },
    selected: { control: 'boolean', description: 'Подсветка выбранной карточки.' },
    interactive: { control: 'boolean', description: 'Включает hover и фокусировку с клавиатуры (`tabIndex={0}`).' },
    selectable: { control: 'boolean', description: 'Показывает чекбокс выбора слева от `overline`.' },
    checked: { control: 'boolean', description: 'Отмеченное состояние чекбокса.' },
    isLoading: { control: 'boolean', description: 'Отображает однострочный скелетон `<CardCollapsedLoading>`.' },
  },
};

export default meta;
type Story = StoryObj<typeof CardCollapsed>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `CardCollapsed`. Настраивайте `overline`, `title`, `tone`, `selected`, `interactive`, `selectable` и `isLoading` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          CardCollapsed — Компактная 32px карточка (1 ячейка сетки)
        </Text>
        <Text variant="caption" tone="secondary">
          Используется в свернутых секциях (например секция «Не подошло» на Канбан-доске).
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardCollapsed
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

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все тона (Контрол: title)',
  args: {
    title: 'Staff Frontend Architect',
  },
  parameters: {
    controls: { include: ['title'] },
    docs: {
      description: {
        story: 'Витрина компактных карточек с различными семантическими тонами `tone`. Доступен только контрол `title`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone (Сравнение тонов) — Контролы: [title]
        </Text>
        <Text variant="caption" tone="secondary">
          Измените title в панели Controls для всех карточек:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          <div className={layoutStyles.narrowBox}>
            <CardCollapsed
              interactive
              tone="success"
              overline="Stripe"
              title={args.title}
              statusIndicators={
                <Badge variant="solid" tone="success" size="xs">
                  92%
                </Badge>
              }
            />
          </div>
          <div className={layoutStyles.narrowBox}>
            <CardCollapsed
              interactive
              tone="warning"
              overline="Revolut"
              title={args.title}
              statusIndicators={
                <Badge variant="solid" tone="warning" size="xs">
                  68%
                </Badge>
              }
            />
          </div>
          <div className={layoutStyles.narrowBox}>
            <CardCollapsed
              interactive
              tone="danger"
              overline="Figma"
              title={args.title}
              statusIndicators={
                <Badge variant="outline" tone="danger" size="xs">
                  Closed
                </Badge>
              }
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const PropToneSingle: Story = {
  name: 'Пропс: tone — Интерактивный выбор (Контролы: tone, title)',
  args: {
    tone: 'warning',
    title: 'Senior Fullstack Developer (Node.js + React)',
  },
  parameters: {
    controls: { include: ['tone', 'title'] },
    docs: {
      description: {
        story:
          'Пропс `tone` задает цвет акцента компактной карточки (`success`, `warning`, `danger`, `accent`, `info`). Доступны только контролы `tone` и `title`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone (Одиночная карточка) — Контролы: [tone, title]
        </Text>
        <Text variant="caption" tone="secondary">
          Измените tone и title в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardCollapsed
            tone={args.tone}
            overline="Revolut"
            title={args.title}
            statusIndicators={
              <Badge variant="solid" tone="warning" size="xs">
                68%
              </Badge>
            }
          />
        </div>
      </div>
    </div>
  ),
};

export const PropIsLoading: Story = {
  name: 'Пропс: isLoading (Однострочный скелетон)',
  args: {
    isLoading: true,
  },
  parameters: {
    controls: { include: ['isLoading'] },
    docs: {
      description: {
        story:
          'При `isLoading={true}` карточка рендерит однострочный скелетон `<CardCollapsedLoading>`. Доступен только контрол `isLoading`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: isLoading (boolean) — Контролы: [isLoading]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг isLoading в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <CardCollapsed
            isLoading={args.isLoading}
            tone="accent"
            overline="Stripe"
            title="Staff Frontend Architect"
          />
        </div>
      </div>
    </div>
  ),
};
