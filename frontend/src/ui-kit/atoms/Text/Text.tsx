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

export type TextLineHeight = 'grid' | 0.5 | 'auto';

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
  /**
   * Line height setting:
   * - `'grid'`: 1 grid cell (`var(--ui-grid-cell)` = 32px)
   * - `0.5`: half grid cell (`calc(var(--ui-grid-cell) * 0.5)` = 16px)
   * - `'auto'`: natural line-height of the variant (default)
   */
  readonly lineHeight?: TextLineHeight;
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
    lineHeight = 'auto',
    className,
    children,
    ...rest
  },
  ref
) {
  const Component: React.ElementType = asChild ? Slot : as;
  const isInline = as === 'span' || as === 'code' || as === 'strong';
  const lineHeightClass =
    lineHeight === 'grid'
      ? styles['lineHeight-grid']
      : lineHeight === 0.5
        ? styles['lineHeight-half']
        : undefined;

  return (
    <Component
      ref={ref}
      data-bp-snap={snapToGrid ? '' : undefined}
      className={cn(
        styles.text,
        styles[`variant-${variant}`],
        styles[`tone-${tone}`],
        weight !== undefined && styles[`weight-${weight}`],
        lineHeightClass,
        truncate && styles.truncate,
        snapToGrid &&
          (isInline ? styles.snapToGridInline : styles.snapToGrid),
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});
