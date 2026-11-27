import { Button, Icon, Text } from '../../atoms';
import { ChevronLeft, ChevronRight, Download, Share2, Trash2, X } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup } from './ButtonGroup';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Molecules/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула `ButtonGroup` объединяет несколько кнопок `<Button>` в единый блок управления на 32px сетке Blueprint. В режиме `attached` соседние кнопки смыкаются с перекрытием 1px рамок без удвоения контура; в режиме `detached` между ними сохраняется токенизированный отступ.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    variant: 'attached',
    fullWidth: false,
    role: 'group',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['attached', 'detached'],
      description:
        'Режим соединения кнопок: `attached` (слитная группа с общей 1px границей) или `detached` (кнопки с отступом).',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Растягивает группу на 100% ширины контейнера и равномерно распределяет ширину кнопок.',
    },
    role: {
      control: 'text',
      description: 'ARIA-роль контейнера группы кнопок (по умолчанию `"group"`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ButtonGroup`. Переключайте `variant` (`attached` / `detached`) и `fullWidth` в панели Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ButtonGroup — Группировка связанных кнопок действий
        </Text>
        <Text variant="caption" tone="secondary">
          Используется в футерах карточек (перемещение по этапам), тулбарах и переключателях режимов.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <ButtonGroup {...args}>
            <Button variant="secondary" size="sm" startIcon={<Icon icon={Share2} size="xs" />}>
              Share
            </Button>
            <Button variant="secondary" size="sm" startIcon={<Icon icon={Download} size="xs" />}>
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              tone="danger"
              startIcon={<Icon icon={Trash2} size="xs" />}
            >
              Delete
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  ),
};

export const PropVariant: Story = {
  name: 'Пропс: variant (Слитная attached / Раздельная detached)',
  args: {
    variant: 'attached',
  },
  parameters: {
    controls: { include: ['variant'] },
    docs: {
      description: {
        story:
          'Пропс `variant` переключает визуальную стыковку кнопок: `attached` склеивает кнопки с коллапсом внутренних границ, а `detached` разделяет их стандартным отступом. Доступен только контрол `variant`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: variant (&quot;attached&quot; | &quot;detached&quot;) — Контролы: [variant]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте variant в Controls для первого блока и сравните оба варианта ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div>
          <ButtonGroup variant={args.variant}>
            <Button variant="ghost" size="icon" aria-label="Move left">
              <Icon icon={ChevronLeft} size="sm" />
            </Button>
            <Button variant="ghost" size="icon" tone="danger" aria-label="Reject">
              <Icon icon={X} size="sm" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Move right">
              <Icon icon={ChevronRight} size="sm" />
            </Button>
          </ButtonGroup>
        </div>
        <div className={layoutStyles.row}>
          <ButtonGroup variant="attached">
            <Button variant="secondary" size="sm">
              Attached 1
            </Button>
            <Button variant="secondary" size="sm">
              Attached 2
            </Button>
          </ButtonGroup>
          <ButtonGroup variant="detached">
            <Button variant="secondary" size="sm">
              Detached 1
            </Button>
            <Button variant="secondary" size="sm">
              Detached 2
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  ),
};

export const PropFullWidth: Story = {
  name: 'Пропс: fullWidth (Растягивание группы на 100%)',
  args: {
    fullWidth: true,
  },
  parameters: {
    controls: { include: ['fullWidth'] },
    docs: {
      description: {
        story:
          'Пропс `fullWidth` растягивает контейнер группы на всю ширину родителя, а дочерние кнопки делят доступное пространство поровну. Доступен только контрол `fullWidth`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: fullWidth (boolean) — Контролы: [fullWidth]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг fullWidth в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ButtonGroup variant="attached" fullWidth={args.fullWidth}>
          <Button variant="secondary" size="sm">
            Day
          </Button>
          <Button variant="primary" size="sm">
            Week
          </Button>
          <Button variant="secondary" size="sm">
            Month
          </Button>
        </ButtonGroup>
      </div>
    </div>
  ),
};
