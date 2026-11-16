import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '../../../atoms/Badge';
import { TokenList } from '../TokenList';

describe('TokenList molecule', () => {
  it('renders children with consistent wrapper and styling', () => {
    render(
      <TokenList data-testid="token-list">
        <Badge>TypeScript</Badge>
        <Badge>React</Badge>
      </TokenList>
    );

    expect(screen.getByTestId('token-list')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
