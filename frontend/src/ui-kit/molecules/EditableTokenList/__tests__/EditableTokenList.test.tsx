import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditableTokenList } from '../EditableTokenList';

describe('EditableTokenList molecule', () => {
  it('renders tokens passed via value', () => {
    render(
      <EditableTokenList
        label="Technologies"
        value={['React', 'TypeScript', 'Vite']}
      />
    );

    expect(screen.getByText('Technologies')).toBeTruthy();
    expect(screen.getByText('React')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.getByText('Vite')).toBeTruthy();
  });

  it('calls onChange with updated tokens when remove button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <EditableTokenList
        value={['React', 'TypeScript', 'Vite']}
        onChange={handleChange}
      />
    );

    const removeReactBtn = screen.getByRole('button', { name: 'Удалить React' });
    fireEvent.click(removeReactBtn);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(['TypeScript', 'Vite']);
  });

  it('renders inline input and commits new token on Enter', () => {
    const handleChange = vi.fn();
    render(
      <EditableTokenList
        value={['React', 'TypeScript']}
        onChange={handleChange}
        addMode
        placeholder="Add technology..."
      />
    );

    const input = screen.getByPlaceholderText('Add technology...');
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: 'Bun' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith(['React', 'TypeScript', 'Bun']);
  });

  it('supports comma-separated token addition', () => {
    const handleChange = vi.fn();
    render(
      <EditableTokenList
        value={['React']}
        onChange={handleChange}
        addMode
        placeholder="Add technology..."
      />
    );

    const input = screen.getByPlaceholderText('Add technology...');
    fireEvent.change(input, { target: { value: 'TypeScript, Vite, Bun' } });

    expect(handleChange).toHaveBeenCalledWith(['React', 'TypeScript', 'Vite']);
  });

  it('applies tone to tag chips', () => {
    const { container } = render(
      <EditableTokenList
        value={['Critical Alert']}
        tone="danger"
      />
    );

    const chip = container.querySelector('[class*="tone-danger"]');
    expect(chip).toBeTruthy();
  });
});
