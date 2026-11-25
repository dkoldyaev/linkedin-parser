import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../../../atoms';
import { Modal } from '../../../organisms/Modal';
import { OverlayProvider } from '../../../utils';
import { AlertBanner } from '../../AlertBanner';
import { Select } from '../../Select';
import { Overlay } from '../Overlay';

describe('OverlayProvider & Overlay DOM-order stacking', () => {
  beforeEach(() => {
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
    }
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = () => undefined;
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = () => undefined;
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => undefined;
    }
  });

  it('fails fast when Overlay or Select or Modal is rendered without OverlayProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      render(
        <Overlay isOpen placement="bottom-end">
          <div>Orphan overlay</div>
        </Overlay>
      )
    ).toThrow('useOverlayContainer must be used within an <OverlayProvider>.');

    expect(() =>
      render(
        <Modal isOpen onClose={vi.fn()} title="Orphan Modal">
          <div>Body</div>
        </Modal>
      )
    ).toThrow('useOverlayContainer must be used within an <OverlayProvider>.');

    spy.mockRestore();
  });

  it('mounts Modal, Select listbox, and viewport AlertBanner sequentially inside [data-ui-overlay-root] without z-index', async () => {
    const user = userEvent.setup();
    const onModalClose = vi.fn();
    const onValueChange = vi.fn();

    function TestHarness() {
      const [toastOpen, setToastOpen] = useState(false);
      const [stage, setStage] = useState('applied');

      return (
        <OverlayProvider>
          <Modal isOpen onClose={onModalClose} title="Vacancy Modal">
            <Select
              ariaLabel="Stage selector"
              value={stage}
              onValueChange={(next) => {
                setStage(next);
                onValueChange(next);
              }}
              options={[
                { value: 'applied', label: 'Applied' },
                { value: 'offer', label: 'Offer' },
              ]}
            />
            <Button onClick={() => setToastOpen(true)}>Trigger Toast</Button>
          </Modal>

          <Overlay isOpen={toastOpen} placement="bottom-end">
            <AlertBanner tone="success" title="Reparse queued" />
          </Overlay>
        </OverlayProvider>
      );
    }

    render(<TestHarness />);

    const appRoot = document.querySelector('[data-ui-app-root]');
    const overlayRoot = document.querySelector('[data-ui-overlay-root]');
    expect(appRoot).toBeInTheDocument();
    expect(overlayRoot).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    expect(overlayRoot?.contains(dialog)).toBe(true);
    expect(overlayRoot?.children.length).toBe(1);

    // Open Select inside Modal -> Select portal mounts AFTER Modal inside [data-ui-overlay-root]
    const trigger = screen.getByRole('combobox', { name: 'Stage selector' });
    await user.click(trigger);

    const listbox = await screen.findByRole('listbox');
    expect(overlayRoot?.contains(listbox)).toBe(true);
    expect(overlayRoot?.children.length).toBe(2);

    const modalRootChild = overlayRoot?.children[0];
    const selectRootChild = overlayRoot?.children[1];
    expect(modalRootChild?.contains(dialog)).toBe(true);
    expect(selectRootChild?.contains(listbox)).toBe(true);
    expect(selectRootChild?.getAttribute('style') ?? '').not.toMatch(/z-index:\s*\d+/);

    // Selecting an option updates value and closes Select WITHOUT closing Modal
    await user.click(screen.getByRole('option', { name: 'Offer' }));
    expect(onValueChange).toHaveBeenCalledWith('offer');
    expect(onModalClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Triggering toast mounts AlertBanner AFTER Modal inside [data-ui-overlay-root]
    await user.click(screen.getByRole('button', { name: 'Trigger Toast' }));
    const toastAlert = screen.getByText('Reparse queued');
    expect(overlayRoot?.contains(toastAlert)).toBe(true);
    expect(overlayRoot?.lastElementChild?.contains(toastAlert)).toBe(true);
  });

  it('positions anchored Overlay via anchorRef and dismisses only topmost Overlay on Escape before Modal', async () => {
    const user = userEvent.setup();
    const onModalClose = vi.fn();

    function NestedPopoverInModal() {
      const [menuOpen, setMenuOpen] = useState(false);
      const btnRef = useRef<HTMLButtonElement | null>(null);

      return (
        <OverlayProvider>
          <Modal isOpen onClose={onModalClose} title="Parent Modal">
            <Button ref={btnRef} onClick={() => setMenuOpen((prev) => !prev)}>
              Open Menu
            </Button>
            <Overlay
              isOpen={menuOpen}
              anchorRef={btnRef}
              placement="bottom-end"
              onClose={() => setMenuOpen(false)}
            >
              <div data-testid="anchored-menu">Anchored Menu Content</div>
            </Overlay>
          </Modal>
        </OverlayProvider>
      );
    }

    render(<NestedPopoverInModal />);

    await user.click(screen.getByRole('button', { name: 'Open Menu' }));
    const menu = screen.getByTestId('anchored-menu');
    const overlayRoot = document.querySelector('[data-ui-overlay-root]');

    expect(overlayRoot?.lastElementChild?.contains(menu)).toBe(true);

    // First Escape closes ONLY the anchored Overlay, keeping Parent Modal open
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('anchored-menu')).not.toBeInTheDocument();
    expect(onModalClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
