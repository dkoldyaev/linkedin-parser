import React, { forwardRef, useMemo } from 'react';
import { SectionContext, type SectionContextValue } from './SectionContext';
import { SectionHeader, type SectionHeaderProps } from '../SectionHeader';
import { cn } from '../../utils';
import styles from './Section.module.css';

export type SectionPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg';

export interface SectionBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Internal padding preset for body content.
   * @default 'md'
   */
  readonly padding?: SectionPadding;
  /**
   * Horizontal padding override.
   */
  readonly paddingX?: SectionPadding;
  /**
   * Vertical padding override.
   */
  readonly paddingY?: SectionPadding;
  /**
   * Flex gap between body children.
   * @default 'none'
   */
  readonly gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  readonly children?: React.ReactNode;
  readonly className?: string;
}

/**
 * SectionBody provides standardized semantic content padding and layout spacing
 * beneath a SectionHeader on the Blueprint grid.
 */
export const SectionBody = forwardRef<HTMLDivElement, SectionBodyProps>(function SectionBody(
  { padding = 'md', paddingX, paddingY, gap = 'none', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        styles.body,
        styles[`padding-${padding}`],
        paddingX !== undefined && styles[`paddingX-${paddingX}`],
        paddingY !== undefined && styles[`paddingY-${paddingY}`],
        gap !== 'none' && styles[`gap-${gap}`],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * HTML tag for semantic structure.
   * @default 'section'
   */
  readonly as?: 'section' | 'div' | 'article';
  /**
   * Outer padding preset for the entire section container (if not using header/body).
   * @default undefined
   */
  readonly padding?: SectionPadding;
  /**
   * Bottom divider line token between sections.
   * @default true
   */
  readonly divider?: boolean;
  /**
   * Complete border contour around section.
   * @default false
   */
  readonly bordered?: boolean;
  readonly children?: React.ReactNode;
  readonly className?: string;
}

const SectionBase = forwardRef<HTMLElement, SectionProps>(function Section(
  { as: Comp = 'section', padding, divider = true, bordered = false, className, children, ...rest },
  ref,
) {
  const contextValue: SectionContextValue = useMemo(() => ({ isInsideSection: true }), []);

  return (
    <SectionContext.Provider value={contextValue}>
      <Comp
        ref={ref as React.Ref<any>}
        className={cn(
          styles.section,
          padding !== undefined && styles[`sectionPadding-${padding}`],
          divider && styles.divider,
          bordered && styles.bordered,
          className,
        )}
        {...rest}
      >
        {children}
      </Comp>
    </SectionContext.Provider>
  );
});

/**
 * Section molecule for semantic content segmentation on the Blueprint grid.
 * Contains SectionHeader and SectionBody subcomponents with clean consistent paddings.
 */
export const Section = Object.assign(SectionBase, {
  Header: SectionHeader,
  Body: SectionBody,
});

export type { SectionHeaderProps };
