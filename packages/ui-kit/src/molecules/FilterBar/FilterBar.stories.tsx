import { Button, Icon, Text } from '../../atoms';
import { FilterBar, type FilterBarProps } from './FilterBar';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { SlidersHorizontal } from 'lucide-react';

const SAMPLE_TAGS = [
  { label: 'TypeScript', count: 14 },
  { label: 'React', count: 12 },
  { label: 'Node.js', count: 8 },
  { label: 'Design Systems', count: 6 },
  { label: 'Fintech', count: 4 },
] as const;

const meta: Meta<typeof FilterBar> = {
  title: 'Molecules/FilterBar/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула панели фильтрации `FilterBar` (`role="toolbar"`) на 32px сетке Blueprint. Композирует выпадающие списки `<Select variant="filter">`, разделители `<Text>`, список чипов `<TokenList>` + `<Badge variant="chip">` и кнопку сброса `<FilterBar.Reset>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    tags: SAMPLE_TAGS,
    selectedTags: ['TypeScript'],
    tagPrefix: '#',
    maxVisibleTags: 5,
    resetLabel: 'Сбросить',
  },
  argTypes: {
    selects: {
      control: 'object',
      description: 'Массив конфигураций выпадающих фильтров `FilterBarSelectConfig`.',
    },
    tags: {
      control: 'object',
      description: 'Массив тегов `FilterBarTagItem` (`label`, `count`) для быстрой фильтрации по клику.',
    },
    selectedTags: {
      control: 'object',
      description: 'Массив выбранных в данный момент строковых меток тегов.',
    },
    tagPrefix: {
      control: 'text',
      description: 'Префикс перед названием каждого тега (например `"#"`).',
    },
    maxVisibleTags: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Максимальное количество отображаемых тегов в панели.',
    },
    hasActiveFilters: {
      control: 'boolean',
      description: 'Явный флаг наличия активных фильтров (управляет видимостью кнопки сброса).',
    },
    resetLabel: {
      control: 'text',
      description: 'Текст кнопки сброса фильтров.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

function InteractiveFilterBarDemo(args: FilterBarProps): React.ReactElement {
  const [workplace, setWorkplace] = useState('remote');
  const [score, setScore] = useState('');
  const [selectedTags, setSelectedTags] = useState<readonly string[]>(
    args.selectedTags ?? ['TypeScript'],
  );

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const handleReset = () => {
    setWorkplace('');
    setScore('');
    setSelectedTags([]);
  };

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          FilterBar — Панель комбинированной фильтрации (Selects + Tags + Reset)
        </Text>
        <Text variant="caption" tone="secondary">
          Выберите фильтр в выпадающем списке или кликните по тегам. При активном фильтре справа
          появляется кнопка сброса.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <FilterBar
          {...args}
          selects={[
            {
              id: 'workplace',
              ariaLabel: 'Формат работы',
              value: workplace,
              onChange: setWorkplace,
              options: [
                { value: '', label: 'Все форматы' },
                { value: 'remote', label: 'Удаленно (Remote)' },
                { value: 'hybrid', label: 'Гибрид (Hybrid)' },
                { value: 'onsite', label: 'В офисе (On-site)' },
              ],
            },
            {
              id: 'score',
              ariaLabel: 'Минимальный Match Score',
              value: score,
              onChange: setScore,
              options: [
                { value: '', label: 'Любой Match %' },
                { value: '80', label: '80% и выше' },
                { value: '60', label: '60% и выше' },
              ],
            },
          ]}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          onReset={handleReset}
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
          'Базовая интерактивная демонстрация `FilterBar`. Настраивайте `tagPrefix`, `maxVisibleTags`, `resetLabel` и `tags` через панель Controls.',
      },
    },
  },
  render: (args) => <InteractiveFilterBarDemo {...args} />,
};

export const PropTagsAndTagPrefix: Story = {
  name: 'Пропсы: tags, selectedTags, tagPrefix, maxVisibleTags',
  args: {
    tags: SAMPLE_TAGS,
    selectedTags: ['TypeScript', 'React'],
    tagPrefix: '#',
    maxVisibleTags: 3,
  },
  parameters: {
    controls: { include: ['tags', 'selectedTags', 'tagPrefix', 'maxVisibleTags'] },
    docs: {
      description: {
        story:
          'Пропсы `tags`, `selectedTags`, `tagPrefix` и `maxVisibleTags` управляют отображением списка интерактивных чипов-тегов со счетчиками. Доступны только контролы `tags`, `selectedTags`, `tagPrefix` и `maxVisibleTags`.',
      },
    },
  },
  render: (args) => (
    <InteractiveFilterBarDemo
      tags={args.tags}
      selectedTags={args.selectedTags}
      tagPrefix={args.tagPrefix}
      maxVisibleTags={args.maxVisibleTags}
    />
  ),
};

export const PropResetAndActionsSlot: Story = {
  name: 'Пропсы: resetLabel и hasActiveFilters',
  args: {
    hasActiveFilters: true,
    resetLabel: 'Очистить всё',
  },
  parameters: {
    controls: { include: ['resetLabel', 'hasActiveFilters'] },
    docs: {
      description: {
        story:
          'Пропс `resetLabel` задает текст кнопки сброса, `hasActiveFilters` принудительно показывает кнопку сброса, а `actionsSlot` позволяет добавить кастомные кнопки справа. Доступны только контролы `resetLabel` и `hasActiveFilters`.',
      },
    },
  },
  render: (args) => (
    <InteractiveFilterBarDemo
      tags={SAMPLE_TAGS}
      selectedTags={['TypeScript']}
      hasActiveFilters={args.hasActiveFilters}
      resetLabel={args.resetLabel}
      actionsSlot={
        <Button variant="secondary" size="sm" startIcon={<Icon icon={SlidersHorizontal} size="xs" />}>
          Доп. фильтры
        </Button>
      }
    />
  ),
};
