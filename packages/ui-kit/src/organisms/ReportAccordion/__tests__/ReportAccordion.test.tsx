import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReportAccordion } from '../ReportAccordion';

describe('ReportAccordion organism', () => {
  it('renders report header, score badge, summary, and expandable sections', () => {
    const onAction = vi.fn();
    render(
      <ReportAccordion
        title="Compatibility Report"
        scoreLabel="92%"
        summary="Overall strong fit."
        onAction={onAction}
        actionLabel="Recalculate"
        sections={[
          {
            id: 'matches',
            title: 'MATCHES',
            tone: 'mint',
            items: [
              {
                id: '1',
                title: 'TypeScript Architecture',
                content: 'Detailed proof from CV.',
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('Compatibility Report')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('Overall strong fit.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Recalculate/i }));
    expect(onAction).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /TypeScript Architecture/i }));
    expect(screen.getByText('Detailed proof from CV.')).toBeInTheDocument();
  });
});
