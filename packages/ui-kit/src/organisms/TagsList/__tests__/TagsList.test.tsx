import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TagsList } from '../TagsList';

describe('TagsList organism', () => {
  it('renders badges and removes an item when deletable', () => {
    const onChange = vi.fn();
    render(<TagsList value={['React', 'TypeScript']} onChange={onChange} deletable />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(deleteButtons[0]);
    expect(onChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('adds tags using separator when addable', () => {
    const onChange = vi.fn();
    render(
      <TagsList
        value={['React']}
        onChange={onChange}
        addable
        separator=","
        placeholder="Add tag..."
      />,
    );

    const input = screen.getByPlaceholderText('Add tag...');
    fireEvent.change(input, { target: { value: 'TypeScript, GraphQL,' } });

    expect(onChange).toHaveBeenCalledWith(['React', 'TypeScript', 'GraphQL']);
  });

  it('truncates tags to maxVisible and expands on counter badge click', () => {
    render(
      <TagsList
        value={['React', 'TypeScript', 'Storybook', 'GraphQL', 'Node.js']}
        maxVisible={2}
      />,
    );

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.queryByText('Storybook')).not.toBeInTheDocument();

    const counter = screen.getByText('+3');
    expect(counter).toBeInTheDocument();

    fireEvent.click(counter);

    expect(screen.getByText('Storybook')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.queryByText('+3')).not.toBeInTheDocument();
  });
});
