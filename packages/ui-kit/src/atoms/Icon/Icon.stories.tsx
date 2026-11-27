import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Globe,
  Info,
  Layers,
  Search,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from './Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

const ALL_SIZES = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
const ALL_TONES = [
  'inherit',
  'neutral',
  'primary',
  'secondary',
  'muted',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
] as const;

const ICON_COMPONENTS = {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Search,
  Settings,
  Briefcase,
  Globe,
  Layers,
} as const;

const meta: Meta<typeof Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарная обертка `Icon` вокруг SVG-иконок из библиотеки **`lucide-react`**. Обеспечивает строго токенизированные размеры из `ICON_SIZE_PX` (`2xs` = 10px, `xs` = 12px, `sm` = 14px, `md` = 16px, `lg` = 20px, `xl` = 24px), семантические цветовые тона (`tone`) и корректные ARIA-атрибуты (`role="img"` при наличии `label` или `aria-hidden="true"` для декоративных иконок). Полный каталог всех иконок `lucide-react` представлен в разделе `Foundations (Tokens) / Icons`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    icon: Sparkles,
    size: 'md',
    tone: 'accent',
    label: 'AI Sparkles Icon',
  },
  argTypes: {
    icon: {
      control: 'select',
      options: Object.keys(ICON_COMPONENTS),
      mapping: ICON_COMPONENTS,
      description: 'Компонент SVG-иконки из библиотеки `lucide-react`.',
    },
    size: {
      control: 'inline-radio',
      options: ALL_SIZES,
      description:
        'Токенизированный размер иконки (`2xs`: 10px, `xs`: 12px, `sm`: 14px, `md`: 16px, `lg`: 20px, `xl`: 24px).',
    },
    tone: {
      control: 'select',
      options: ALL_TONES,
      description: 'Семантический цветовой тон иконки (`inherit` наследует `currentColor` родителя).',
    },
    label: {
      control: 'text',
      description:
        'Доступная подпись (`aria-label`). Если указана, спан получает `role="img"`. Если не указана — `aria-hidden="true"`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация атома `Icon` со всеми контролами (`icon`, `size`, `tone`, `label`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Icon — Атомарная обертка для иконок из библиотеки lucide-react
        </Text>
        <Text variant="caption" tone="secondary">
          Гарантирует единую толщину линий (strokeWidth=2), токенизированные размеры и семантические
          цвета.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Icon {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropIcon: Story = {
  name: 'Пропс: icon (Контрол: только icon)',
  args: {
    icon: Sparkles,
  },
  parameters: {
    controls: {
      include: ['icon'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `icon`. В панели Controls доступен **только один контрол** — `icon` (выбор компонента из `lucide-react`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: icon (Controls: только icon)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконку из библиотеки lucide-react в контроле icon:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Icon icon={args.icon} size="xl" tone="accent" />
        </div>
      </div>
    </div>
  ),
};

export const PropSizeAll: Story = {
  name: 'Пропс: size — Все размеры 2xs–xl (Контрол: только icon)',
  args: {
    icon: Sparkles,
  },
  parameters: {
    controls: {
      include: ['icon'],
    },
    docs: {
      description: {
        story:
          'Показывает все 6 токенизированных размеров `size` (`2xs`, `xs`, `sm`, `md`, `lg`, `xl`) одновременно. В панели Controls доступен **только один контрол** — `icon`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Все размеры (Controls: только icon)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконку в контроле icon для сравнения всей шкалы размеров 10px..24px:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_SIZES.map((sz) => (
            <div key={sz} className={layoutStyles.box}>
              <Text variant="mono" size="2xs" tone="muted">
                {sz}
              </Text>
              <Icon icon={args.icon} size={sz} tone="accent" />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropSizeSingle: Story = {
  name: 'Пропс: size — Выбор размера (Контролы: size, icon)',
  args: {
    icon: Sparkles,
    size: 'lg',
  },
  parameters: {
    controls: {
      include: ['size', 'icon'],
    },
    docs: {
      description: {
        story: 'Одиночная иконка с двумя контролами: `size` и `icon`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size — Одиночная иконка (Controls: только size и icon)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size (&quot;{args.size}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Icon icon={args.icon} size={args.size} tone="accent" />
        </div>
      </div>
    </div>
  ),
};

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все цвета (Контрол: только icon)',
  args: {
    icon: Sparkles,
  },
  parameters: {
    controls: {
      include: ['icon'],
    },
    docs: {
      description: {
        story:
          'Показывает все семантические тона `tone` одновременно с единственным контролом `icon`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Все семантические тона (Controls: только icon)
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение всех цветовых тонов на выбранной иконке:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_TONES.map((t) => (
            <div key={t} className={layoutStyles.box}>
              <Text variant="mono" size="2xs" tone="muted">
                {t}
              </Text>
              <Icon icon={args.icon} size="lg" tone={t} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropToneSingle: Story = {
  name: 'Пропс: tone — Выбор тона (Контролы: tone, icon)',
  args: {
    icon: CheckCircle2,
    tone: 'success',
  },
  parameters: {
    controls: {
      include: ['tone', 'icon'],
    },
    docs: {
      description: {
        story: 'Одиночная иконка с двумя контролами: `tone` и `icon`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone — Одиночная иконка (Controls: только tone и icon)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите tone (&quot;{args.tone}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Icon icon={args.icon} size="xl" tone={args.tone} />
        </div>
      </div>
    </div>
  ),
};

export const PropLabel: Story = {
  name: 'Пропс: label (Контрол: только label)',
  args: {
    label: 'Информационное уведомление о статусе синхронизации',
  },
  parameters: {
    controls: {
      include: ['label'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `label` (`aria-label`). В панели Controls доступен **только один контрол** — `label`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: label (Controls: только label)
        </Text>
        <Text variant="caption" tone="secondary">
          Текущий aria-label: &quot;{args.label || 'не задан (aria-hidden=true)'}&quot;
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Icon icon={Info} size="lg" tone="info" label={args.label} />
        </div>
      </div>
    </div>
  ),
};
