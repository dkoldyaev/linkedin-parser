import React, { forwardRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Icon, Text } from '../../atoms';
import { cn } from '../../utils';
import { useSectionContext } from '../Section/SectionContext';
import styles from './SectionHeader.module.css';

export type SectionHeaderTone =
  | 'default'
  | 'accent'
  | 'mint'
  | 'warning'
  | 'danger'
  | 'muted';

export type SectionHeaderVariant = 'mono' | 'sans';

export interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title: React.ReactNode;
  readonly tone?: SectionHeaderTone;
  /** Primary icon slot displayed before the title */
  readonly icon?: React.ReactNode;
  readonly badge?: React.ReactNode;
  readonly accessory?: React.ReactNode;
  readonly variant?: SectionHeaderVariant;
  readonly as?: 'div' | 'header';
  readonly collapsible?: boolean;
  readonly open?: boolean;
  readonly onToggle?: () => void;
  readonly expandLabel?: string;
  readonly collapseLabel?: string;
  readonly divider?: boolean;
}

/**
 * SectionHeader molecule.
 * Standardized Blueprint-grid header (height: 32px) composing Icon slot, Text,
 * optional meta badge/counter, action accessory slot, semantic tone coloring,
 * bottom divider line, and optional collapsible toggle.
 */
export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  function SectionHeader(
    {
      title,
      tone = 'default',
      icon,
      badge,
      accessory,
      variant = 'mono',
      as = 'div',
      collapsible = false,
      open = false,
      onToggle,
      expandLabel = 'Expand',
      collapseLabel = 'Collapse',
      divider = false,
      className,
      ...rest
    },
    ref
  ) {
    const Component = as;
    const sectionContext = useSectionContext();
    const isInsideSection = sectionContext?.isInsideSection ?? false;

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
          isInsideSection && styles.headerInsideSection,
          tone === 'mint' && styles.toneMint,
          tone === 'warning' && styles.toneWarning,
          tone === 'danger' && styles.toneDanger,
          tone === 'accent' && styles.toneAccent,
          tone === 'muted' && styles.toneMuted,
          divider && styles.headerDivider,
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
          {icon !== undefined && (
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
          )}
          <Text
            as="h4"
            variant={variant === 'sans' ? 'body-sm' : 'mono-label'}
            weight="semibold"
            truncate
            className={cn(styles.title, variant === 'sans' && styles.titleSans)}
          >
            {title}
          </Text>
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
              <Text as="span" variant="mono" tone="muted" className={styles.toggleLabel}>
                {open ? collapseLabel : expandLabel}
              </Text>
              <Icon
                icon={open ? ChevronUp : ChevronDown}
                size="sm"
                className={styles.chevron}
              />
            </div>
          )}
        </div>
      </Component>
    );
  }
);
