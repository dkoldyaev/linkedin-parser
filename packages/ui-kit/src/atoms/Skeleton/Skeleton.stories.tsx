import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Skeleton } from './Skeleton';
import { Text } from '../Text';

const ALL_VARIANTS = ['text', 'rect', 'circle', 'chip'] as const;
const ALL_WIDTHS = ['25', '50', '60', '75', '85', '100', 'full'] as const;
const ALL_HEIGHTS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент скелетон-заглушки `Skeleton` для индикации загрузки контента на 32px сетке Blueprint. Поддерживает формы `text`, `rect`, `circle`, `chip`, токенизированные ширины (`width`), высоты (`height`) и пульсирующую анимацию (`animated`).',
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
      options: ALL_VARIANTS,
      description: 'Геометрическая форма скелетона (`text`, `rect`, `circle`, `chip`).',
    },
    width: {
      control: 'select',
      options: ALL_WIDTHS,
      description: 'Процентная ширина скелетона относительно контейнера (`25%`..`100%`).',
    },
    height: {
      control: 'inline-radio',
      options: ALL_HEIGHTS,
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
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Skeleton`. Доступны все контролы компонента (`variant`, `width`, `height`, `animated`).',
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

export const PropVariantAll: Story = {
  name: 'Пропс: variant (Все формы сразу + контрол размеров)',
  args: {
    width: '50',
    height: 'md',
  },
  parameters: {
    controls: {
      include: ['width', 'height'],
    },
    docs: {
      description: {
        story:
          'Витрина всех возможных значений пропса `variant` (`text`, `rect`, `circle`, `chip`). В панели Controls доступны только `width` и `height`, чтобы сравнить поведение всех форм при одинаковых габаритах.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant — Все варианты форм (Controls: только width и height)
        </Text>
        <Text variant="caption" tone="secondary">
          Изменяйте width и height в Controls, чтобы увидеть, как все 4 формы реагируют на размеры:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {ALL_VARIANTS.map((v) => (
            <div key={v} className={layoutStyles.box}>
              <Text variant="mono" size="xs" tone="secondary">
                variant=&quot;{v}&quot; (width=&quot;{args.width}&quot;, height=&quot;{args.height}&quot;)
              </Text>
              <Skeleton variant={v} width={args.width} height={args.height} animated />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropVariantSingle: Story = {
  name: 'Пропс: variant (Выбор одной формы)',
  args: {
    variant: 'chip',
  },
  parameters: {
    controls: {
      include: ['variant'],
    },
    docs: {
      description: {
        story:
          'Интерактивный тест одного скелетона с единственным контролом `variant` для переключения формы.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant — Одиночный блок (Controls: только variant)
        </Text>
        <Text variant="caption" tone="secondary">
          В панели Controls оставлен только переключатель variant (&quot;text&quot; | &quot;rect&quot; | &quot;circle&quot; | &quot;chip&quot;):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Skeleton variant={args.variant} width="50" height="lg" animated />
      </div>
    </div>
  ),
};

export const PropDimensionsAcrossVariants: Story = {
  name: 'Пропсы: width и height (Настройка размеров для всех форм)',
  args: {
    width: '75',
    height: 'lg',
  },
  parameters: {
    controls: {
      include: ['width', 'height'],
    },
    docs: {
      description: {
        story:
          'Показывает все формы `variant` (`text`, `rect`, `circle`, `chip`), а в панели Controls оставлены только два контрола — `width` и `height`, которые регулируют ширину и высоту скелетонов.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: width &amp; height (Controls: только width и height)
        </Text>
        <Text variant="caption" tone="secondary">
          Два контрола (width и height) управляют габаритами всех вариантов форм одновременно:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          {ALL_VARIANTS.map((v) => (
            <div key={v} className={layoutStyles.stackSm}>
              <Text variant="mono" size="2xs" tone="muted">
                &lt;Skeleton variant=&quot;{v}&quot; width=&quot;{args.width}&quot; height=&quot;{args.height}&quot; /&gt;
              </Text>
              <Skeleton variant={v} width={args.width} height={args.height} animated />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropWidthScale: Story = {
  name: 'Пропс: width (Шкала процентной ширины)',
  args: {
    width: '60',
  },
  parameters: {
    controls: {
      include: ['width'],
    },
    docs: {
      description: {
        story:
          'Интерактивная демонстрация пропса `width` с единственным контролом `width` (`25`, `50`, `60`, `75`, `85`, `100`, `full`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: width (Controls: только width)
        </Text>
        <Text variant="caption" tone="secondary">
          Меняйте width в Controls для верхнего образца и сравните со всей шкалой ширин ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text variant="mono" size="xs" tone="accent">
            Активный: width=&quot;{args.width}&quot;
          </Text>
          <Skeleton variant="text" width={args.width} height="md" />
        </div>
        <div className={layoutStyles.stackSm}>
          {ALL_WIDTHS.map((w) => (
            <Skeleton key={w} variant="text" width={w} height="xs" />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropHeightScale: Story = {
  name: 'Пропс: height (Шкала высоты xs–xl)',
  args: {
    height: 'lg',
  },
  parameters: {
    controls: {
      include: ['height'],
    },
    docs: {
      description: {
        story:
          'Интерактивная демонстрация пропса `height` с единственным контролом `height` (`xs`, `sm`, `md`, `lg`, `xl`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: height (Controls: только height)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте height в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <Text variant="mono" size="xs" tone="accent">
            Активный: height=&quot;{args.height}&quot;
          </Text>
          <Skeleton variant="rect" width="75" height={args.height} />
        </div>
        <div className={layoutStyles.stackSm}>
          {ALL_HEIGHTS.map((h) => (
            <Skeleton key={h} variant="rect" width="50" height={h} />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropAnimated: Story = {
  name: 'Пропс: animated (Анимация пульсации)',
  args: {
    animated: true,
  },
  parameters: {
    controls: {
      include: ['animated'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `animated`. В панели Controls оставлен только булев переключатель `animated`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: animated (Controls: только animated)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг animated ({String(args.animated)}) в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Skeleton variant="rect" width="75" height="lg" animated={args.animated} />
      </div>
    </div>
  ),
};
