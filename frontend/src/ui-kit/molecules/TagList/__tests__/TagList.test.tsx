import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagList } from '../TagList';

const sampleTags = [
  { id: 'all', label: 'Все теги', count: 10 },
  { id: 'react', label: 'react', count: 5 },
  { id: 'ts', label: 'typescript' },
];

describe('TagList molecule', () => {
  it('renders label and tag chips with count and # prefix', () => {
    render(<TagList tags={sampleTags} label="Теги:" />);

    expect(screen.getByText('Теги:')).toBeTruthy();
    expect(screen.getByText('Все теги [10]')).toBeTruthy();
    expect(screen.getByText('#react [5]')).toBeTruthy();
    expect(screen.getByText('#typescript')).toBeTruthy();
  });

  it('calls onTagSelect when a tag is clicked', () => {
    const onSelect = vi.fn();
    render(<TagList tags={sampleTags} onTagSelect={onSelect} />);

    fireEvent.click(screen.getByText('#react [5]'));
    expect(onSelect).toHaveBeenCalledWith('react');
  });

  it('marks active tag with aria-pressed', () => {
    render(<TagList tags={sampleTags} activeTag="react" />);

    const reactBtn = screen.getByText('#react [5]');
    expect(reactBtn.getAttribute('aria-pressed')).toBe('true');

    const allBtn = screen.getByText('Все теги [10]');
    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('can hide icon when showIcon is false', () => {
    const { container } = render(
      <TagList tags={sampleTags} showIcon={false} label="Категории" />
    );

    expect(screen.getByText('Категории')).toBeTruthy();
    expect(container.querySelector('svg')).toBeNull();
  });
});
