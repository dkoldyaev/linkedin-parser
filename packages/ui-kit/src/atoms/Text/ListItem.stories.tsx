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
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ListItem`. Выберите иконку (`icon`), тон (`tone`) и текст (`children`) в панели Controls.',
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
  name: 'Пропс: icon (Кастомный маркер-иконка)',
  args: {
    icon: <Icon icon={CheckCircle2} size="sm" tone="success" />,
    children: 'Подтвержденное требование с кастомной иконкой вместо стандартной точки',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `icon` позволяет заменить стандартный маркер `<li>` на компонент `<Icon />` из `lucide-react`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: icon
        </Text>
        <Text variant="caption" tone="secondary">
          Заменяет стандартный маркер списка на переданный React-узел. Выберите иконку в Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <UnorderedList>
          <ListItem {...args} />
          <ListItem icon={undefined} tone="secondary">
            Элемент без пропса icon (использует стандартный маркер списка)
          </ListItem>
        </UnorderedList>
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический цвет пункта)',
  args: {
    tone: 'success',
    icon: <Icon icon={CheckCircle2} size="sm" tone="success" />,
    children: 'Пункт списка с выбранным семантическим тоном',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `tone` управляет цветом текста элемента списка.',
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
          Окрашивает текст пункта списка в выбранный семантический тон:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <UnorderedList>
          <ListItem {...args} />
          <ListItem tone="primary">tone=&quot;primary&quot; — Основной пункт</ListItem>
          <ListItem tone="secondary">tone=&quot;secondary&quot; — Вторичный пункт</ListItem>
          <ListItem tone="warning">tone=&quot;warning&quot; — Требует внимания</ListItem>
          <ListItem tone="danger">tone=&quot;danger&quot; — Критическое замечание</ListItem>
        </UnorderedList>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Текст пункта)',
  args: {
    children: 'Редактируемый текст элемента списка',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `children` задает содержимое элемента `<li>`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: children
        </Text>
        <Text variant="caption" tone="secondary">
          Содержимое пункта списка:
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
