import { Icon, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect, useState } from 'react';
import { TagsList, type TagsListProps } from './TagsList';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Tag } from 'lucide-react';

const ICON_MAP = {
  none: undefined,
  TagIcon: <Icon icon={Tag} size="2xs" />,
} as const;

const SAMPLE_TAGS = [
  'TypeScript',
  'React 19',
  'Storybook 10',
  'Design Systems',
  'Radix UI',
  'CSS Modules',
  'Vitest',
];

const meta: Meta<typeof TagsList> = {
  title: 'Organisms/TagsList/TagsList',
  component: TagsList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Организм редактируемого списка тегов и технологических чипов `TagsList`. Рендерит коллекцию `<Badge>` внутри контейнера `<TokenList>` с поддержкой удаления тегов (`deletable`), инлайн-добавления новых тегов через `<TagsList.Input>` (`addable`), автоматического разбиения по разделителю при вводе (`separator`, по умолчанию `","`) и сворачивания длинных списков в кнопку-счетчик `+N` (`maxVisible`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    value: SAMPLE_TAGS,
    deletable: true,
    addable: true,
    maxVisible: undefined,
    separator: ',',
    variant: 'chip',
    size: 'sm',
    tone: 'neutral',
    placeholder: 'Добавить технологию...',
  },
  argTypes: {
    value: {
      control: 'object',
      description: 'Массив строковых тегов.',
    },
    deletable: {
      control: 'boolean',
      description: 'Показывает кнопку удаления (`X`) на каждом бейдже.',
    },
    addable: {
      control: 'boolean',
      description: 'Отображает инлайн-поле ввода `<TagsListInput>` для добавления новых тегов.',
    },
    maxVisible: {
      control: { type: 'number', min: 1, max: 15, step: 1 },
      description:
        'Максимальное число отображаемых тегов до сворачивания остальных в интерактивный бейдж `+N`.',
    },
    separator: {
      control: 'text',
      description: 'Символ-разделитель, при вводе которого строка мгновенно разбивается и добавляется в теги (по умолчанию `","`).',
    },
    variant: {
      control: 'select',
      options: ['subtle', 'solid', 'outline', 'chip', 'counter', 'ghost'],
      description: 'Визуальный вариант бейджей тегов.',
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Размер бейджей тегов.',
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
      description: 'Семантический цветовой тон бейджей.',
    },
    icon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Ведущая иконка внутри каждого бейджа.',
    },
    placeholder: {
      control: 'text',
      description: 'Текст-заглушка для поля добавления тега.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TagsList>;

function ControlledTagsList(args: TagsListProps): React.ReactElement {
  const [tags, setTags] = useState<readonly string[]>(args.value);

  useEffect(() => {
    setTags(args.value);
  }, [args.value]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          TagsList — Редактируемый список тегов и технологического стека ({tags.length})
        </Text>
        <Text variant="caption" tone="secondary">
          Введите новый тег через запятую или Enter, либо удалите существующий нажатием на крестик.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <TagsList {...args} value={tags} onChange={setTags} />
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
          'Базовая интерактивная демонстрация `TagsList`. Настраивайте `deletable`, `addable`, `maxVisible`, `separator`, `variant`, `size`, `tone` и `placeholder` через панель Controls.',
      },
    },
  },
  render: (args) => <ControlledTagsList {...args} />,
};

export const PropDeletableAndAddable: Story = {
  name: 'Пропсы: deletable, addable, separator и placeholder',
  args: {
    value: ['React 19', 'TypeScript', 'Node.js'],
    deletable: true,
    addable: true,
    separator: ',',
    placeholder: 'Введите через запятую...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `deletable` включает крестики удаления на бейджах, а `addable` рендерит поле `<TagsListInput>`, которое разбивает вводимый текст по символу `separator`.',
      },
    },
  },
  render: (args) => <ControlledTagsList {...args} />,
};

export const PropMaxVisible: Story = {
  name: 'Пропс: maxVisible (Сворачивание списка в кнопку +N)',
  args: {
    value: SAMPLE_TAGS,
    maxVisible: 4,
    deletable: false,
    addable: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Когда количество тегов превышает `maxVisible`, лишние элементы скрываются за интерактивным бейджем `+N`, клик по которому раскрывает весь список.',
      },
    },
  },
  render: (args) => <ControlledTagsList {...args} />,
};

export const PropVariantSizeToneAndIcon: Story = {
  name: 'Пропсы: variant, size, tone и icon (Кастомизация бейджей)',
  args: {
    value: ['priority', 'dream-job', 'remote-eu'],
    variant: 'outline',
    size: 'xs',
    tone: 'accent',
    icon: ICON_MAP.TagIcon,
    deletable: true,
    addable: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `variant`, `size`, `tone` и `icon` передаются каждому дочернему `<Badge>` для стилевой адаптации списка.',
      },
    },
  },
  render: (args) => <ControlledTagsList {...args} />,
};
