import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stepper } from '../Stepper';

describe('Stepper molecule', () => {
  const steps = [
    { id: '1', label: 'Created', timestamp: '10:00' },
    { id: '2', fromLabel: 'Created', label: 'In Review', timestamp: '11:00' },
    { id: '3', fromLabel: 'In Review', label: 'Approved', timestamp: '12:00', active: true },
  ];

  it('renders all steps and transition badges', () => {
    render(<Stepper items={steps} />);
    expect(screen.getAllByText('Created').length).toBeGreaterThan(0);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('collapses older items when maxCollapsedItems is set and expands on click', () => {
    render(<Stepper items={steps} maxCollapsedItems={2} />);
    expect(screen.queryByText('10:00')).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: /Show 1 earlier steps/i });
    fireEvent.click(expandButton);
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('renders EmptyState when items array is empty', () => {
    render(<Stepper items={[]} emptyTitle="Empty timeline" />);
    expect(screen.getByText('Empty timeline')).toBeInTheDocument();
  });
});
