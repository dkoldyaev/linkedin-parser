import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button, Icon, Text } from '../../atoms';
import { cn } from '../../utils';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
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
 * Unifies the 9 duplicated modal implementations in legacy components with built-in focus trapping,
 * Escape-to-close, backdrop click handling, and ARIA title/description wiring.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  headerIcon,
  footer,
  size = 'md',
  closeLabel = 'Close modal',
  hideCloseButton = false,
  className,
  bodyClassName,
  children,
}: ModalProps): React.ReactElement {
  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay}>
          <DialogPrimitive.Content
            className={cn(styles.content, styles[`size-${size}`], className)}
          >
            <div className={styles.header}>
              <div className={styles.titleGroup}>
                <div className={styles.titleRow}>
                  {headerIcon !== undefined && (
                    <span aria-hidden="true">{headerIcon}</span>
                  )}
                  <DialogPrimitive.Title asChild>
                    <Text as="h2" variant="heading" tone="primary">
                      {title}
                    </Text>
                  </DialogPrimitive.Title>
                </div>
                {description !== undefined ? (
                  <DialogPrimitive.Description asChild>
                    <Text as="p" variant="caption" tone="secondary">
                      {description}
                    </Text>
                  </DialogPrimitive.Description>
                ) : (
                  <DialogPrimitive.Description className={styles.srOnly}>
                    Dialog content
                  </DialogPrimitive.Description>
                )}
              </div>

              {!hideCloseButton && (
                <DialogPrimitive.Close asChild>
                  <Button variant="ghost" size="icon" aria-label={closeLabel}>
                    <Icon icon={X} size="md" />
                  </Button>
                </DialogPrimitive.Close>
              )}
            </div>

            <div className={cn(styles.body, bodyClassName)}>{children}</div>

            {footer !== undefined && (
              <div className={styles.footer}>{footer}</div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
