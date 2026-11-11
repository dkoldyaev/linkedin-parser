import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterList } from '../FilterList';
import { FilterItem } from '../FilterItem';

const sampleOptions = [
  { value: '', label: 'Все страны' },
  { value: 'cyprus', label: 'Кипр', count: 18 },
  { value: 'germany', label: 'Германия', count: 42 },
];

const sampleTags = [
  { id: 'all', label: 'Все теги', count: 20 },
  { id: 'react', label: 'react', count: 5 },
];

describe('FilterItem and FilterList molecules', () => {
  describe('FilterItem', () => {
    it('renders single filter trigger with placeholder', () => {
      render(
        <FilterItem
          placeholder="Все страны [4]"
          options={sampleOptions}
        />
      );

      expect(screen.getByRole('combobox')).toBeTruthy();
      expect(screen.getByText('Все страны [4]')).toBeTruthy();
    });

    it('renders selected value', () => {
      render(
        <FilterItem
          placeholder="Все страны [4]"
          value="germany"
          options={sampleOptions}
        />
      );

      expect(screen.getByText('Германия [42]')).toBeTruthy();
    });
  });

  describe('FilterList', () => {
    it('renders list of filters with separators and tags', () => {
      render(
        <FilterList
          filters={[
            { id: 'country', placeholder: 'Все страны', options: sampleOptions },
            { id: 'city', placeholder: 'Все города', options: [{ value: 'berlin', label: 'Берлин' }] },
          ]}
          tags={sampleTags}
        />
      );

      expect(screen.getByText('Все страны')).toBeTruthy();
      expect(screen.getByText('Все города')).toBeTruthy();
      expect(screen.getByText('/')).toBeTruthy();
      expect(screen.getByText('#react [5]')).toBeTruthy();
    });

    it('renders reset button when active filter exists', () => {
      const onReset = vi.fn();
      render(
        <FilterList
          filters={[
            { id: 'country', value: 'germany', placeholder: 'Все страны', options: sampleOptions },
          ]}
          onReset={onReset}
          resetLabel="Сбросить"
        />
      );

      const resetBtn = screen.getByRole('button', { name: 'Сбросить' });
      expect(resetBtn).toBeTruthy();
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('renders bulk mode when enabled', () => {
      render(
        <FilterList
          bulkMode
          bulkContent={<span>Выбрано 5 элементов</span>}
        />
      );

      expect(screen.getByText('Выбрано 5 элементов')).toBeTruthy();
    });
  });
});
