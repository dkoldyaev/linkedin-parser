import { Badge, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { TagsListInput, type TagsListInputProps } from './TagsListInput';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { TokenList } from '../../molecules';

const meta: Meta<typeof TagsListInput> = {
  title: 'Organisms/TagsList/TagsListInput',
  component: TagsListInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент инлайн-поля добавления тегов `TagsListInput` (`TagsList.Input`). Построен поверх атома `<Input>` с автоматическим разбиением вводимой строки по разделителю `separator` (например `","`), фиксацией тегов по `Enter` или потере фокуса (`onBlur`) и отменой по клавише `Escape` (`onCancel`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    separator: ',',
    placeholder: 'Добавить тег (Enter или запятая)...',
    disabled: false,
  },
  argTypes: {
    separator: {
      control: 'text',
      description: 'Символ-разделитель, при вводе которого текст до разделителя немедленно передается в `onCommit`.',
    },
    placeholder: {
      control: 'text',
      description: 'Текст-подсказка в пустом поле и `aria-label` инпута.',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует ввод текста.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TagsListInput>;

function InteractiveTagsInputDemo(args: TagsListInputProps): React.ReactElement {
  const [committed, setCommitted] = useState<string[]>(['React 19', 'TypeScript']);

  const handleCommit = (newTags: readonly string[]) => {
    setCommitted((prev) => {
      const next = [...prev];
      for (const item of newTags) {
        if (!next.includes(item)) {
          next.push(item);
        }
      }
      return next;
    });
  };

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          TagsListInput — Инлайн-инпут добавления тегов с авторазбиением по separator
        </Text>
        <Text variant="caption" tone="secondary">
          Введите несколько тегов через разделитель &quot;{args.separator}&quot; или нажмите Enter:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <TokenList>
          {committed.map((tag) => (
            <Badge key={tag} variant="chip" size="sm" tone="accent">
              {tag}
            </Badge>
          ))}
          <TagsListInput {...args} onCommit={handleCommit} />
        </TokenList>
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
          'Базовая интерактивная демонстрация `TagsListInput`. Введите текст в поле и проверьте работу `separator`, `placeholder` и `disabled` через панель Controls.',
      },
    },
  },
  render: (args) => <InteractiveTagsInputDemo {...args} />,
};

export const PropSeparatorAndPlaceholder: Story = {
  name: 'Пропсы: separator и placeholder (Кастомный разделитель ";")',
  args: {
    separator: ';',
    placeholder: 'Введите навыки через точку с запятой (;)',
  },
  parameters: {
    controls: { include: ['separator', 'placeholder'] },
    docs: {
      description: {
        story:
          'Пропс `separator` позволяет задать любой символ-разделитель (например `","`, `";"`, `" "`), при вводе которого тег мгновенно коммитится в список. Доступны только контролы `separator` и `placeholder`.',
      },
    },
  },
  render: (args) => (
    <InteractiveTagsInputDemo
      separator={args.separator}
      placeholder={args.placeholder}
      onCommit={() => undefined}
    />
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Заблокированный инпут)',
  args: {
    disabled: true,
  },
  parameters: {
    controls: { include: ['disabled'] },
    docs: {
      description: {
        story: 'Пропс `disabled` блокирует ввод новых тегов. Доступен только контрол `disabled`.',
      },
    },
  },
  render: (args) => (
    <InteractiveTagsInputDemo
      separator=","
      placeholder="Поле заблокировано"
      disabled={args.disabled}
      onCommit={() => undefined}
    />
  ),
};
