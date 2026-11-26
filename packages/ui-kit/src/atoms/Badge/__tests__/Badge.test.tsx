import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Badge } from '../Badge';
import { Icon } from '../../Icon';
import { Sparkles } from 'lucide-react';

describe('Badge atom', () => {
  it('renders children with default variant and tone', () => {
    const { container } = render(<Badge>Default Badge</Badge>);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('badge');
    expect(badge.className).toContain('tone-neutral');
    expect(badge.textContent).toContain('Default Badge');
  });

  it('renders custom icon prop via Icon atom', () => {
    const { container } = render(
      <Badge icon={<Icon icon={Sparkles} size="2xs" data-testid="sparkle-icon" />} tone="primary">
        Featured
      </Badge>,
    );
    expect(screen.getByTestId('sparkle-icon')).toBeTruthy();
    expect(screen.getByText('Featured')).toBeTruthy();
    expect(container.querySelector('span')?.className).toContain('tone-primary');
  });

  it('supports universal variants and semantic tones', () => {
    const { container, rerender } = render(
      <Badge variant="chip" tone="success">
        Success Chip
      </Badge>,
    );
    expect(container.firstElementChild?.className).toContain('variant-chip');
    expect(container.firstElementChild?.className).toContain('tone-success');

    rerender(
      <Badge variant="counter" tone="info" size="xs">
        42
      </Badge>,
    );
    expect(container.firstElementChild?.className).toContain('variant-counter');
    expect(container.firstElementChild?.className).toContain('tone-info');
    expect(container.firstElementChild?.className).toContain('size-xs');
  });

  it('handles remove button click when onRemove is passed', () => {
    const onRemove = vi.fn();
    render(
      <Badge onRemove={onRemove} removeLabel="Delete tag">
        Deletable Tag
      </Badge>,
    );
    const removeBtn = screen.getByRole('button', { name: 'Delete tag' });
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
