import React, { forwardRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  readonly collapsible?: boolean;
  readonly open?: boolean;
  readonly onToggle?: () => void;
  readonly expandLabel?: string;
  readonly collapseLabel?: string;
}

/**
 * SectionHeader molecule.
 * Provides a standardized Blueprint-grid header (height: 32px) with title,
 * optional leading icon, meta badge/counter, action accessory slot, and optional collapsible toggle.
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
      collapsible = false,
      open = false,
      onToggle,
      expandLabel = 'Показать полностью',
      collapseLabel = 'Свернуть',
      className,
      ...rest
    },
    ref
  ) {
    const Component = as;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (collapsible && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onToggle?.();
      }
    };

    return (
      <Component
        ref={ref}
        className={cn(
          styles.header,
          collapsible && styles.headerCollapsible,
          collapsible && open && styles.headerExpanded,
          className
        )}
        onClick={collapsible ? onToggle : undefined}
        onKeyDown={collapsible ? handleKeyDown : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? open : undefined}
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

        <div className={styles.actionsGroup}>
          {accessory !== undefined && (
            <div
              className={styles.accessory}
              onClick={collapsible ? (e) => e.stopPropagation() : undefined}
              onKeyDown={collapsible ? (e) => e.stopPropagation() : undefined}
            >
              {accessory}
            </div>
          )}

          {collapsible && (
            <div className={styles.toggleHint}>
              <span>{open ? collapseLabel : expandLabel}</span>
              {open ? (
                <ChevronUp size={14} className={styles.chevron} aria-hidden />
              ) : (
                <ChevronDown size={14} className={styles.chevron} aria-hidden />
              )}
            </div>
          )}
        </div>
      </Component>
    );
  }
);
