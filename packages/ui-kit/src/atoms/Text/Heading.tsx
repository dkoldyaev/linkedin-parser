import React from 'react';
import { cn } from '../../utils';
import type { TextTone } from './Text';
import styles from './Text.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  readonly level?: HeadingLevel;
  readonly tone?: TextTone;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Semantic Heading (<h1>–<h6>) atom aligned with Blueprint drafting tokens.
 */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading(
    {
      level = 2,
      tone = 'primary',
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    const Tag: React.ElementType = `h${level}`;

    return (
      <Tag
        ref={ref}
        className={cn(
          styles.heading,
          styles[`headingLevel${level}`],
          styles[`tone-${tone}`],
          className
        )}
        {...restProps}
      >
        {children}
      </Tag>
    );
  }
);
