import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './SectionHeader.module.css';

export type SectionHeaderTone = 'default' | 'accent' | 'mint' | 'muted';
export type SectionHeaderVariant = 'mono' | 'sans';

export interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title: React.ReactNode;
  readonly icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  readonly iconTone?: SectionHeaderTone;
  readonly badge?: React.ReactNode;
  readonly accessory?: React.ReactNode;
  readonly variant?: SectionHeaderVariant;
  readonly as?: 'div' | 'header';
}

/**
 * SectionHeader molecule.
 * Provides a standardized Blueprint-grid header (height: 32px) with title,
 * optional leading icon, meta badge/counter, and action accessory slot.
 */
export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  function SectionHeader(
    {
      title,
      icon: IconComponent,
      iconTone = 'default',
      badge,
      accessory,
      variant = 'mono',
      as = 'div',
      className,
      ...rest
    },
    ref
  ) {
    const Component = as;

    return (
      <Component
        ref={ref}
        className={cn(styles.header, className)}
        {...rest}
      >
        <div className={styles.titleGroup}>
          {IconComponent && (
            <span
              className={cn(
                styles.icon,
                iconTone === 'mint' && styles.iconMint,
                iconTone === 'accent' && styles.iconAccent,
                iconTone === 'muted' && styles.iconMuted
              )}
              aria-hidden
            >
              <IconComponent size={15} />
            </span>
          )}
          <h4
            className={cn(
              styles.title,
              variant === 'sans' && styles.titleSans
            )}
          >
            {title}
          </h4>
          {badge !== undefined && <span className={styles.badge}>{badge}</span>}
        </div>

        {accessory !== undefined && (
          <div className={styles.accessory}>{accessory}</div>
        )}
      </Component>
    );
  }
);
