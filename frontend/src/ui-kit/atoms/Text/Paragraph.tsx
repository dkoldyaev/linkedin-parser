import React from 'react';
import { cn } from '../../utils';
import type { TextTone, TextWeight } from './Text';
import styles from './Text.module.css';

export interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  readonly spacing?: 'none' | 'sm' | 'md' | 'lg';
  readonly tone?: TextTone;
  readonly weight?: TextWeight;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Standard typography Paragraph (<p>) component aligned with Blueprint drafting tokens.
 */
export const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  function Paragraph(
    {
      spacing = 'md',
      tone = 'primary',
      weight,
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    return (
      <p
        ref={ref}
        className={cn(
          styles.paragraph,
          styles[`paragraphSpacing${capitalize(spacing)}`],
          styles[`tone-${tone}`],
          weight !== undefined && styles[`weight-${weight}`],
          className
        )}
        {...restProps}
      >
        {children}
      </p>
    );
  }
);

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
