import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heading } from '../Heading';
import { Paragraph } from '../Paragraph';
import { Text } from '../Text';

describe('Typography Atoms', () => {
  describe('Heading atom', () => {
    it('renders with correct semantic tag and tone class', () => {
      const { container } = render(
        <Heading level={2} tone="accent">
          Accent Heading
        </Heading>
      );
      const heading = screen.getByRole('heading', { level: 2, name: 'Accent Heading' });
      expect(heading).toBeTruthy();
      expect(heading.className).toContain('tone-accent');
      expect(heading.className).toContain('headingLevel2');
      expect(container.querySelector('h2')).toBe(heading);
    });

    it('renders different levels and tone variants', () => {
      const { rerender } = render(<Heading level={1} tone="danger">Critical Title</Heading>);
      let heading = screen.getByRole('heading', { level: 1, name: 'Critical Title' });
      expect(heading.className).toContain('tone-danger');
      expect(heading.className).toContain('headingLevel1');

      rerender(<Heading level={4} tone="success">Success Subtitle</Heading>);
      heading = screen.getByRole('heading', { level: 4, name: 'Success Subtitle' });
      expect(heading.className).toContain('tone-success');
      expect(heading.className).toContain('headingLevel4');
    });
  });

  describe('Paragraph atom', () => {
    it('renders with default tone and custom spacing', () => {
      render(<Paragraph spacing="lg">Main paragraph content</Paragraph>);
      const p = screen.getByText('Main paragraph content');
      expect(p.tagName).toBe('P');
      expect(p.className).toContain('tone-primary');
      expect(p.className).toContain('paragraphSpacingLg');
    });

    it('applies explicit tone variant', () => {
      render(<Paragraph tone="accent">Accent paragraph text</Paragraph>);
      const p = screen.getByText('Accent paragraph text');
      expect(p.className).toContain('tone-accent');
    });
  });

  describe('Text component', () => {
    it('renders span with variant and tone classes', () => {
      render(
        <Text variant="mono-label" tone="warning">
          Warning text
        </Text>
      );
      const span = screen.getByText('Warning text');
      expect(span.className).toContain('variant-mono-label');
      expect(span.className).toContain('tone-warning');
    });
  });
});
