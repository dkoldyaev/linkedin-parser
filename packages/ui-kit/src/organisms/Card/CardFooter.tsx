import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Card.module.css';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slot for metadata, timestamps, indicators or counts displayed on the left */
  readonly metaSlot?: React.ReactNode;
  /** Slot for action buttons or ButtonGroup displayed on the right */
  readonly actionsSlot?: React.ReactNode;
  readonly children?: React.ReactNode;
}

/**
 * CardFooter is a 32px-tall blueprint grid row with left metadata slot and right quick-actions slot.
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter(
    {
      metaSlot,
      actionsSlot,
      className,
      children,
      ...rest
    },
    ref
  ) {
    return (
      <div ref={ref} className={cn(styles.cardFooter, className)} {...rest}>
        <div className={styles.cardFooterMeta}>
          {metaSlot}
          {children}
        </div>

        {actionsSlot !== undefined && (
          <div
            className={styles.cardQuickActions}
            onClick={(e) => e.stopPropagation()}
          >
            {actionsSlot}
          </div>
        )}
      </div>
    );
  }
);

