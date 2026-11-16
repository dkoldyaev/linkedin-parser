import { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MediaQuery, ContainerQuery } from '../index';

describe('Responsive utils (MediaQuery & ContainerQuery)', () => {
  describe('MediaQuery component', () => {
    it('renders slots for mobile and desktop concurrently for CSS media query switching', () => {
      render(
        <MediaQuery
          mobile={<span>Mobile View</span>}
          desktop={<span>Desktop View</span>}
        />
      );

      expect(screen.getByText('Mobile View')).toBeInTheDocument();
      expect(screen.getByText('Desktop View')).toBeInTheDocument();
    });
  });

  describe('ContainerQuery component', () => {
    function TestContainer() {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div ref={ref} data-testid="container-box">
          <ContainerQuery containerRef={ref} containerType="inline-size">
            <ContainerQuery.Slot max={400}>
              <span>Narrow Slot</span>
            </ContainerQuery.Slot>
            <ContainerQuery.Slot min={401}>
              <span>Wide Slot</span>
            </ContainerQuery.Slot>
          </ContainerQuery>
        </div>
      );
    }

    it('applies container-type inline-size to container element and renders slot contents', () => {
      render(<TestContainer />);
      const container = screen.getByTestId('container-box');
      expect(container.style.containerType).toBe('inline-size');
      expect(screen.getByText('Narrow Slot')).toBeInTheDocument();
      expect(screen.getByText('Wide Slot')).toBeInTheDocument();
    });
  });
});
