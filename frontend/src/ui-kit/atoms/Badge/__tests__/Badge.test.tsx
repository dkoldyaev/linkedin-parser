import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Award, Sparkles } from 'lucide-react';
import { Badge, MatchBadge, StageBadge, SeverityBadge } from '../Badge';

describe('Badge atom', () => {
  it('renders children with default variant and tone', () => {
    const { container } = render(<Badge>Default Badge</Badge>);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('badge');
    expect(badge.className).toContain('tone-neutral');
    expect(badge.textContent).toContain('Default Badge');
  });

  it('renders custom icon prop', () => {
    const { container } = render(
      <Badge icon={<Sparkles data-testid="sparkle-icon" size={12} />} tone="primary">
        AI Generated
      </Badge>
    );
    expect(screen.getByTestId('sparkle-icon')).toBeTruthy();
    expect(screen.getByText('AI Generated')).toBeTruthy();
    expect(container.querySelector('span')?.className).toContain('tone-primary');
  });

  it('supports variants: match, stage, severity, ghost, chip', () => {
    const { container, rerender } = render(
      <Badge variant="match" tone="high" icon={<Award size={11} />}>
        95%
      </Badge>
    );
    expect(container.querySelector('span')?.className).toContain('variant-match');
    expect(container.querySelector('span')?.className).toContain('tone-high');
    expect(screen.getByText('95%')).toBeTruthy();

    rerender(
      <Badge variant="stage" tone="interview">
        Interview
      </Badge>
    );
    expect(container.querySelector('span')?.className).toContain('variant-stage');
    expect(container.querySelector('span')?.className).toContain('tone-interview');

    rerender(
      <Badge variant="severity" tone="critical">
        CRITICAL
      </Badge>
    );
    expect(container.querySelector('span')?.className).toContain('variant-severity');
    expect(container.querySelector('span')?.className).toContain('tone-critical');

    rerender(
      <Badge variant="ghost" size="xs">
        TypeScript
      </Badge>
    );
    expect(container.querySelector('span')?.className).toContain('variant-ghost');
    expect(container.querySelector('span')?.className).toContain('size-xs');
  });

  it('handles remove button click when onRemove is passed', () => {
    const onRemove = vi.fn();
    render(
      <Badge onRemove={onRemove} removeLabel="Delete tag">
        Deletable Tag
      </Badge>
    );
    const removeBtn = screen.getByRole('button', { name: 'Delete tag' });
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('maintains backwards compatibility wrappers', () => {
    const { rerender } = render(<MatchBadge score={88} />);
    expect(screen.getByText('88%')).toBeTruthy();

    rerender(<StageBadge stageTone="offer">Offer Received</StageBadge>);
    expect(screen.getByText('Offer Received')).toBeTruthy();

    rerender(<SeverityBadge severity="high">High</SeverityBadge>);
    expect(screen.getByText('High')).toBeTruthy();
  });
});
