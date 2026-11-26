import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'rect' | 'circle' | 'chip';
export type SkeletonWidth = '25' | '50' | '60' | '75' | '85' | '100' | 'full';
export type SkeletonHeight = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly variant?: SkeletonVariant;
  readonly width?: SkeletonWidth;
  readonly height?: SkeletonHeight;
  readonly animated?: boolean;
}

const WIDTH_CLASSES: Record<SkeletonWidth, string | undefined> = {
  '25': styles.w25,
  '50': styles.w50,
  '60': styles.w60,
  '75': styles.w75,
  '85': styles.w85,
  '100': styles.w100,
  full: styles.w100,
};

const HEIGHT_CLASSES: Record<SkeletonHeight, string | undefined> = {
  xs: styles.hXs,
  sm: styles.hSm,
  md: styles.hMd,
  lg: styles.hLg,
  xl: styles.hXl,
};

/**
 * Atomic Skeleton component for content loading placeholders on the Blueprint grid.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = 'text', width, height, animated = true, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        styles.skeleton,
        styles[variant],
        width && WIDTH_CLASSES[width],
        height && HEIGHT_CLASSES[height],
        animated && styles.animated,
        className,
      )}
      {...rest}
    />
  );
});
