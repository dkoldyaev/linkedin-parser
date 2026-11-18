import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardFull, CardCollapsed } from '../Card';

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

  it('renders compact format with single 32px grid row and overline / title combination', () => {
    const { container } = render(
      <Card
        compact
        title="Staff Frontend Architect"
        overline="Stripe"
        statusIndicators={<span data-testid="compact-indicator">Active</span>}
      />
    );

    expect(screen.getByText('Stripe')).toBeInTheDocument();
    expect(screen.getByText('Staff Frontend Architect')).toBeInTheDocument();
    expect(screen.getByTestId('compact-indicator')).toBeInTheDocument();

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toMatch(/compact/);
  });

  it('supports direct usage of CardCollapsed, CardFull, CardFullLoading, CardCollapsedLoading', () => {
    render(
      <>
        <CardCollapsed
          title="Direct Collapsed"
          overline="Corp"
          statusIndicators={<span>CollapsedBadge</span>}
        />
        <CardFull
          title="Direct Full"
          overline="Corp"
          footer={<span>FooterContent</span>}
        />
        <Card.FullLoading data-testid="full-loading" />
        <Card.CollapsedLoading data-testid="collapsed-loading" />
      </>
    );

    expect(screen.getByText('Direct Collapsed')).toBeInTheDocument();
    expect(screen.getByText('Direct Full')).toBeInTheDocument();
    expect(screen.getByText('FooterContent')).toBeInTheDocument();
    expect(screen.getByTestId('full-loading')).toBeInTheDocument();
    expect(screen.getByTestId('collapsed-loading')).toBeInTheDocument();
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

