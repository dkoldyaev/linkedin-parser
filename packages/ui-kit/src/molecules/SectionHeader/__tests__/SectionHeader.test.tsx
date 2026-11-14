import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sparkles } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';

describe('SectionHeader molecule', () => {
  it('renders title and applies default mono styling', () => {
    render(<SectionHeader title="СОВПАДЕНИЯ [3]" />);
    expect(screen.getByText('СОВПАДЕНИЯ [3]')).toBeTruthy();
  });

  it('renders leading icon with custom tone', () => {
    const { container } = render(
      <SectionHeader title="AI Саммари" icon={Sparkles} iconTone="mint" />
    );
    expect(screen.getByText('AI Саммари')).toBeTruthy();
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders accessory action slot', () => {
    render(
      <SectionHeader
        title="Зарплата"
        accessory={<button type="button">Изменить</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Изменить' })).toBeTruthy();
  });

  it('handles collapsible click and toggle callback', () => {
    const onToggle = vi.fn();
    render(
      <SectionHeader
        title="Коллапсируемая секция"
        collapsible
        open={false}
        onToggle={onToggle}
      />
    );

    const header = screen.getByRole('button', { name: /Коллапсируемая секция/i });
    fireEvent.click(header);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders divider when enabled', () => {
    const { container } = render(<SectionHeader title="Секция с разделителем" divider />);
    const headerEl = container.firstElementChild;
    expect(headerEl?.className).toMatch(/headerDivider/);
  });
});
