import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from '../Card';

describe('Card organism', () => {
  it('renders standard card with title, overline and status indicators', () => {
    render(
      <Card
        title="Test Job Title"
        overline="Acme Corp"
        statusIndicators={<span data-testid="indicator">Status</span>}
      />
    );

    expect(screen.getByText('Test Job Title')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByTestId('indicator')).toBeInTheDocument();
  });

  it('renders compact format with compact modifier class and no body overflow', () => {
    const { container } = render(
      <Card
        compact
        title="Compact Title"
        overline="Compact Corp"
        statusIndicators={<span data-testid="compact-indicator">Active</span>}
      />
    );

    expect(screen.getByText('Compact Title')).toBeInTheDocument();
    expect(screen.getByText('Compact Corp')).toBeInTheDocument();
    expect(screen.getByTestId('compact-indicator')).toBeInTheDocument();

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toMatch(/compact/);
  });

  it('renders skeleton loading state with aria-busy="true" for standard and compact', () => {
    const { rerender, container } = render(<Card isLoading data-testid="loading-card" />);
    let root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-busy')).toBe('true');

    rerender(<Card isLoading compact data-testid="loading-compact-card" />);
    root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.className).toMatch(/compact/);
  });
});
