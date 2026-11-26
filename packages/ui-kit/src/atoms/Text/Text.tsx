import { Blockquote, type BlockquoteProps, type BlockquoteTone } from './Blockquote';
import { Code, type CodeProps, Kbd, type KbdProps } from './Code';
import type { FontSizeToken, PaletteTone } from '../../tokens';
import { Heading, type HeadingLevel, type HeadingProps } from './Heading';
import { Link, type LinkProps } from './Link';
import {
  List,
  ListItem,
  type ListItemProps,
  type ListProps,
  type ListSpacing,
  OrderedList,
  type OrderedListProps,
  UnorderedList,
  type UnorderedListProps,
} from './List';
import { Paragraph, type ParagraphProps } from './Paragraph';
import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import { Slot } from '@radix-ui/react-slot';
import styles from './Text.module.css';

export type TextElement =
  'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'label' | 'code' | 'strong' | 'time';

export type TextVariant =
  'body' | 'body-sm' | 'caption' | 'mono' | 'mono-label' | 'title' | 'heading' | 'display';

export type TextTone =
  'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type TextLineHeight = 'grid' | 0.5 | 'auto';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  readonly as?: TextElement;
  readonly asChild?: boolean;
  readonly variant?: TextVariant;
  readonly size?: FontSizeToken;
  readonly tone?: TextTone;
  readonly palette?: PaletteTone;
  readonly weight?: TextWeight;
  readonly truncate?: boolean;
  readonly startIcon?: React.ReactNode;
  readonly endIcon?: React.ReactNode;
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
 * Polymorphic typography atom supporting Blueprint technical and sans-serif tokens,
 * optional `startIcon`/`endIcon` slots, and semantic/palette color tones.
 */
const TextBase = forwardRef<HTMLElement, TextProps>(function Text(
  {
    as = 'span',
    asChild = false,
    variant = 'body',
    size,
    tone = 'primary',
    palette,
    weight,
    truncate = false,
    startIcon,
    endIcon,
    snapToGrid = false,
    lineHeight = 'auto',
    className,
    children,
    ...rest
  },
  ref,
) {
  const Component: React.ElementType = asChild ? Slot : as;
  const isInline = as === 'span' || as === 'code' || as === 'strong';
  const hasIcons = startIcon !== undefined || endIcon !== undefined;
  const lineHeightClass =
    lineHeight === 'grid'
      ? styles['lineHeight-grid']
      : lineHeight === 0.5
        ? styles['lineHeight-half']
        : undefined;

  const colorClass = palette !== undefined ? styles[`palette-${palette}`] : styles[`tone-${tone}`];

  return (
    <Component
      ref={ref}
      data-bp-snap={snapToGrid ? '' : undefined}
      className={cn(
        styles.text,
        styles[`variant-${variant}`],
        size !== undefined && styles[`size-${size}`],
        colorClass,
        weight !== undefined && styles[`weight-${weight}`],
        lineHeightClass,
        hasIcons && styles.withIcons,
        truncate && !hasIcons && styles.truncate,
        snapToGrid && (isInline ? styles.snapToGridInline : styles.snapToGrid),
        className,
      )}
      {...rest}
    >
      {startIcon !== undefined && (
        <span className={styles.iconSlot} aria-hidden="true">
          {startIcon}
        </span>
      )}
      {hasIcons && truncate ? <span className={styles.truncate}>{children}</span> : children}
      {endIcon !== undefined && (
        <span className={styles.iconSlot} aria-hidden="true">
          {endIcon}
        </span>
      )}
    </Component>
  );
});

export const Text = Object.assign(TextBase, {
  Paragraph,
  List,
  OrderedList,
  UnorderedList,
  ListItem,
  Blockquote,
  Heading,
  Code,
  Kbd,
  Link,
});

export {
  Paragraph,
  List,
  OrderedList,
  UnorderedList,
  ListItem,
  Blockquote,
  Heading,
  Code,
  Kbd,
  Link,
  type ParagraphProps,
  type ListProps,
  type OrderedListProps,
  type UnorderedListProps,
  type ListItemProps,
  type ListSpacing,
  type BlockquoteProps,
  type BlockquoteTone,
  type HeadingProps,
  type HeadingLevel,
  type CodeProps,
  type KbdProps,
  type LinkProps,
};
