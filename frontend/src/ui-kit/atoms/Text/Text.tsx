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
  /**
   * Forcibly snaps and aligns the text element to the 32px Blueprint drafting grid.
   * Quantizes its height to exact multiples of `var(--ui-grid-cell)` (32px) and centers
   * the text vertically within each grid cell.
   */
  readonly snapToGrid?: boolean;
  readonly gridAligned?: boolean;
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
    snapToGrid = false,
    gridAligned = false,
    className,
    children,
    ...rest
  },
  ref
) {
  const isGridSnapped = snapToGrid || gridAligned;
  const Component: React.ElementType = asChild ? Slot : as;
  const isInline = as === 'span' || as === 'code' || as === 'strong';

  return (
    <Component
      ref={ref}
      data-bp-snap={isGridSnapped ? '' : undefined}
      className={cn(
        styles.text,
        styles[`variant-${variant}`],
        styles[`tone-${tone}`],
        weight !== undefined && styles[`weight-${weight}`],
        truncate && styles.truncate,
        isGridSnapped &&
          (isInline ? styles.snapToGridInline : styles.snapToGrid),
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});
