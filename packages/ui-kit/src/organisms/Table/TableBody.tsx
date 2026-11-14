import React from 'react';
import { useGridScroll } from '../../hooks';
import { cn } from '../../utils';
import styles from './Table.module.css';

export interface TableBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly scrollable?: boolean;
  readonly snapScroll?: boolean;
  readonly gap?: 'none' | 'sm' | 'md';
  readonly padding?: 'none' | 'sm' | 'md';
  readonly emptyState?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly onScroll?: React.UIEventHandler<HTMLDivElement>;
}

/**
 * Scrollable vertical body for flex Table columns or table body containers.
 * Integrates `useGridScroll` for 32px blueprint grid snap-scrolling.
 */
export const TableBody = React.forwardRef<HTMLDivElement, TableBodyProps>(
  function TableBody(
    {
      scrollable = true,
      snapScroll = true,
      gap = 'none',
      padding = 'none',
      emptyState,
      children,
      className,
      onScroll,
      ...restProps
    },
    ref
  ): React.ReactElement {
    const handleGridScroll = useGridScroll();

    const handleScrollCombined = (event: React.UIEvent<HTMLDivElement>) => {
      if (snapScroll) {
        handleGridScroll(event, 'y');
      }
      onScroll?.(event);
    };

    const hasChildren = React.Children.count(children) > 0;

    return (
      <div
        ref={ref}
        onScroll={handleScrollCombined}
        className={cn(
          styles.body,
          scrollable ? styles.bodyScrollable : styles.bodyNoScroll,
          styles[`bodyGap${capitalize(gap)}`],
          styles[`bodyPadding${capitalize(padding)}`],
          className
        )}
        {...restProps}
      >
        {hasChildren ? children : emptyState}
      </div>
    );
  }
);

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
