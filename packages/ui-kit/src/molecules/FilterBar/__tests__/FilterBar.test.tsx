import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar } from '../FilterBar';

describe('FilterBar molecule', () => {
  it('renders filter selects, selectable tags, and triggers reset', () => {
    const onReset = vi.fn();
    const onToggleTag = vi.fn();

    render(
      <FilterBar
        selects={[
          {
            id: 'workplace',
            ariaLabel: 'Workplace filter',
            value: 'remote',
            onChange: vi.fn(),
            options: [
              { value: '', label: 'All' },
              { value: 'remote', label: 'Remote' },
            ],
          },
        ]}
        tags={[
          { label: 'TypeScript', count: 12 },
          { label: 'React', count: 8 },
        ]}
        selectedTags={['TypeScript']}
        onToggleTag={onToggleTag}
        onReset={onReset}
      />
    );

    expect(screen.getByRole('toolbar', { name: 'Filters' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /React/i }));
    expect(onToggleTag).toHaveBeenCalledWith('React');

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
