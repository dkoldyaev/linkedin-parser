import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Skeleton } from './Skeleton';
import { Text } from '../Text';

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент скелетон-заглушки `Skeleton` для индикации загрузки контента на 32px сетке Blueprint. Используется в состояниях загрузки карточек (`CardFullLoading`, `CardCollapsedLoading`) и списков. Поддерживает формы `text`, `rect`, `circle`, `chip`, токенизированные ширины (`width`), высоты (`height`) и пульсирующую анимацию (`animated`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    variant: 'text',
    width: '75',
    height: 'md',
    animated: true,
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['text', 'rect', 'circle', 'chip'],
      description: 'Геометрическая форма скелетона (`text`, `rect`, `circle`, `chip`).',
    },
    width: {
      control: 'select',
      options: ['25', '50', '60', '75', '85', '100', 'full'],
      description: 'Процентная ширина скелетона относительно контейнера (`25%`..`100%`).',
    },
    height: {
      control: 'inline-radio',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Высота скелетона (`xs`, `sm`, `md`, `lg`, `xl`).',
    },
    animated: {
      control: 'boolean',
      description: 'Включает или отключает плавную shimmer/pulse анимацию загрузки.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Skeleton`. Настраивайте `variant`, `width`, `height` и `animated` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Skeleton — Анимированный плейсхолдер загрузки контента
        </Text>
        <Text variant="caption" tone="secondary">
          Рендерит блок с aria-hidden=&quot;true&quot; для предотвращения сдвигов макета (CLS) во
          время загрузки данных.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Skeleton {...args} />
      </div>
    </div>
  ),
};

export const PropVariant: Story = {
  name: 'Пропс: variant (Форма плейсхолдера)',
  args: {
    variant: 'chip',
    width: '25',
    height: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `variant` определяет назначение плейсхолдера: `text` (строка текста), `rect` (прямоугольный блок), `circle` (круглая иконка/аватар), `chip` (бейдж/тег).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant (&quot;text&quot; | &quot;rect&quot; | &quot;circle&quot; | &quot;chip&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте variant в Controls или сравните все 4 формы ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Skeleton {...args} />
        <div className={layoutStyles.stackSm}>
          <Skeleton variant="text" width="75" height="sm" />
          <div className={layoutStyles.row}>
            <Skeleton variant="circle" height="lg" />
            <Skeleton variant="chip" width="25" />
            <Skeleton variant="chip" width="25" />
          </div>
          <Skeleton variant="rect" width="100" height="xl" />
        </div>
      </div>
    </div>
  ),
};

export const PropWidth: Story = {
  name: 'Пропс: width (Процентная ширина)',
  args: {
    variant: 'text',
    width: '60',
    height: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `width` задает ширину строки скелетона (`25`, `50`, `60`, `75`, `85`, `100`, `full`) для имитации естественного многострочного абзаца.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: width (&quot;25&quot; | &quot;50&quot; | &quot;60&quot; | &quot;75&quot; | &quot;85&quot; | &quot;100&quot; | &quot;full&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените width в Controls и сравните со шкалой ширин ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Skeleton {...args} />
        <div className={layoutStyles.stackSm}>
          <Skeleton variant="text" width="25" height="xs" />
          <Skeleton variant="text" width="50" height="xs" />
          <Skeleton variant="text" width="60" height="xs" />
          <Skeleton variant="text" width="75" height="xs" />
          <Skeleton variant="text" width="85" height="xs" />
          <Skeleton variant="text" width="100" height="xs" />
        </div>
      </div>
    </div>
  ),
};

export const PropHeight: Story = {
  name: 'Пропс: height (Высота плейсхолдера)',
  args: {
    variant: 'rect',
    width: '100',
    height: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `height` задает высоту скелетона (`xs`, `sm`, `md`, `lg`, `xl`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: height (&quot;xs&quot; | &quot;sm&quot; | &quot;md&quot; | &quot;lg&quot; | &quot;xl&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте height в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Skeleton {...args} />
        <div className={layoutStyles.stackSm}>
          <Skeleton variant="rect" width="50" height="xs" />
          <Skeleton variant="rect" width="50" height="sm" />
          <Skeleton variant="rect" width="50" height="md" />
          <Skeleton variant="rect" width="50" height="lg" />
          <Skeleton variant="rect" width="50" height="xl" />
        </div>
      </div>
    </div>
  ),
};

export const PropAnimated: Story = {
  name: 'Пропс: animated (Анимация пульсации)',
  args: {
    variant: 'rect',
    width: '75',
    height: 'lg',
    animated: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `animated` включает или отключает CSS-анимацию перелива скелетона (`animated={false}` полезен для статических скриншот-тестов).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: animated (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг animated в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Skeleton {...args} />
      </div>
    </div>
  ),
};
