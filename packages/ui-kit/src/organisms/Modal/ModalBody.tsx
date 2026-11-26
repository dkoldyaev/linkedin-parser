import { cn } from '../../utils';
import React from 'react';
import styles from './Modal.module.css';
import { useGridScroll } from '../../hooks';

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly padding?: 'none' | 'sm' | 'md' | 'lg';
  readonly gap?: 'none' | 'sm' | 'md' | 'lg';
  readonly scrollable?: boolean;
  readonly snapScroll?: boolean;
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
    gap = 'sm',
    scrollable = true,
    snapScroll = true,
    children,
    className,
    onScroll,
    ...restProps
  },
  ref,
): React.ReactElement {
  const handleGridScroll = useGridScroll();

  const handleScrollCombined = (event: React.UIEvent<HTMLDivElement>) => {
    if (scrollable && snapScroll) {
      handleGridScroll(event, 'y');
    }
    onScroll?.(event);
  };

  return (
    <div
      ref={ref}
      data-bp-scroller={scrollable ? 'true' : undefined}
      onScroll={handleScrollCombined}
      className={cn(
        styles.body,
        styles[`body-padding-${padding}`],
        gap && styles[`body-gap-${gap}`],
        !scrollable && styles.bodyNoScroll,
        className,
      )}
      {...restProps}
    >
      {children}
    </div>
  );
});
