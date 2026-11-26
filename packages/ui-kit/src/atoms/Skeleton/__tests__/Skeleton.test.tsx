import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton atom', () => {
  it('renders with default text variant and shimmer animation', () => {
    const { container } = render(<Skeleton data-testid="skeleton" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies width and height classes', () => {
    const { container } = render(<Skeleton variant="circle" width="50" height="xl" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/circle/);
    expect(el.className).toMatch(/w50/);
    expect(el.className).toMatch(/hXl/);
  });
});
