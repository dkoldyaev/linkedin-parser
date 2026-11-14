import React from 'react';
import { cn } from '../../utils';
import styles from './Modal.module.css';

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly padding?: 'none' | 'sm' | 'md' | 'lg';
  readonly scrollable?: boolean;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly onScroll?: React.UIEventHandler<HTMLDivElement>;
}

/**
 * Scrollable content container for modal dialogs and inspect cards.
 * Snaps to the 32px blueprint grid with configurable padding variants.
 */
export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(function ModalBody(
  {
    padding = 'md',
    scrollable = true,
    children,
    className,
    onScroll,
    ...restProps
  },
  ref
): React.ReactElement {
  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className={cn(
        styles.body,
        styles[`body-padding-${padding}`],
        !scrollable && styles.bodyNoScroll,
        className
      )}
      {...restProps}
    >
      {children}
    </div>
  );
});
