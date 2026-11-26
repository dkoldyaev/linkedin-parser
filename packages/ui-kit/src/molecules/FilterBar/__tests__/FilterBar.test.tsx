import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FilterBar } from '../FilterBar';
import { OverlayProvider } from '../../../utils';

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
      />,
      { wrapper: OverlayProvider },
    );

    expect(screen.getByRole('toolbar', { name: 'Filters' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /React/i }));
    expect(onToggleTag).toHaveBeenCalledWith('React');

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
