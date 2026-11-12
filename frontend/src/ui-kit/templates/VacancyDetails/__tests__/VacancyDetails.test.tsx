import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VacancyDetails, type VacancyDetailsData } from '../VacancyDetails';

describe('VacancyDetails template', () => {
  const sampleVacancy: VacancyDetailsData = {
    id: 'test-1',
    title: 'Principal Design Systems Engineer',
    company: 'Linear',
    sourceUrl: 'https://linear.app/careers',
    location: 'Amsterdam',
    workplace: 'hybrid',
    dateAdded: '12 нояб. 2026',
    status: 'interview',
    score: 88,
    salaryText: '€95 000 – €110 000 / год',
    aiSummary: 'Отличное соответствие профилю.',
    techStack: ['React', 'TypeScript'],
    tags: ['high-priority'],
    notes: 'Интервью запланировано на четверг',
    originalDescription: 'About the role...',
    scoringReport: {
      score: 88,
      summary: 'Отличное соответствие профилю',
      matchedRequirements: [
        { id: 'm1', requirement: 'React & TypeScript', evidence: '7 лет' },
      ],
    },
    history: [
      { id: 'h1', stage: 'Отклик', timestamp: '01 нояб. 2026', comment: 'Отправлено' },
    ],
  };

  it('renders header with title, company, match badge, and status', () => {
    render(<VacancyDetails vacancy={sampleVacancy} />);

    expect(screen.getByText('Principal Design Systems Engineer')).toBeTruthy();
    expect(screen.getByText('Linear')).toBeTruthy();
    expect(screen.getByText('88%')).toBeTruthy();
    expect(screen.getByText('INTERVIEW')).toBeTruthy();
    expect(screen.getByText('Amsterdam')).toBeTruthy();
    expect(screen.getByText('Гибрид')).toBeTruthy();
    expect(screen.getAllByText('€95 000 – €110 000 / год').length).toBeGreaterThanOrEqual(1);
  });

  it('allows switching between tabs', () => {
    render(<VacancyDetails vacancy={sampleVacancy} defaultTab="overview" />);

    // In overview
    expect(screen.getByText('AI Саммари вакансии')).toBeTruthy();

    // Switch to CV Compatibility
    const compatTab = screen.getByRole('tab', { name: /совместимость с резюме/i });
    fireEvent.click(compatTab);
    expect(screen.getByRole('heading', { name: 'Совместимость с резюме' })).toBeTruthy();

    // Switch to Stage History
    const historyTab = screen.getByRole('tab', { name: /история переходов/i });
    fireEvent.click(historyTab);
    expect(screen.getByText('История переходов по этапам')).toBeTruthy();

    // Switch to Notes
    const notesTab = screen.getByRole('tab', { name: /заметки/i });
    fireEvent.click(notesTab);
    expect(screen.getByText('Личные заметки')).toBeTruthy();
  });

  it('calls onStatusChange when clicking a stage button', () => {
    const onStatusChange = vi.fn();
    render(<VacancyDetails vacancy={sampleVacancy} onStatusChange={onStatusChange} />);

    const offerBtn = screen.getByRole('button', { name: 'Оффер' });
    fireEvent.click(offerBtn);

    expect(onStatusChange).toHaveBeenCalledWith('offer');
  });

  it('calls onClose and onDelete when header action buttons are clicked', () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    render(
      <VacancyDetails
        vacancy={sampleVacancy}
        onClose={onClose}
        onDelete={onDelete}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'Закрыть карточку' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const deleteBtn = screen.getByRole('button', { name: 'Удалить вакансию' });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onSaveNotes when saving notes in notes tab', () => {
    const onSaveNotes = vi.fn();
    render(
      <VacancyDetails
        vacancy={sampleVacancy}
        defaultTab="notes"
        onSaveNotes={onSaveNotes}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /сохранить заметки/i });
    fireEvent.click(saveBtn);
    expect(onSaveNotes).toHaveBeenCalledWith('Интервью запланировано на четверг');
  });
});
