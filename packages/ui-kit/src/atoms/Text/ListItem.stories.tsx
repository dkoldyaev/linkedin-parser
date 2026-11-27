import { AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { ListItem, Text, UnorderedList } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';

const ICON_MAP = {
  none: undefined,
  CheckCircle2: <Icon icon={CheckCircle2} size="sm" tone="success" />,
  Sparkles: <Icon icon={Sparkles} size="sm" tone="accent" />,
  AlertTriangle: <Icon icon={AlertTriangle} size="sm" tone="warning" />,
  Info: <Icon icon={Info} size="sm" tone="info" />,
} as const;

const meta: Meta<typeof ListItem> = {
  title: 'Atoms/Text/ListItem',
  component: ListItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент элемента списка (`<li>`). Поддерживает замену стандартного маркера списка на произвольную иконку (`icon`) и настройку семантического цветового тона (`tone`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    tone: 'primary',
    children: 'Пункт списка с поддержкой кастомной иконки и семантического тона',
  },
  argTypes: {
    icon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description:
        'Опциональная иконка (`<Icon />`), заменяющая стандартный буллит списка слева от текста.',
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
      description: 'Семантический цветовой тон текста элемента списка.',
    },
    children: {
      control: 'text',
      description: 'Текстовое содержимое пункта списка.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ListItem>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ListItem` со всеми контролами (`icon`, `tone`, `children`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ListItem — Элемент списка (&lt;li&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Используется внутри &lt;List&gt;, &lt;UnorderedList&gt; или &lt;OrderedList&gt;.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <UnorderedList>
          <ListItem {...args} />
        </UnorderedList>
      </div>
    </div>
  ),
};

export const PropIcon: Story = {
  name: 'Пропс: icon (Контролы: icon, children)',
  args: {
    icon: <Icon icon={CheckCircle2} size="sm" tone="success" />,
    children: 'Подтвержденное требование с кастомной иконкой вместо стандартной точки',
  },
  parameters: {
    controls: {
      include: ['icon', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `icon`. В панели Controls доступны только `icon` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: icon (Controls: только icon и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконку в контроле icon:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <UnorderedList>
          <ListItem icon={args.icon}>{args.children}</ListItem>
        </UnorderedList>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Контролы: tone, children)',
  args: {
    tone: 'success',
    children: 'Пункт списка с выбранным семантическим тоном',
  },
  parameters: {
    controls: {
      include: ['tone', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `tone`. В панели Controls доступны только `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone (Controls: только tone и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите семантический тон (&quot;{args.tone}&quot;) в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <UnorderedList>
          <ListItem tone={args.tone}>{args.children}</ListItem>
        </UnorderedList>
      </div>
    </div>
  ),
};
