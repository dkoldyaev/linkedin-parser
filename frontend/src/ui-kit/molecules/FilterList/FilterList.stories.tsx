import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Trash2 } from 'lucide-react';
import { FilterList, type FilterDropdownGroup, type FilterTag } from './FilterList';
import styles from './FilterListStory.module.css';

const meta: Meta<typeof FilterList> = {
  title: 'Molecules/FilterList',
  component: FilterList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FilterList>;

const sampleDropdowns: readonly FilterDropdownGroup[] = [
  {
    id: 'country',
    value: '',
    placeholder: 'Все страны',
    options: [
      { value: 'Cyprus', label: 'Кипр', count: 18 },
      { value: 'Germany', label: 'Германия', count: 42 },
      { value: 'Armenia', label: 'Армения', count: 9 },
      { value: 'Georgia', label: 'Грузия', count: 14 },
    ],
    onChange: () => {},
  },
  {
    id: 'city',
    value: '',
    placeholder: 'Все города',
    options: [
      { value: 'Limassol', label: 'Лимассол', count: 12 },
      { value: 'Berlin', label: 'Берлин', count: 28 },
      { value: 'Yerevan', label: 'Ереван', count: 9 },
    ],
    onChange: () => {},
  },
  {
    id: 'workplace',
    value: '',
    placeholder: 'Все форматы',
    options: [
      { value: 'remote', label: 'Удаленно' },
      { value: 'hybrid', label: 'Гибрид' },
      { value: 'on-site', label: 'В офисе' },
    ],
    onChange: () => {},
  },
  {
    id: 'closed',
    value: '',
    placeholder: 'Все статусы',
    options: [
      { value: 'false', label: 'Открытые' },
      { value: 'true', label: 'Закрытые' },
    ],
    onChange: () => {},
  },
];

const sampleTags: readonly FilterTag[] = [
  { id: 'all', label: 'Все теги', count: 34 },
  { id: 'react', label: 'react', count: 18 },
  { id: 'typescript', label: 'typescript', count: 24 },
  { id: 'bun', label: 'bun', count: 7 },
  { id: 'nextjs', label: 'nextjs', count: 11 },
  { id: 'graphql', label: 'graphql', count: 5 },
  { id: 'tailwind', label: 'tailwind', count: 9 },
];

export const Default: Story = {
  render: () => {
    const InteractiveExample = () => {
      const [country, setCountry] = useState<string>('');
      const [city, setCity] = useState<string>('');
      const [workplace, setWorkplace] = useState<string>('');
      const [closed, setClosed] = useState<string>('');
      const [activeTag, setActiveTag] = useState<string>('all');

      const dropdowns: FilterDropdownGroup[] = [
        {
          id: 'country',
          value: country,
          placeholder: 'Все страны [4]',
          options: sampleDropdowns[0].options,
          onChange: setCountry,
        },
        {
          id: 'city',
          value: city,
          placeholder: 'Все города [3]',
          options: sampleDropdowns[1].options,
          onChange: setCity,
        },
        {
          id: 'workplace',
          value: workplace,
          placeholder: 'Все форматы',
          options: sampleDropdowns[2].options,
          onChange: setWorkplace,
        },
        {
          id: 'closed',
          value: closed,
          placeholder: 'Все статусы',
          options: sampleDropdowns[3].options,
          onChange: setClosed,
        },
      ];

      const handleReset = () => {
        setCountry('');
        setCity('');
        setWorkplace('');
        setClosed('');
        setActiveTag('all');
      };

      return (
        <FilterList
          dropdowns={dropdowns}
          tags={sampleTags}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
          onReset={handleReset}
          resetLabel="Сбросить фильтры"
        />
      );
    };
    return <InteractiveExample />;
  },
};

export const WithActiveFilters: Story = {
  render: () => {
    const dropdowns: FilterDropdownGroup[] = [
      {
        ...sampleDropdowns[0],
        value: 'Cyprus',
      },
      {
        ...sampleDropdowns[1],
        value: 'Limassol',
      },
      sampleDropdowns[2],
      sampleDropdowns[3],
    ];

    return (
      <FilterList
        dropdowns={dropdowns}
        tags={sampleTags}
        activeTag="react"
        showReset
        onReset={() => {}}
        resetLabel="Сбросить фильтры"
      />
    );
  },
};

export const OnlyTags: Story = {
  render: () => (
    <FilterList
      tags={sampleTags}
      activeTag="typescript"
      onTagSelect={() => {}}
      tagsLabel="Технологии:"
    />
  ),
};

export const OnlyDropdowns: Story = {
  render: () => (
    <FilterList
      dropdowns={sampleDropdowns}
    />
  ),
};

export const BulkActionMode: Story = {
  render: () => (
    <FilterList
      bulkMode
      bulkContent={
        <div className={styles.bulkActionsRow}>
          <span className={styles.bulkCount}>ВЫБРАНО: 4 ВАКАНСИИ</span>
          <button type="button" className={styles.bulkBtn}>
            <Archive size={13} aria-hidden />
            <span>В архив</span>
          </button>
          <button type="button" className={styles.bulkBtn}>
            <Trash2 size={13} aria-hidden />
            <span>Удалить</span>
          </button>
        </div>
      }
    />
  ),
};
