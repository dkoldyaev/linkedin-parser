import { Icon, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeaderBrand } from './HeaderBrand';
import { Layers } from 'lucide-react';
import layoutStyles from '../../stories/StoryLayout.module.css';

const BRAND_ICON_MAP = {
  defaultBlueprintMark: undefined,
  LayersIcon: <Icon icon={Layers} size="md" tone="accent" />,
} as const;

const meta: Meta<typeof HeaderBrand> = {
  title: 'Organisms/Header/HeaderBrand',
  component: HeaderBrand,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент логотипа и названия системы `HeaderBrand` (`Header.Brand`). Отображает фирменный графический знак Blueprint (или кастомную иконку `brandIcon`), главный заголовок `title` (`<Text as="h1" variant="mono-label">`) и подзаголовок `subtitle`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'BLUEPRINT.UI',
    subtitle: 'DESIGN SYSTEM',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Основное название приложения или дизайн-системы.',
    },
    subtitle: {
      control: 'text',
      description: 'Вторичная подпись под названием (опционально).',
    },
    brandIcon: {
      control: 'select',
      options: Object.keys(BRAND_ICON_MAP),
      mapping: BRAND_ICON_MAP,
      description: 'Кастомная иконка бренда вместо стандартного геометрического знака Blueprint.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeaderBrand>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `HeaderBrand`. Настраивайте `title`, `subtitle` и `brandIcon` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          HeaderBrand — Фирменный блок логотипа и заголовка в шапке
        </Text>
        <Text variant="caption" tone="secondary">
          Используется в левой части организма &lt;Header&gt;.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <HeaderBrand {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropTitleAndSubtitle: Story = {
  name: 'Пропсы: title и subtitle (Название и подзаголовок)',
  args: {
    title: 'CV.ALTER',
    subtitle: 'ARCHITECTURE GRID v2.0',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропсы `title` и `subtitle` задают двухстрочную типографику бренда.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: title &amp; subtitle
        </Text>
        <Text variant="caption" tone="secondary">
          Отредактируйте title и subtitle в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <HeaderBrand {...args} />
      </div>
    </div>
  ),
};

export const PropBrandIcon: Story = {
  name: 'Пропс: brandIcon (Кастомная иконка логотипа)',
  args: {
    title: 'BLUEPRINT.UI',
    subtitle: 'CUSTOM ICON',
    brandIcon: BRAND_ICON_MAP.LayersIcon,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `brandIcon` позволяет заменить стандартный квадратный маркер Blueprint на произвольную иконку `<Icon />`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: brandIcon
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте brandIcon в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <HeaderBrand {...args} />
      </div>
    </div>
  ),
};
