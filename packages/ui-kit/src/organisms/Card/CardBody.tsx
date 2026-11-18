import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import { GRID_CELL_PX, cn } from '../../utils';
import styles from './Card.module.css';

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly snapToGrid?: boolean;
  readonly contentClassName?: string;
}

/**
 * CardBody wraps card content and quantizes its outer height to a multiple of GRID_CELL_PX (32px)
 * so CardFooter always starts on a 32px blueprint grid line.
 */
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  function CardBody(
    { snapToGrid = true, className, contentClassName, children, ...rest },
    forwardedRef
  ) {
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
      const bodyEl = bodyRef.current;
      const contentEl = contentRef.current;
      if (!snapToGrid || bodyEl === null || contentEl === null) {
        return undefined;
      }

      const syncGridHeight = (): void => {
        const rawHeight = contentEl.offsetHeight;
        if (rawHeight > 0) {
          const snappedHeight =
            Math.ceil(rawHeight / GRID_CELL_PX) * GRID_CELL_PX;
          bodyEl.style.setProperty('--bp-card-body-height', `${snappedHeight}px`);
        }
      };

      syncGridHeight();

      if (typeof ResizeObserver === 'undefined') {
        return undefined;
      }

      const observer = new ResizeObserver(syncGridHeight);
      observer.observe(contentEl);
      return () => observer.disconnect();
    }, [snapToGrid]);

    return (
      <div
        ref={(node) => {
          bodyRef.current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef !== null && forwardedRef !== undefined) {
            forwardedRef.current = node;
          }
        }}
        className={cn(styles.cardGridBody, className)}
        {...rest}
      >
        <div
          ref={contentRef}
          className={cn(styles.cardGridBodyContent, contentClassName)}
        >
          {children}
        </div>
      </div>
    );
  }
);

