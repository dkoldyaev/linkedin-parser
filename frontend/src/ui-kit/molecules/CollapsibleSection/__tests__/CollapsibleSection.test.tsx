import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from '../CollapsibleSection';

describe('CollapsibleSection molecule', () => {
  it('renders collapsed by default without accessory when not provided', () => {
    render(
      <CollapsibleSection title="Системная диагностика">
        <div>Содержимое секции</div>
      </CollapsibleSection>
    );

    expect(screen.getByText('Системная диагностика')).toBeTruthy();
    expect(screen.getByText('Показать полностью')).toBeTruthy();
    expect(screen.queryByText('Содержимое секции')).toBeNull();
  });

  it('renders optional accessory slot with arbitrary element when provided', () => {
    render(
      <CollapsibleSection
        title="Параметры интеграции"
        accessory={<span data-testid="custom-tag">Параметры</span>}
      >
        <div>Содержимое секции</div>
      </CollapsibleSection>
    );

    expect(screen.getByTestId('custom-tag')).toBeTruthy();
  });

  it('expands when clicking header', () => {
    render(
      <CollapsibleSection title="Системная диагностика">
        <div>Содержимое секции</div>
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByText('Системная диагностика'));

    expect(screen.getByText('Содержимое секции')).toBeTruthy();
    expect(screen.getByText('Свернуть')).toBeTruthy();
  });

  it('does not toggle when clicking accessory element', () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleSection
        title="Системная диагностика"
        onOpenChange={onToggle}
        accessory={<button type="button">Действие</button>}
      >
        <div>Содержимое секции</div>
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Действие' }));
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.queryByText('Содержимое секции')).toBeNull();
  });
});
