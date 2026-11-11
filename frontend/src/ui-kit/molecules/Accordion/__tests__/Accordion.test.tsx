import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Accordion } from '../Accordion';

describe('Accordion molecule', () => {
  const items = [
    {
      id: 'req1',
      title: '6+ лет опыта с React',
      content: '8 лет подтвержденного продакшн опыта',
      actionLabel: 'Обоснование',
    },
    {
      id: 'req2',
      title: 'Опыт с дизайн-системами',
      content: 'Разработка дизайн-системы Blueprint',
      actionLabel: 'Обоснование',
    },
  ];

  it('renders accordion items with titles and bullets', () => {
    render(<Accordion items={items} />);
    expect(screen.getByText('6+ лет опыта с React')).toBeTruthy();
    expect(screen.getByText('Опыт с дизайн-системами')).toBeTruthy();
    expect(screen.getAllByText('Обоснование')).toHaveLength(2);
  });

  it('toggles item content when clicking row header', () => {
    render(<Accordion items={items} />);
    expect(screen.queryByText('8 лет подтвержденного продакшн опыта')).toBeNull();

    const row = screen.getByText('6+ лет опыта с React');
    fireEvent.click(row);

    expect(screen.getByText('8 лет подтвержденного продакшн опыта')).toBeTruthy();

    fireEvent.click(row);
    expect(screen.queryByText('8 лет подтвержденного продакшн опыта')).toBeNull();
  });

  it('calls onToggleItem callback when item state changes', () => {
    const onToggle = vi.fn();
    render(<Accordion items={items} onToggleItem={onToggle} />);

    fireEvent.click(screen.getByText('6+ лет опыта с React'));
    expect(onToggle).toHaveBeenCalledWith('req1', true);
  });

  it('supports defaultExpandedIds', () => {
    render(<Accordion items={items} defaultExpandedIds={['req2']} />);
    expect(screen.getByText('Разработка дизайн-системы Blueprint')).toBeTruthy();
    expect(screen.queryByText('8 лет подтвержденного продакшн опыта')).toBeNull();
  });

  it('supports hiding bullets', () => {
    const { container } = render(<Accordion items={items} bullet={false} />);
    expect(container.textContent).not.toContain('•');
  });
});
