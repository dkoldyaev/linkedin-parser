import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../utils';
import { ModalContext, type ModalContextValue } from './ModalContext';
import { ModalHeader, ModalHeaderMeta, type ModalHeaderProps, type ModalHeaderMetaProps } from './ModalHeader';
import { ModalBody, type ModalBodyProps } from './ModalBody';
import { ModalFooter, ModalFooterActions, type ModalFooterProps, type ModalFooterActionsProps, type ModalFooterJustify } from './ModalFooter';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  /** Primary icon displayed alongside title in the header */
  readonly icon?: React.ReactNode;
  /** @deprecated Use `icon` instead */
  readonly headerIcon?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly size?: ModalSize;
  readonly closeLabel?: string;
  readonly hideCloseButton?: boolean;
  readonly className?: string;
  readonly bodyClassName?: string;
  readonly children: React.ReactNode;
}

/**
 * Accessible Modal organism powered by `@radix-ui/react-dialog`.
 * Decomposed into composable subcomponents (`ModalHeader`, `ModalBody`, `ModalFooter`)
 * with built-in focus trapping, Escape-to-close, backdrop click handling, and ARIA wiring.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  headerIcon,
  footer,
  size = 'md',
  closeLabel = 'Close modal',
  hideCloseButton = false,
  className,
  bodyClassName,
  children,
}: ModalProps): React.ReactElement {
  const contextValue: ModalContextValue = React.useMemo(
    () => ({
      isOpen,
      onClose,
      closeLabel,
    }),
    [isOpen, onClose, closeLabel]
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
  const effectiveIcon = icon ?? headerIcon;

  return (
    <ModalContext.Provider value={contextValue}>
      <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={styles.overlay}>
            <DialogPrimitive.Content
              className={cn(styles.content, styles[`size-${size}`], className)}
            >
              {isShorthandMode ? (
                <>
                  <ModalHeader
                    title={title}
                    description={description}
                    icon={effectiveIcon}
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
