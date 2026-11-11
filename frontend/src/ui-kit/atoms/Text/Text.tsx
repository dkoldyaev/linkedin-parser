import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../utils';
import styles from './Text.module.css';

export type TextElement =
  | 'span'
  | 'p'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'label'
  | 'code'
  | 'strong';

export type TextVariant =
  | 'body'
  | 'caption'
  | 'mono'
  | 'mono-label'
  | 'title'
  | 'heading'
  | 'display';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  readonly as?: TextElement;
  readonly asChild?: boolean;
  readonly variant?: TextVariant;
  readonly tone?: TextTone;
  readonly weight?: TextWeight;
  readonly truncate?: boolean;
}

/**
 * Polymorphic typography atom supporting Blueprint technical and sans-serif tokens.
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  {
    as = 'span',
    asChild = false,
    variant = 'body',
    tone = 'primary',
    weight,
    truncate = false,
    className,
    children,
    ...rest
  },
  ref
) {
  const Component: React.ElementType = asChild ? Slot : as;

  return (
    <Component
      ref={ref}
      className={cn(
        styles.text,
        styles[`variant-${variant}`],
        styles[`tone-${tone}`],
        weight !== undefined && styles[`weight-${weight}`],
        truncate && styles.truncate,
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});
