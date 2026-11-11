import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StageStepper } from '../StageStepper';
import { StageStep } from '../StageStep';

describe('StageStep and StageStepper molecules', () => {
  describe('StageStep', () => {
    it('renders stage name, fromStage, and timestamp', () => {
      render(
        <StageStep
          stage="Техническое интервью"
          fromStage="Скрининг"
          timestamp="Сегодня, 14:00"
          isCurrent
        />
      );

      expect(screen.getByText('Техническое интервью')).toBeTruthy();
      expect(screen.getByText('Скрининг')).toBeTruthy();
      expect(screen.getByText('Сегодня, 14:00')).toBeTruthy();
    });

    it('renders comment and action buttons', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <StageStep
          stage="Интервью"
          comment="Кандидат подтвердил навыки"
          onEditComment={onEdit}
          onDeleteComment={onDelete}
        />
      );

      expect(screen.getByText('Кандидат подтвердил навыки')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Редактировать комментарий' }));
      expect(onEdit).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: 'Удалить комментарий' }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('renders add comment button when comment is missing and onAddComment provided', () => {
      const onAdd = vi.fn();
      render(<StageStep stage="Интервью" onAddComment={onAdd} />);

      const addBtn = screen.getByRole('button', { name: /добавить комментарий/i });
      fireEvent.click(addBtn);
      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('StageStepper', () => {
    const items = [
      {
        id: '1',
        stage: 'Интервью',
        fromStage: 'Скрининг',
        timestamp: '14:00',
        isCurrent: true,
      },
      {
        id: '2',
        stage: 'Скрининг',
        timestamp: '11:00',
      },
    ];

    it('renders items declaratively', () => {
      render(<StageStepper items={items} />);
      expect(screen.getByText('Интервью')).toBeTruthy();
      expect(screen.getAllByText('Скрининг')).toHaveLength(2);
    });

    it('renders composable children StageSteps', () => {
      render(
        <StageStepper>
          <StageStep stage="Этап 1" timestamp="10:00" />
          <StageStep stage="Этап 2" timestamp="12:00" isCurrent />
        </StageStepper>
      );

      expect(screen.getByText('Этап 1')).toBeTruthy();
      expect(screen.getByText('Этап 2')).toBeTruthy();
    });

    it('renders empty placeholder when no items or children provided', () => {
      render(<StageStepper items={[]} />);
      expect(screen.getByText('История переходов пуста')).toBeTruthy();
    });
  });
});
