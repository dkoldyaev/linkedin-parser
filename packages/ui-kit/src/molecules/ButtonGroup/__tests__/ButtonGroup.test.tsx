import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../../../atoms/Button';
import { ButtonGroup } from '../ButtonGroup';

describe('ButtonGroup molecule', () => {
  it('renders children with group role', () => {
    render(
      <ButtonGroup>
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole('group');
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument();
  });

  it('supports custom role and class', () => {
    render(
      <ButtonGroup role="toolbar" className="custom-toolbar">
        <Button>Action</Button>
      </ButtonGroup>,
    );

    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveClass('custom-toolbar');
  });
});
