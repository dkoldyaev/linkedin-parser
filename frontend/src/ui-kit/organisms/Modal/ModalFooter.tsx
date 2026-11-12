import React from 'react';
import { cn } from '../../utils';
import styles from './Modal.module.css';

export type ModalFooterJustify = 'start' | 'center' | 'end' | 'between';

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly justify?: ModalFooterJustify;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Bottom action bar for modal dialogs and inspect cards.
 * Supports standard right-aligned action buttons or space-between layouts (e.g. Delete vs Close).
 */
export function ModalFooter({
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
