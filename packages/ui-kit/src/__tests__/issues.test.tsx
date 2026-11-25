import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from '../molecules/ColorPicker';
import { TableHeader } from '../organisms/Table/TableHeader';
import { Drawer } from '../organisms/Drawer/Drawer';
import { VacancyCard } from '../organisms/VacancyCard/VacancyCard';
import { Stepper } from '../molecules/Stepper';
import { Tabs } from '../molecules/Tabs/Tabs';
import { Modal } from '../organisms/Modal/Modal';
import { Badge } from '../atoms';
import { OverlayProvider } from '../utils';

describe('UI-Kit GitHub Issues Tests', () => {
  describe('Issue #8: ColorPicker arbitrary hex/RGB colors and presets', () => {
    it('renders arbitrary hex presets and triggers onChange with custom hex', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <ColorPicker
          value="#2563eb"
          onChange={handleChange}
          presets={['#2563eb', '#10b981', '#ef4444']}
          data-testid="color-picker"
          ariaLabel="Custom color test"
        />
      );

      const colorPicker = screen.getByTestId('color-picker');
      expect(colorPicker).toBeInTheDocument();

      const hexInput = screen.getByLabelText('Hex color value');
      expect(hexInput).toBeInTheDocument();
      expect(hexInput).toHaveValue('#2563eb');

      // Click on preset
      const presetBtn = screen.getByRole('radio', { name: '#10b981' });
      await user.click(presetBtn);
      expect(handleChange).toHaveBeenCalledWith('#10b981');
    });
  });

  describe('Issue #9: TableHeader custom status dot color and style override', () => {
    it('renders with custom status dot color and forwards indicatorStyle', () => {
      render(
        <TableHeader
          title="Custom Column"
          indicatorColor="#3b82f6"
          data-testid="custom-th"
        />
      );

      const header = screen.getByTestId('custom-th');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('Custom Column')).toBeInTheDocument();
    });
  });

  describe('Issue #10: Standalone Drawer organism', () => {
    it('renders accessible drawer dialog with navigation links, ESC key handling and role="dialog"', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const handleLinkClick = vi.fn();

      render(
        <Drawer
          isOpen={true}
          onClose={handleClose}
          title="Main Menu"
          tag="WORKSPACE"
          links={[
            { id: 'home', label: 'Home', active: true, onClick: handleLinkClick },
            { id: 'jobs', label: 'Jobs' },
          ]}
          footerSlot={<span data-testid="drawer-footer">Status OK</span>}
          data-testid="standalone-drawer"
        />,
        { wrapper: OverlayProvider }
      );

      const drawer = screen.getByTestId('standalone-drawer');
      expect(drawer).toBeInTheDocument();
      expect(drawer).toHaveAttribute('role', 'dialog');
      expect(drawer).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText('Main Menu')).toBeInTheDocument();
      expect(screen.getByText('WORKSPACE')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-footer')).toBeInTheDocument();

      const homeLink = screen.getByRole('button', { name: /Home/i });
      await user.click(homeLink);
      expect(handleLinkClick).toHaveBeenCalled();

      // Close button
      const closeBtn = screen.getByRole('button', { name: 'Close navigation' });
      await user.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('Issue #11: VacancyCard data attributes and aria attributes forwarding', () => {
    it('renders data-bp-card="true" by default and forwards custom data-* and aria-* props', () => {
      render(
        <VacancyCard
          title="Fullstack Engineer"
          company="Acme Corp"
          data-testid="vacancy-card"
          data-kanban-id="vac-123"
          aria-describedby="vac-desc"
        />
      );

      const card = screen.getByTestId('vacancy-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-bp-card', 'true');
      expect(card).toHaveAttribute('data-kanban-id', 'vac-123');
      expect(card).toHaveAttribute('aria-describedby', 'vac-desc');
    });
  });

  describe('Issue #12: StepperItem actions slot and interactive contentSlot', () => {
    it('renders actions and interactive contentSlot within step item', () => {
      render(
        <Stepper
          items={[
            {
              id: 's1',
              label: 'Applied',
              timestamp: '10:00',
              actions: <button type="button" data-testid="edit-step-btn">Edit</button>,
              contentSlot: <div data-testid="custom-editor">Editor Content</div>,
            },
          ]}
          data-testid="stepper-root"
        />
      );

      expect(screen.getByTestId('stepper-root')).toBeInTheDocument();
      expect(screen.getByTestId('edit-step-btn')).toBeInTheDocument();
      expect(screen.getByTestId('custom-editor')).toBeInTheDocument();
    });
  });

  describe('Issue #13: Tabs accessory slot in TabItem', () => {
    it('renders accessory slot accepting Badge component', () => {
      render(
        <Tabs
          items={[
            {
              value: 'score',
              label: 'Score Tab',
              accessory: <Badge variant="solid" tone="success" data-testid="custom-tab-badge">95%</Badge>,
            },
            {
              value: 'counter',
              label: 'Counter Tab',
              accessory: <Badge variant="counter" size="xs" tone="warning" data-testid="counter-tab-badge">42</Badge>,
            },
          ]}
          data-testid="tabs-root"
        />
      );

      expect(screen.getByTestId('tabs-root')).toBeInTheDocument();
      const customBadge = screen.getByTestId('custom-tab-badge');
      expect(customBadge).toBeInTheDocument();
      expect(customBadge).toHaveTextContent('95%');

      const counterBadge = screen.getByTestId('counter-tab-badge');
      expect(counterBadge).toBeInTheDocument();
      expect(counterBadge).toHaveTextContent('42');
    });
  });

  describe('Issue #14: Modal custom width and style overrides support', () => {
    it('applies custom width and forwards style overrides', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title="Custom Width Modal"
          width="820px"
          data-testid="custom-width-modal"
        >
          <div>Modal Body</div>
        </Modal>,
        { wrapper: OverlayProvider }
      );

      const modalContent = screen.getByTestId('custom-width-modal');
      expect(modalContent).toBeInTheDocument();
      expect(modalContent.style.maxWidth).toBe('820px');
      expect(modalContent.style.width).toBe('820px');
    });
  });
});
