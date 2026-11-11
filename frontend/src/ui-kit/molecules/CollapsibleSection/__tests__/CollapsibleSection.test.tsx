import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from '../CollapsibleSection';

describe('CollapsibleSection molecule', () => {
  it('renders collapsed by default without accessory when not provided', () => {
    render(
      <CollapsibleSection title="Оригинальный текст">
        <div>Содержимое секции</div>
      </CollapsibleSection>
    );

    expect(screen.getByText('Оригинальный текст')).toBeTruthy();
    expect(screen.getByText('Показать полностью')).toBeTruthy();
    expect(screen.queryByText('Содержимое секции')).toBeNull();
  });

  it('renders optional accessory slot when provided', () => {
    render(
      <CollapsibleSection
        title="Оригинальный текст"
        accessory={<button type="button">Копировать</button>}
      >
        <div>Содержимое секции</div>
      </CollapsibleSection>
    );

    expect(screen.getByRole('button', { name: 'Копировать' })).toBeTruthy();
  });

  it('expands when clicking header', () => {
    render(
      <CollapsibleSection title="Оригинальный текст">
        <div>Содержимое секции</div>
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByText('Оригинальный текст'));

    expect(screen.getByText('Содержимое секции')).toBeTruthy();
    expect(screen.getByText('Свернуть')).toBeTruthy();
  });

  it('does not toggle when clicking accessory', () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleSection
        title="Оригинальный текст"
        onOpenChange={onToggle}
        accessory={<button type="button">Копировать</button>}
      >
        <div>Содержимое секции</div>
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Копировать' }));
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.queryByText('Содержимое секции')).toBeNull();
  });
});
