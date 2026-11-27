import { Badge, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { MediaQuery } from './MediaQuery';

const MOBILE_SLOT_MAP = {
  none: undefined,
  MobileBadge: (
    <Badge tone="danger" variant="solid" size="md">
      Mobile Viewport (&lt; 768px)
    </Badge>
  ),
} as const;

const TABLET_SLOT_MAP = {
  none: undefined,
  TabletBadge: (
    <Badge tone="warning" variant="solid" size="md">
      Tablet Viewport (768px – 1023px)
    </Badge>
  ),
} as const;

const DESKTOP_SLOT_MAP = {
  DesktopBadge: (
    <Badge tone="success" variant="solid" size="md">
      Desktop Viewport (&gt;= 1024px)
    </Badge>
  ),
} as const;

const WIDE_SLOT_MAP = {
  none: undefined,
  WideBadge: (
    <Badge tone="info" variant="solid" size="md">
      Wide Viewport (&gt;= 1440px)
    </Badge>
  ),
} as const;

const meta: Meta<typeof MediaQuery> = {
  title: 'Utils/Responsive/MediaQuery',
  component: MediaQuery,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Декларативный CSS-переключатель адаптивной разметки `MediaQuery`. Использует чистые CSS `@media`-правила и `display: contents / none` для показа слотов `mobile` (< 768px), `tablet` (768px–1023px), `desktop` (>= 1024px) и `wide` (>= 1440px) без перерендеров React и ошибок гидратации.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    mobile: MOBILE_SLOT_MAP.MobileBadge,
    tablet: TABLET_SLOT_MAP.TabletBadge,
    desktop: DESKTOP_SLOT_MAP.DesktopBadge,
    wide: WIDE_SLOT_MAP.WideBadge,
  },
  argTypes: {
    mobile: {
      control: 'select',
      options: Object.keys(MOBILE_SLOT_MAP),
      mapping: MOBILE_SLOT_MAP,
      description: 'Компонент, отображаемый на мобильных экранах (`< 768px`).',
    },
    tablet: {
      control: 'select',
      options: Object.keys(TABLET_SLOT_MAP),
      mapping: TABLET_SLOT_MAP,
      description: 'Компонент, отображаемый на планшетах (`768px - 1023px`).',
    },
    desktop: {
      control: 'select',
      options: Object.keys(DESKTOP_SLOT_MAP),
      mapping: DESKTOP_SLOT_MAP,
      description: 'Базовый компонент для десктопных экранов (`>= 1024px`).',
    },
    wide: {
      control: 'select',
      options: Object.keys(WIDE_SLOT_MAP),
      mapping: WIDE_SLOT_MAP,
      description: 'Компонент для широкоформатных мониторов (`>= 1440px`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MediaQuery>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `MediaQuery`. Измените ширину окна браузера или Viewport в тулбаре Storybook и настройте слоты `mobile`, `tablet`, `desktop`, `wide` в панели Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          MediaQuery — CSS-переключатель брейкпоинтов экрана
        </Text>
        <Text variant="caption" tone="secondary">
          Переключение происходит мгновенно на уровне CSS (@media) без участия JavaScript.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <MediaQuery {...args} />
      </div>
    </div>
  ),
};

export const PropMobileAndTablet: Story = {
  name: 'Пропсы: mobile и tablet (Мобильный и планшетный слоты)',
  args: {
    mobile: MOBILE_SLOT_MAP.MobileBadge,
    tablet: TABLET_SLOT_MAP.TabletBadge,
  },
  parameters: {
    controls: { include: ['mobile', 'tablet'] },
    docs: {
      description: {
        story:
          'Если слот `tablet` не передан (`tablet={undefined}`), компонент автоматически применяет класс `.noTablet`, расширяя диапазон `desktop` от 768px и выше. Доступны только контролы `mobile` и `tablet`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: mobile &amp; tablet — Контролы: [mobile, tablet]
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите none для tablet в Controls, чтобы проверить фоллбэк на desktop от 768px:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <MediaQuery
          mobile={args.mobile}
          tablet={args.tablet}
          desktop={DESKTOP_SLOT_MAP.DesktopBadge}
        />
      </div>
    </div>
  ),
};

export const PropDesktopAndWide: Story = {
  name: 'Пропсы: desktop и wide (Десктопный и широкоформатный слоты)',
  args: {
    desktop: DESKTOP_SLOT_MAP.DesktopBadge,
    wide: WIDE_SLOT_MAP.WideBadge,
  },
  parameters: {
    controls: { include: ['desktop', 'wide'] },
    docs: {
      description: {
        story:
          'Слот `wide` переопределяет `desktop` на экранах шире 1440px. Доступны только контролы `desktop` и `wide`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: desktop &amp; wide — Контролы: [desktop, wide]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте слот wide в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <MediaQuery desktop={args.desktop} wide={args.wide} />
      </div>
    </div>
  ),
};
