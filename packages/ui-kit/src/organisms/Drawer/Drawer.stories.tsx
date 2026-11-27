import { Badge, Button, Icon, Text } from '../../atoms';
import { Briefcase, FileText, Home, Layers, Settings } from 'lucide-react';
import { Drawer, type DrawerNavLinkItem, type DrawerProps } from './Drawer';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import layoutStyles from '../../stories/StoryLayout.module.css';

const SAMPLE_LINKS: readonly DrawerNavLinkItem[] = [
  {
    id: 'kanban',
    label: 'Канбан-доска вакансий',
    icon: <Icon icon={Briefcase} size="sm" />,
    active: true,
    badge: (
      <Badge variant="counter" size="xs" tone="accent">
        24
      </Badge>
    ),
  },
  {
    id: 'cv',
    label: 'Базовое резюме (CV)',
    icon: <Icon icon={FileText} size="sm" />,
  },
  {
    id: 'extension',
    label: 'Браузерное расширение',
    icon: <Icon icon={Layers} size="sm" />,
  },
  {
    id: 'about',
    label: 'О архитектуре проекта',
    icon: <Icon icon={Home} size="sm" />,
  },
];

const meta: Meta<typeof Drawer> = {
  title: 'Organisms/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Доступный организм боковой выдвижной панели и навигационного меню `Drawer` на 32px сетке Blueprint. Построен на базе `@radix-ui/react-dialog` и портального контейнера `<OverlayProvider>` с захватом фокуса, закрытием по `Escape` и клику по оверлею. Поддерживает размещение слева/справа (`placement`), список навигационных ссылок (`links`), заголовок (`title`, `tag`), а также кастомные слоты `headerSlot` и `footerSlot`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    isOpen: false,
    title: 'BLUEPRINT WORKSPACE',
    tag: 'NAVIGATION',
    placement: 'left',
    closeLabel: 'Закрыть навигацию',
    hideCloseButton: false,
    links: SAMPLE_LINKS,
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Управляет открытым/закрытым состоянием боковой панели.',
    },
    title: {
      control: 'text',
      description: 'Основной заголовок в шапке боковой панели (`DialogPrimitive.Title`).',
    },
    tag: {
      control: 'text',
      description: 'Верхняя моноширинная метка над заголовком (например `"NAVIGATION"`).',
    },
    placement: {
      control: 'inline-radio',
      options: ['left', 'right'],
      description: 'Сторона экрана, с которой выезжает панель (`left` или `right`).',
    },
    closeLabel: {
      control: 'text',
      description: 'Доступная метка `aria-label` для кнопки закрытия панели.',
    },
    hideCloseButton: {
      control: 'boolean',
      description: 'Скрывает кнопку закрытия (`X`) в правом верхнем углу шапки.',
    },
    links: {
      control: 'object',
      description: 'Массив навигационных пунктов `DrawerNavLinkItem[]` (`id`, `label`, `icon`, `index`, `active`, `badge`, `href`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

function InteractiveDrawerDemo(args: DrawerProps): React.ReactElement {
  const [open, setOpen] = useState(args.isOpen);

  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Drawer — Выдвижная навигационная панель (placement=&quot;{args.placement}&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Нажмите кнопку ниже для открытия Drawer поверх страницы через OverlayProvider.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button variant="primary" onClick={() => setOpen(true)}>
            Открыть Drawer ({args.placement})
          </Button>
        </div>
        <Drawer
          {...args}
          isOpen={open}
          onClose={() => setOpen(false)}
          footerSlot={
            <div className={layoutStyles.row}>
              <Icon icon={Settings} size="xs" tone="muted" />
              <Text variant="mono" size="xs" tone="muted">
                BLUEPRINT.UI v2.0 // GRID 32PX
              </Text>
            </div>
          }
        />
      </div>
    </div>
  );
}

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Drawer`. Нажмите кнопку «Открыть Drawer» и настройте `placement`, `title`, `tag`, `hideCloseButton` и `links` в панели Controls.',
      },
    },
  },
  render: (args) => <InteractiveDrawerDemo {...args} />,
};

export const PropPlacement: Story = {
  name: 'Пропс: placement (Выдвижение слева left или справа right)',
  args: {
    placement: 'right',
  },
  parameters: {
    controls: { include: ['placement'] },
    docs: {
      description: {
        story:
          'Пропс `placement` определяет край экрана, к которому привязана панель: `left` (для главного меню) или `right` (для инспектора/настроек). Доступен только контрол `placement`.',
      },
    },
  },
  render: (args) => (
    <InteractiveDrawerDemo
      isOpen={false}
      onClose={() => undefined}
      placement={args.placement}
      title="ИНСПЕКТОР НАСТРОЕК"
      tag="SYSTEM PANEL"
      links={SAMPLE_LINKS}
    />
  ),
};

export const PropTitleTagAndHideCloseButton: Story = {
  name: 'Пропсы: title, tag, closeLabel и hideCloseButton',
  args: {
    title: 'ГЛАВНОЕ МЕНЮ ПРИЛОЖЕНИЯ',
    tag: 'LINKEDIN PARSER',
    closeLabel: 'Закрыть боковое меню',
    hideCloseButton: false,
  },
  parameters: {
    controls: { include: ['title', 'tag', 'closeLabel', 'hideCloseButton'] },
    docs: {
      description: {
        story:
          'Пропсы `title` и `tag` формируют заголовок шапки, а `hideCloseButton` и `closeLabel` управляют кнопкой закрытия. Доступны только контролы `title`, `tag`, `closeLabel` и `hideCloseButton`.',
      },
    },
  },
  render: (args) => (
    <InteractiveDrawerDemo
      isOpen={false}
      onClose={() => undefined}
      title={args.title}
      tag={args.tag}
      closeLabel={args.closeLabel}
      hideCloseButton={args.hideCloseButton}
      links={SAMPLE_LINKS}
    />
  ),
};

export const PropLinks: Story = {
  name: 'Пропс: links (Навигационные пункты)',
  args: {
    links: SAMPLE_LINKS,
  },
  parameters: {
    controls: { include: ['links'] },
    docs: {
      description: {
        story:
          'Пропс `links` рендерит нумерованный список навигации (`01`, `02`...) с иконками, бейджами и стрелками `→`. Доступен только контрол `links`.',
      },
    },
  },
  render: (args) => (
    <InteractiveDrawerDemo
      isOpen={false}
      onClose={() => undefined}
      title="BLUEPRINT WORKSPACE"
      tag="NAVIGATION"
      links={args.links}
    />
  ),
};
