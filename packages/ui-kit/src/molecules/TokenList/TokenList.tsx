import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './TokenList.module.css';

export interface TokenListProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * TokenList molecule.
 * Pure container for rendering a list of Badges, tags, or chips with consistent Blueprint gap spacing.
 */
export const TokenList = forwardRef<HTMLDivElement, TokenListProps>(
  function TokenList({ children, className, ...rest }, ref) {
    return (
      <div ref={ref} className={cn(styles.tokenList, className)} {...rest}>
        {children}
      </div>
    );
  }
);
