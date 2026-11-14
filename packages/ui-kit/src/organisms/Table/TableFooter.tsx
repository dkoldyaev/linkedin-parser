import React from 'react';
import { cn } from '../../utils';
import styles from './Table.module.css';

export type TableFooterJustify = 'start' | 'center' | 'end' | 'between';

export interface TableFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly justify?: TableFooterJustify;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Bottom action or summary footer for flex Table.
 */
export function TableFooter({
  justify = 'between',
  children,
  className,
  ...restProps
}: TableFooterProps): React.ReactElement {
  return (
    <div
      role="contentinfo"
      className={cn(
        styles.footer,
        styles[`footerJustify${capitalize(justify)}`],
        className
      )}
      {...restProps}
    >
      {children}
    </div>
  );
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
