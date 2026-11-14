import React from 'react';
import { cn } from '../../utils';
import styles from './Modal.module.css';

export type ModalFooterJustify = 'start' | 'center' | 'end' | 'between';

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly justify?: ModalFooterJustify;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export interface ModalFooterActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Group wrapper for action buttons inside ModalFooter.
 */
export function ModalFooterActions({
  children,
  className,
  ...restProps
}: ModalFooterActionsProps): React.ReactElement {
  return (
    <div className={cn(styles.footerActions, className)} {...restProps}>
      {children}
    </div>
  );
}

/**
 * Bottom action bar for modal dialogs and inspect cards.
 * Supports standard right-aligned action buttons or space-between layouts (e.g. Delete vs Close).
 */
function ModalFooterRoot({
  justify = 'end',
  children,
  className,
  ...restProps
}: ModalFooterProps): React.ReactElement {
  return (
    <div
      className={cn(styles.footer, styles[`footer-justify-${justify}`], className)}
      {...restProps}
    >
      {children}
    </div>
  );
}

export const ModalFooter = Object.assign(ModalFooterRoot, {
  Actions: ModalFooterActions,
});
