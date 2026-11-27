import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { SortButton, type SortButtonProps, type SortDirection } from './SortButton';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../Text';

const ALL_DIRECTIONS = ['none', 'asc', 'desc'] as const;

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
      options: ALL_DIRECTIONS,
      description:
        'Текущее направление сортировки: `none` (не отсортировано), `asc` (по возрастанию), `desc` (по убыванию).',
    },
    active: {
      control: 'boolean',
      description: 'Явное переопределение активного состояния кнопки.',
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
          SortButton — Интерактивная кнопка сортировки колонок (Все контролы)
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
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `SortButton` со всеми контролами (`direction`, `size`, `tone`, `iconPosition`, `disabled`, `children`).',
      },
    },
  },
  render: (args) => <InteractiveSortButtonDemo {...args} />,
};

export const PropDirectionAll: Story = {
  name: 'Пропс: direction — Все состояния (Контрол: только children)',
  args: {
    children: 'MATCH_SCORE',
  },
  parameters: {
    controls: {
      include: ['children'],
    },
    docs: {
      description: {
        story:
          'Показывает все 3 состояния `direction` (`none`, `asc`, `desc`) одновременно с единственным контролом `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: direction — Все направления (Controls: только children)
        </Text>
        <Text variant="caption" tone="secondary">
          Измените название колонки в контроле children:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          {ALL_DIRECTIONS.map((d) => (
            <SortButton key={d} direction={d}>
              {args.children} ({d})
            </SortButton>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const PropDirectionSingle: Story = {
  name: 'Пропс: direction — Выбор направления (Контролы: direction, children)',
  args: {
    direction: 'asc',
    children: 'MATCH_SCORE',
  },
  parameters: {
    controls: {
      include: ['direction', 'children'],
    },
    docs: {
      description: {
        story: 'Одиночная кнопка сортировки с двумя контролами: `direction` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: direction — Одиночная кнопка (Controls: только direction и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте direction (&quot;{args.direction}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <SortButton direction={args.direction}>{args.children}</SortButton>
        </div>
      </div>
    </div>
  ),
};

export const PropIconPosition: Story = {
  name: 'Пропс: iconPosition (Контролы: iconPosition, children)',
  args: {
    iconPosition: 'start',
    children: 'SALARY_MAX',
  },
  parameters: {
    controls: {
      include: ['iconPosition', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропса `iconPosition` (`start` или `end`). В панели Controls доступны только `iconPosition` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: iconPosition (Controls: только iconPosition и children)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте iconPosition (&quot;{args.iconPosition}&quot;) в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <SortButton direction="desc" iconPosition={args.iconPosition}>
            {args.children}
          </SortButton>
        </div>
      </div>
    </div>
  ),
};

export const PropSizeAndTone: Story = {
  name: 'Пропсы: size и tone (Контролы: size, tone, children)',
  args: {
    size: 'md',
    tone: 'success',
    children: 'PRIORITY_RANK',
  },
  parameters: {
    controls: {
      include: ['size', 'tone', 'children'],
    },
    docs: {
      description: {
        story:
          'Демонстрация пропсов `size` и `tone`. В панели Controls доступны только `size`, `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: size &amp; tone (Controls: только size, tone, children)
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте размер (&quot;{args.size}&quot;) и семантический тон (&quot;{args.tone}&quot;):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <SortButton direction="asc" size={args.size} tone={args.tone}>
            {args.children}
          </SortButton>
        </div>
      </div>
    </div>
  ),
};
