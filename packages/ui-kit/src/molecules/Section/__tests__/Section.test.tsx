import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section, SectionBody } from '../Section';
import { SectionHeader } from '../../SectionHeader';

describe('Section molecule', () => {
  it('renders section container and semantic children', () => {
    render(
      <Section data-testid="test-section">
        <SectionHeader title="Секция данных" />
        <SectionBody data-testid="test-body">
          <p>Содержимое секции</p>
        </SectionBody>
      </Section>
    );

    const section = screen.getByTestId('test-section');
    expect(section.tagName.toLowerCase()).toBe('section');
    expect(screen.getByText('Секция данных')).toBeInTheDocument();
    expect(screen.getByText('Содержимое секции')).toBeInTheDocument();
  });

  it('supports compound subcomponents Section.Header and Section.Body', () => {
    render(
      <Section as="article" data-testid="compound-section" padding="sm">
        <Section.Header title="Составной заголовок" />
        <Section.Body padding="sm" paddingX="lg" paddingY="xs" data-testid="compound-body">
          <span>Текст</span>
        </Section.Body>
      </Section>
    );

    const article = screen.getByTestId('compound-section');
    expect(article.tagName.toLowerCase()).toBe('article');
    expect(screen.getByText('Составной заголовок')).toBeInTheDocument();
    const body = screen.getByTestId('compound-body');
    expect(body).toBeInTheDocument();
  });
});

