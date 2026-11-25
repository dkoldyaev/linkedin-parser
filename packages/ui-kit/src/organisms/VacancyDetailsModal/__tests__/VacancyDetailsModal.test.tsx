import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OverlayProvider } from '../../../utils';
import { VacancyDetailsModal } from '../VacancyDetailsModal';

describe('VacancyDetailsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Staff Frontend Architect',
    company: 'Stripe',
    sourceUrl: 'https://linkedin.com/jobs/view/100',
    location: 'Remote (EU)',
    workplace: 'remote',
    workplaceLabel: 'Удаленно',
    formattedSalary: 'USD 15 000 / мес',
    status: 'interview',
    stageOptions: [
      { value: 'applied', label: 'Написал' },
      { value: 'interview', label: 'Собеседование' },
      { value: 'offer', label: 'Оффер' },
    ],
    onStatusChange: vi.fn(),
    aiSummary: 'Leading the Blueprint component architecture.',
    techStack: ['React', 'TypeScript', 'Storybook'],
    tags: ['priority'],
    historyItems: [
      {
        id: 'h1',
        label: 'Собеседование',
        timestamp: '12 нояб., 15:00',
        tone: 'accent' as const,
        comment: 'Первое интервью',
      },
    ],
    onReject: vi.fn(),
  };

  it('renders modal header, title, company, and meta badges', () => {
    render(<VacancyDetailsModal {...defaultProps} />, { wrapper: OverlayProvider });

    expect(screen.getByText('Staff Frontend Architect')).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();
    expect(screen.getByText('Remote (EU)')).toBeInTheDocument();
    expect(screen.getByText('Удаленно')).toBeInTheDocument();
    expect(screen.getAllByText('USD 15 000 / мес').length).toBeGreaterThanOrEqual(1);
  });

  it('renders status buttons and switches stage on click', () => {
    render(<VacancyDetailsModal {...defaultProps} />, { wrapper: OverlayProvider });

    const offerBtn = screen.getByRole('button', { name: 'Оффер' });
    fireEvent.click(offerBtn);
    expect(defaultProps.onStatusChange).toHaveBeenCalledWith('offer');
  });

  it('calls onReject when reject button is clicked', () => {
    render(<VacancyDetailsModal {...defaultProps} />, { wrapper: OverlayProvider });

    const rejectBtn = screen.getByRole('button', { name: /В НЕ ПОДОШЛО/i });
    fireEvent.click(rejectBtn);
    expect(defaultProps.onReject).toHaveBeenCalledTimes(1);
  });

  it('switches to compatibility tab when clicked', () => {
    render(
      <VacancyDetailsModal
        {...defaultProps}
        cvAssessment="High level match for UI platform role."
      />,
      { wrapper: OverlayProvider }
    );

    const compatTab = screen.getByRole('tab', { name: /Совместимость с CV/i });
    fireEvent.click(compatTab);

    expect(screen.getByText('High level match for UI platform role.')).toBeInTheDocument();
  });
});
