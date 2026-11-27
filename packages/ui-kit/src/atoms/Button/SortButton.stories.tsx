import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { SortButton, type SortButtonProps, type SortDirection } from './SortButton';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

const meta: Meta<typeof SortButton> = {
  title: 'Atoms/Button/SortButton',
  component: SortButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Атомарный компонент кнопки сортировки `SortButton`, построенный на композиции `<Button variant="ghost">`, `<Text variant="mono">` и иконок направления (`ArrowUp`, `ArrowDown`, `ArrowUpDown` из `lucide-react`). Автоматически управляет атрибутами доступности `aria-sort` и `aria-pressed`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    direction: 'asc',
    size: 'sm',
    tone: 'neutral',
    iconPosition: 'end',
    disabled: false,
    children: 'UPDATED_AT',
  },
  argTypes: {
    direction: {
      control: 'inline-radio',
      options: ['none', 'asc', 'desc'],
      description:
        'Текущее направление сортировки: `none` (не отсортировано), `asc` (по возрастанию), `desc` (по убыванию).',
    },
    active: {
      control: 'boolean',
      description: 'Явное переопределение активного состояния кнопки (по умолчанию вычисляется из `direction !== "none"`).',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: 'Размер кнопки сортировки (`sm` или `md`).',
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
      description: 'Семантический цветовой тон текста и иконки сортировки.',
    },
    iconPosition: {
      control: 'inline-radio',
      options: ['start', 'end'],
      description: 'Позиция иконки стрелки сортировки относительно текста (`start` — слева, `end` — справа).',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует нажатие и переключение сортировки.',
    },
    children: {
      control: 'text',
      description: 'Название колонки или поля сортировки.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SortButton>;

function InteractiveSortButtonDemo(args: SortButtonProps): React.ReactElement {
  const [dir, setDir] = useState<SortDirection>(args.direction ?? 'asc');

  React.useEffect(() => {
    if (args.direction !== undefined) {
      setDir(args.direction);
    }
  }, [args.direction]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          SortButton — Интерактивная кнопка сортировки колонок
        </Text>
        <Text variant="caption" tone="secondary">
          Кликните по кнопке для переключения направления asc ↔ desc или используйте панель Controls.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <SortButton {...args} direction={dir} onToggle={(next) => setDir(next)}>
            {args.children} ({dir.toUpperCase()})
          </SortButton>
        </div>
      </div>
    </div>
  );
}

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `SortButton`. Кликните на кнопку или измените пропсы в Controls.',
      },
    },
  },
  render: (args) => <InteractiveSortButtonDemo {...args} />,
};

export const PropDirection: Story = {
  name: 'Пропс: direction (Направление сортировки)',
  args: {
    direction: 'asc',
    children: 'MATCH_SCORE',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `direction` отвечает за отображаемую иконку (`ArrowUpDown` для `none`, `ArrowUp` для `asc`, `ArrowDown` для `desc`) и значение `aria-sort`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: direction (&quot;none&quot; | &quot;asc&quot; | &quot;desc&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте direction в Controls или сравните все 3 состояния ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <SortButton {...args} />
        </div>
        <div className={layoutStyles.row}>
          <SortButton direction="none">direction=&quot;none&quot;</SortButton>
          <SortButton direction="asc">direction=&quot;asc&quot;</SortButton>
          <SortButton direction="desc">direction=&quot;desc&quot;</SortButton>
        </div>
      </div>
    </div>
  ),
};

export const PropIconPosition: Story = {
  name: 'Пропс: iconPosition (Позиция иконки)',
  args: {
    direction: 'desc',
    iconPosition: 'start',
    children: 'SALARY_MAX',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `iconPosition` определяет, с какой стороны от подписи рендерится индикатор сортировки (`start` или `end`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: iconPosition (&quot;start&quot; | &quot;end&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Полезно для колонок с выравниванием по правому краю (`iconPosition=&quot;start&quot;`):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <SortButton {...args} />
          <SortButton direction="asc" iconPosition="start">
            iconPosition=&quot;start&quot;
          </SortButton>
          <SortButton direction="asc" iconPosition="end">
            iconPosition=&quot;end&quot;
          </SortButton>
        </div>
      </div>
    </div>
  ),
};

export const PropSizeAndTone: Story = {
  name: 'Пропсы: size и tone (Размер и цветовой тон)',
  args: {
    size: 'md',
    tone: 'success',
    direction: 'asc',
    children: 'PRIORITY_RANK',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `size` (`"sm" | "md"`) и `tone` позволяют адаптировать кнопку сортировки под заголовки таблиц и панелей инструментов.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: size &amp; tone
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте размер и семантический тон в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <SortButton {...args} />
        </div>
      </div>
    </div>
  ),
};
