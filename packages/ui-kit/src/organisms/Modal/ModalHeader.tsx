import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button, Icon, Text } from '../../atoms';
import { cn } from '../../utils';
import { useModalContext } from './ModalContext';
import styles from './Modal.module.css';

export interface ModalHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  /** Primary icon displayed alongside title in the header */
  readonly icon?: React.ReactNode;
  /** @deprecated Use `icon` instead */
  readonly headerIcon?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly meta?: React.ReactNode;
  readonly tabs?: React.ReactNode;
  readonly hideCloseButton?: boolean;
  readonly closeLabel?: string;
  readonly onClose?: () => void;
  readonly children?: React.ReactNode;
  readonly className?: string;
}

export interface ModalHeaderMetaProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Metadata row subcomponent inside ModalHeader for badges and indicators.
 */
export function ModalHeaderMeta({
  children,
  className,
  ...restProps
}: ModalHeaderMetaProps): React.ReactElement {
  return (
    <div className={cn(styles.headerMeta, className)} {...restProps}>
      {children}
    </div>
  );
}

/**
 * Accessible header organism for modal dialogs and inspect panels.
 * Decomposes the dialog header into standard title/description/action zones,
 * metadata badges, and tabs while preserving Radix UI ARIA wiring.
 */
function ModalHeaderRoot({
  title,
  description,
  icon,
  headerIcon,
  actions,
  meta,
  tabs,
  hideCloseButton = false,
  closeLabel,
  onClose,
  children,
  className,
  ...restProps
}: ModalHeaderProps): React.ReactElement {
  const modalContext = useModalContext();
  const effectiveOnClose = onClose ?? modalContext?.onClose;
  const effectiveCloseLabel = closeLabel ?? modalContext?.closeLabel ?? 'Close modal';
  const isInsideDialog = modalContext !== null;
  const hasTabs = tabs !== undefined;
  const effectiveIcon = icon ?? headerIcon;

  const showTopRow =
    title !== undefined ||
    actions !== undefined ||
    (!hideCloseButton && effectiveOnClose !== undefined);

  return (
    <div
      className={cn(styles.header, hasTabs && styles.headerWithTabs, className)}
      {...restProps}
    >
      {showTopRow && (
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            {title !== undefined && (
              <div className={styles.titleRow}>
                {effectiveIcon !== undefined && (
                  <span aria-hidden="true" className={styles.headerIconWrapper}>
                    {effectiveIcon}
                  </span>
                )}
                {isInsideDialog ? (
                  <DialogPrimitive.Title asChild>
                    <Text as="h2" variant="heading" tone="primary">
                      {title}
                    </Text>
                  </DialogPrimitive.Title>
                ) : (
                  <Text as="h2" variant="heading" tone="primary">
                    {title}
                  </Text>
                )}
              </div>
            )}
            {description !== undefined ? (
              isInsideDialog ? (
                <DialogPrimitive.Description asChild>
                  <Text as="p" variant="caption" tone="secondary">
                    {description}
                  </Text>
                </DialogPrimitive.Description>
              ) : (
                <Text as="p" variant="caption" tone="secondary">
                  {description}
                </Text>
              )
            ) : isInsideDialog && title !== undefined ? (
              <DialogPrimitive.Description className={styles.srOnly}>
                Dialog content
              </DialogPrimitive.Description>
            ) : null}
          </div>

          <div className={styles.headerActions}>
            {actions}
            {!hideCloseButton && effectiveOnClose !== undefined && (
              isInsideDialog ? (
                <DialogPrimitive.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={effectiveCloseLabel}
                    onClick={effectiveOnClose}
                  >
                    <Icon icon={X} size="md" />
                  </Button>
                </DialogPrimitive.Close>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={effectiveCloseLabel}
                  onClick={effectiveOnClose}
                >
                  <Icon icon={X} size="md" />
                </Button>
              )
            )}
          </div>
        </div>
      )}
      {meta !== undefined && <div className={styles.headerMeta}>{meta}</div>}
      {tabs !== undefined && <div className={styles.headerTabs}>{tabs}</div>}
      {children}
    </div>
  );
}

export const ModalHeader = Object.assign(ModalHeaderRoot, {
  Meta: ModalHeaderMeta,
});
