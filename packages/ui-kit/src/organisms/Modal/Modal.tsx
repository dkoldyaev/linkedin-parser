import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../utils';
import { ModalContext, type ModalContextValue } from './ModalContext';
import { ModalHeader, ModalHeaderMeta, type ModalHeaderProps, type ModalHeaderMetaProps } from './ModalHeader';
import { ModalBody, type ModalBodyProps } from './ModalBody';
import { ModalFooter, ModalFooterActions, type ModalFooterProps, type ModalFooterActionsProps, type ModalFooterJustify } from './ModalFooter';
import styles from './Modal.module.css';

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
  const contextValue: ModalContextValue = React.useMemo(
    () => ({
      isOpen,
      onClose,
      closeLabel,
    }),
    [isOpen, onClose, closeLabel]
  );

  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const setContentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
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
    [width, style]
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose]
  );

  const isShorthandMode = title !== undefined;

  return (
    <ModalContext.Provider value={contextValue}>
      <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={styles.overlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.stopPropagation();
                onClose();
              }
            }}
          >
            <DialogPrimitive.Content
              ref={setContentRef}
              className={cn(
                styles.content,
                size !== 'custom' && styles[`size-${size}`],
                className
              )}
              onPointerDownOutside={(e) => {
                e.preventDefault();
              }}
              onInteractOutside={(e) => {
                e.preventDefault();
              }}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
              }}
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
