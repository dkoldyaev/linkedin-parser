import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn, useOverlayContainer } from '../../utils';
import { ModalBody, type ModalBodyProps } from './ModalBody';
import { ModalContext, type ModalContextValue } from './ModalContext';
import {
  ModalFooter,
  ModalFooterActions,
  type ModalFooterActionsProps,
  type ModalFooterJustify,
  type ModalFooterProps,
} from './ModalFooter';
import {
  ModalHeader,
  ModalHeaderMeta,
  type ModalHeaderMetaProps,
  type ModalHeaderProps,
} from './ModalHeader';
import React from 'react';
import styles from './Modal.module.css';
import { useBlueprintGrid } from '../../hooks';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';

export interface ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  /** Primary icon displayed alongside title in the header */
  readonly icon?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly size?: ModalSize;
  /** Custom width override in pixels or CSS units (e.g. 640, '640px', 'min(90vw, 800px)') */
  readonly width?: string | number;
  readonly style?: React.CSSProperties;
  readonly closeLabel?: string;
  readonly hideCloseButton?: boolean;
  readonly className?: string;
  readonly bodyClassName?: string;
  readonly children: React.ReactNode;
}

/**
 * Accessible Modal organism powered by `@radix-ui/react-dialog`.
 * Decomposed into composable subcomponents (`ModalHeader`, `ModalBody`, `ModalFooter`)
 * with built-in focus trapping, Escape-to-close, backdrop click handling, ARIA wiring,
 * and support for custom width and style overrides.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  footer,
  size = 'md',
  width,
  style,
  closeLabel = 'Close modal',
  hideCloseButton = false,
  className,
  bodyClassName,
  children,
  ...rest
}: ModalProps): React.ReactElement {
  const overlayContainer = useOverlayContainer();
  const contextValue: ModalContextValue = React.useMemo(
    () => ({
      isOpen,
      onClose,
      closeLabel,
    }),
    [isOpen, onClose, closeLabel],
  );

  const gridRef = useBlueprintGrid<HTMLDivElement>({
    deps: [isOpen, size, width, children],
    observeSubtree: true,
  });
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const setContentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      gridRef.current = node;
      if (!node) return;
      if (width !== undefined) {
        const formattedWidth = typeof width === 'number' ? `${width}px` : width;
        node.style.setProperty('max-width', formattedWidth);
        node.style.setProperty('width', formattedWidth);
      }
      if (style) {
        Object.assign(node.style, style);
      }
    },
    [width, style, gridRef],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose],
  );

  const isShorthandMode = title !== undefined;

  return (
    <ModalContext.Provider value={contextValue}>
      <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <DialogPrimitive.Portal container={overlayContainer}>
          <DialogPrimitive.Overlay className={styles.overlay}>
            <div className={styles.gridViewport}>
              <DialogPrimitive.Content
                ref={setContentRef}
                data-bp-snap=""
                data-bp-snap-height=""
                data-bp-snap-width=""
                data-grid-top=""
                data-grid-left=""
                className={cn(
                  styles.content,
                  'bp-snap',
                  'bp-snap-width',
                  size !== 'custom' && styles[`size-${size}`],
                  className,
                )}
                {...rest}
              >
                {isShorthandMode ? (
                  <>
                    <ModalHeader
                      title={title}
                      description={description}
                      icon={icon}
                      hideCloseButton={hideCloseButton}
                      closeLabel={closeLabel}
                      onClose={onClose}
                    />
                    <ModalBody className={bodyClassName}>{children}</ModalBody>
                    {footer !== undefined && <ModalFooter>{footer}</ModalFooter>}
                  </>
                ) : (
                  <>
                    <DialogPrimitive.Description className={styles.srOnly}>
                      Dialog content
                    </DialogPrimitive.Description>
                    {children}
                  </>
                )}
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Overlay>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </ModalContext.Provider>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export {
  ModalHeader,
  ModalHeaderMeta,
  ModalBody,
  ModalFooter,
  ModalFooterActions,
  type ModalHeaderProps,
  type ModalHeaderMetaProps,
  type ModalBodyProps,
  type ModalFooterProps,
  type ModalFooterActionsProps,
  type ModalFooterJustify,
};
