import React from 'react';
import { cn } from '../../utils';
import styles from './Text.module.css';

export type BlockquoteTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger';

export interface BlockquoteProps extends React.BlockquoteHTMLAttributes<HTMLQuoteElement> {
  readonly tone?: BlockquoteTone;
  readonly author?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Editorial and drafting Blockquote (<blockquote>) component with Blueprint tone markers.
 */
export const Blockquote = React.forwardRef<HTMLQuoteElement, BlockquoteProps>(
  function Blockquote(
    {
      tone = 'primary',
      author,
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    return (
      <blockquote
        ref={ref}
        className={cn(
          styles.blockquote,
          styles[`blockquoteTone${capitalize(tone)}`],
          className
        )}
        {...restProps}
      >
        <div>{children}</div>
        {author !== undefined && (
          <cite className={styles.blockquoteCite}>— {author}</cite>
        )}
      </blockquote>
    );
  }
);

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
