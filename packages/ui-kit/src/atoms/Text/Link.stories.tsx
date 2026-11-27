import { Building2, FileText, Globe } from 'lucide-react';
import { Link, Text } from './Text';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../Icon';
import layoutStyles from '../../stories/StoryLayout.module.css';

const ICON_MAP = {
  none: undefined,
  Globe: <Icon icon={Globe} size="xs" />,
  Building2: <Icon icon={Building2} size="xs" />,
  FileText: <Icon icon={FileText} size="xs" />,
} as const;

const meta: Meta<typeof Link> = {
  title: 'Atoms/Text/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент гиперссылки (`<a>`) в стиле Blueprint. Поддерживает автоматический индикатор внешней ссылки (`external`), слот начальной иконки (`startIcon`), типографические варианты (`variant`) и цветовые тона (`tone`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    href: 'https://example.com/architecture',
    external: true,
    variant: 'body',
    tone: 'accent',
    children: 'Blueprint Architecture Specification',
  },
  argTypes: {
    href: {
      control: 'text',
      description: 'Целевой URL-адрес ссылки (`href`).',
    },
    external: {
      control: 'boolean',
      description:
        'Если `true`, открывает ссылку в новой вкладке (`target="_blank" rel="noopener noreferrer"`) и автоматически рендерит иконку `ExternalLink` справа.',
    },
    variant: {
      control: 'select',
      options: ['body', 'body-sm', 'caption', 'mono', 'mono-label', 'title', 'heading', 'display'],
      description: 'Типографический вариант текста ссылки.',
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
      description: 'Семантический цветовой тон ссылки.',
    },
    startIcon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Опциональная иконка слева от текста ссылки (`<Icon />`).',
    },
    children: {
      control: 'text',
      description: 'Текст ссылки.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация компонента `Link`. Позволяет настроить `href`, `external`, `startIcon` и `children` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Link — Гиперссылка (&lt;a&gt;)
        </Text>
        <Text variant="caption" tone="secondary">
          Семантический тег &lt;a&gt; с поддержкой иконок и безопасного открытия внешних ресурсов.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Link {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropHref: Story = {
  name: 'Пропс: href (Целевой URL)',
  args: {
    href: 'https://github.com/dkoldyaev/linkedin-parser',
    children: 'Репозиторий проекта на GitHub',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `href` задает адрес назначения гиперссылки.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: href
        </Text>
        <Text variant="caption" tone="secondary">
          Задает атрибут href для элемента &lt;a&gt;. Текущий URL: <code>{args.href}</code>
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Link {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropExternal: Story = {
  name: 'Пропс: external (Внешняя ссылка)',
  args: {
    external: true,
    children: 'Внешняя документация (external=true)',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `external` включает режим внешней ссылки: добавляет `target="_blank"`, `rel="noopener noreferrer"` и отображает иконку `ExternalLink` из `lucide-react`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: external (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг external в Controls, чтобы увидеть появление/скрытие иконки внешнего
          перехода:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Link {...args} />
          <Link href="#internal-section" external={false}>
            Внутренняя якорная ссылка (external=false)
          </Link>
        </div>
      </div>
    </div>
  ),
};

export const PropStartIcon: Story = {
  name: 'Пропс: startIcon (Иконка слева)',
  args: {
    startIcon: <Icon icon={Building2} size="xs" />,
    external: true,
    children: 'Компания на LinkedIn',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `startIcon` позволяет передать иконку `<Icon />`, которая отображается перед текстом ссылки.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: startIcon
        </Text>
        <Text variant="caption" tone="secondary">
          Рендерит иконку перед текстом ссылки. Выберите иконку в выпадающем списке startIcon в
          Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Link {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Текст ссылки)',
  args: {
    children: 'Перейти к спецификации токенов',
    external: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `children` определяет видимый текст гиперссылки.',
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
          Видимый текст ссылки, настраиваемый через Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Link {...args} />
        </div>
      </div>
    </div>
  ),
};
