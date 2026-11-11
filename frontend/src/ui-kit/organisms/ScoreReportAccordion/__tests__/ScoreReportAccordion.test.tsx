import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScoreReportAccordion } from '../ScoreReportAccordion';

describe('ScoreReportAccordion organism', () => {
  const sampleReport = {
    score: 88,
    summary: 'Отличное соответствие профилю',
    seniorityAssessment: {
      status: 'matched' as const,
      label: 'Senior / Lead',
      comment: 'Полное соответствие',
    },
    matchedRequirements: [
      {
        id: 'm1',
        requirement: '6+ лет глубокого опыта с React',
        evidence: '8 лет работы с React',
      },
    ],
    missingRequirements: [
      {
        id: 'miss1',
        requirement: 'GraphQL Apollo Federation',
        severity: 'low' as const,
        reason: 'Нет опыта federation',
      },
    ],
    criticalGaps: [
      {
        id: 'gap1',
        requirement: 'Локация в часовом поясе CET',
        reason: 'Требуется CET +/- 1 час',
      },
    ],
  };

  it('renders score header, summary, and seniority assessment', () => {
    render(<ScoreReportAccordion {...sampleReport} />);

    expect(screen.getByText('Совместимость с резюме')).toBeTruthy();
    expect(screen.getByText('88%')).toBeTruthy();
    expect(screen.getByText('Отличное соответствие профилю')).toBeTruthy();
    expect(screen.getByText('Senior / Lead')).toBeTruthy();
  });

  it('renders sections separated by SectionHeaders', () => {
    render(<ScoreReportAccordion {...sampleReport} />);

    expect(screen.getByText(/СОВПАДЕНИЯ \[1\]/i)).toBeTruthy();
    expect(screen.getByText(/ПРОПУСКИ \[1\]/i)).toBeTruthy();
    expect(screen.getByText(/КРИТИЧЕСКИЕ РАСХОЖДЕНИЯ \[1\]/i)).toBeTruthy();
  });

  it('allows expanding matched evidence via the accordion item', () => {
    render(<ScoreReportAccordion {...sampleReport} />);

    expect(screen.queryByText('8 лет работы с React')).toBeNull();

    fireEvent.click(screen.getByText('6+ лет глубокого опыта с React'));
    expect(screen.getByText('8 лет работы с React')).toBeTruthy();
  });

  it('calls onReanalyze when reanalyze button is clicked', () => {
    const onReanalyze = vi.fn();
    render(<ScoreReportAccordion {...sampleReport} onReanalyze={onReanalyze} />);

    const reanalyzeBtn = screen.getByRole('button', { name: /переанализировать/i });
    fireEvent.click(reanalyzeBtn);
    expect(onReanalyze).toHaveBeenCalledTimes(1);
  });
});
