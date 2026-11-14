import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TokenList } from '../TokenList';

describe('TokenList molecule', () => {
  it('renders readonly tokens and supports maxVisible overflow counter', () => {
    render(
      <TokenList
        mode="readonly"
        tokens={['TypeScript', 'React', 'Node.js', 'Docker']}
        maxVisible={2}
      />
    );
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.queryByText('Node.js')).not.toBeInTheDocument();

    const overflowBadge = screen.getByRole('button', { name: '+2' });
    fireEvent.click(overflowBadge);
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
  });

  it('toggles selection in selectable mode', () => {
    const onToggle = vi.fn();
    render(
      <TokenList
        mode="selectable"
        tokens={['TypeScript', 'React']}
        defaultSelectedTokens={['TypeScript']}
        onToggleToken={onToggle}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /React/i }));
    expect(onToggle).toHaveBeenCalledWith('React');
  });

  it('adds and removes tokens in editable mode', () => {
    const onChange = vi.fn();
    render(
      <TokenList
        mode="editable"
        label="Tech Stack"
        defaultTokens={['TypeScript']}
        onChange={onChange}
        addLabel="Add technology"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add technology' }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'GraphQL' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['TypeScript', 'GraphQL']);

    const removeBtn = screen.getByRole('button', { name: 'Remove TypeScript' });
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenLastCalledWith(['GraphQL']);
  });
});
