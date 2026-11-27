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
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация компонента `Link` со всеми контролами (`href`, `external`, `variant`, `tone`, `startIcon`, `children`).',
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
  name: 'Пропс: href (Контролы: href, children)',
  args: {
    href: 'https://github.com/dkoldyaev/linkedin-parser',
    children: 'Репозиторий проекта на GitHub',
  },
  parameters: {
    controls: {
      include: ['href', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `href`. В панели Controls доступны только `href` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: href (Controls: только href и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Задает целевой адрес ссылки: <code>{args.href}</code>
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Link href={args.href}>{args.children}</Link>
        </div>
      </div>
    </div>
  ),
};

export const PropExternal: Story = {
  name: 'Пропс: external (Контролы: external, children)',
  args: {
    external: true,
    children: 'Внешняя документация (иконка ExternalLink)',
  },
  parameters: {
    controls: {
      include: ['external', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `external`. В панели Controls доступны только `external` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: external (Controls: только external и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг external ({String(args.external)}) для показа/скрытия иконки внешнего
          перехода:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Link href="https://example.com" external={args.external}>
            {args.children}
          </Link>
        </div>
      </div>
    </div>
  ),
};

export const PropStartIcon: Story = {
  name: 'Пропс: startIcon (Контролы: startIcon, children)',
  args: {
    startIcon: <Icon icon={Building2} size="xs" />,
    children: 'Страница компании на LinkedIn',
  },
  parameters: {
    controls: {
      include: ['startIcon', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация слота `startIcon`. В панели Controls доступны только `startIcon` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: startIcon (Controls: только startIcon и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите иконку в контроле startIcon:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <Link href="https://linkedin.com" startIcon={args.startIcon} external>
            {args.children}
          </Link>
        </div>
      </div>
    </div>
  ),
};
