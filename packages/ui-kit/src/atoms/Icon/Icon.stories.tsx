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
      options: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl'],
      description:
        'Токенизированный размер иконки (`2xs`: 10px, `xs`: 12px, `sm`: 14px, `md`: 16px, `lg`: 20px, `xl`: 24px).',
    },
    tone: {
      control: 'select',
      options: [
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
      ],
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
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация атома `Icon` с иконками из `lucide-react`. Настройте `icon`, `size`, `tone` и `label` через панель Controls.',
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
  name: 'Пропс: icon (Компонент иконки из lucide-react)',
  args: {
    icon: Sparkles,
    size: 'lg',
    tone: 'accent',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `icon` принимает любой компонент иконки, импортированный из библиотеки `lucide-react` (например `Sparkles`, `CheckCircle2`, `Search`, `Trash2`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: icon (LucideIcon from lucide-react)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконку из библиотеки lucide-react в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Icon {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Icon icon={Sparkles} size="md" tone="accent" />
          <Icon icon={CheckCircle2} size="md" tone="success" />
          <Icon icon={AlertTriangle} size="md" tone="warning" />
          <Icon icon={Trash2} size="md" tone="danger" />
          <Icon icon={Info} size="md" tone="info" />
          <Icon icon={Search} size="md" tone="secondary" />
          <Icon icon={Settings} size="md" tone="primary" />
        </div>
      </div>
    </div>
  ),
};

export const PropSize: Story = {
  name: 'Пропс: size (Токенизированный размер 2xs–xl)',
  args: {
    icon: Sparkles,
    size: 'lg',
    tone: 'accent',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `size` выбирает размер из канонического словаря `ICON_SIZE_PX`: `2xs` (10px), `xs` (12px), `sm` (14px), `md` (16px), `lg` (20px), `xl` (24px). Прямая передача чисел запрещена линтером `check-tokens.mjs`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: size (&quot;2xs&quot; | &quot;xs&quot; | &quot;sm&quot; | &quot;md&quot; | &quot;lg&quot; | &quot;xl&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте size в Controls и сравните со всей шкалой размеров ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Icon {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Icon icon={Sparkles} size="2xs" tone="accent" label="2xs (10px)" />
          <Icon icon={Sparkles} size="xs" tone="accent" label="xs (12px)" />
          <Icon icon={Sparkles} size="sm" tone="accent" label="sm (14px)" />
          <Icon icon={Sparkles} size="md" tone="accent" label="md (16px)" />
          <Icon icon={Sparkles} size="lg" tone="accent" label="lg (20px)" />
          <Icon icon={Sparkles} size="xl" tone="accent" label="xl (24px)" />
        </div>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический цвет иконки)',
  args: {
    icon: CheckCircle2,
    size: 'lg',
    tone: 'success',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` окрашивает SVG-иконку через CSS-токен цвета (`inherit`, `neutral`, `primary`, `secondary`, `muted`, `accent`, `success`, `warning`, `danger`, `info`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone
        </Text>
        <Text variant="caption" tone="secondary">
          Измените tone в Controls для проверки всех семантических цветов:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Icon {...args} />
        </div>
        <div className={layoutStyles.row}>
          <Icon icon={Sparkles} size="lg" tone="primary" />
          <Icon icon={Sparkles} size="lg" tone="secondary" />
          <Icon icon={Sparkles} size="lg" tone="muted" />
          <Icon icon={Sparkles} size="lg" tone="accent" />
          <Icon icon={CheckCircle2} size="lg" tone="success" />
          <Icon icon={AlertTriangle} size="lg" tone="warning" />
          <Icon icon={Trash2} size="lg" tone="danger" />
          <Icon icon={Info} size="lg" tone="info" />
        </div>
      </div>
    </div>
  ),
};

export const PropLabel: Story = {
  name: 'Пропс: label (Доступность / Screen Reader aria-label)',
  args: {
    icon: Info,
    size: 'lg',
    tone: 'info',
    label: 'Информационное уведомление о статусе синхронизации',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `label` задает атрибут `aria-label` и переключает `role="img"` для скринридеров. Если `label` не передан, иконка считается декоративной (`aria-hidden="true"`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: label (string | undefined)
        </Text>
        <Text variant="caption" tone="secondary">
          Управляет семантикой доступности. Текущий aria-label: &quot;{args.label || 'не задан (aria-hidden)'}&quot;
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
