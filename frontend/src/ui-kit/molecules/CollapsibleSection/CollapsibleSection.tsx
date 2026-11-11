import React, { forwardRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils';
import styles from './CollapsibleSection.module.css';

export interface CollapsibleSectionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title: React.ReactNode;
  readonly icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  readonly badge?: React.ReactNode;
  readonly accessory?: React.ReactNode;
  readonly accessoryAction?: React.ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly expandLabel?: string;
  readonly collapseLabel?: string;
  readonly children: React.ReactNode;
}

/**
 * CollapsibleSection molecule.
 * Features a 32px Blueprint grid header with title, optional leading icon,
 * independent accessory actions, expand/collapse indicator, and smooth body container.
 */
export const CollapsibleSection = forwardRef<HTMLDivElement, CollapsibleSectionProps>(
  function CollapsibleSection(
    {
      title,
      icon: IconComponent,
      badge,
      accessory,
      accessoryAction,
      open,
      defaultOpen = false,
      onOpenChange,
      expandLabel = 'Показать полностью',
      collapseLabel = 'Свернуть',
      children,
      className,
      ...rest
    },
    ref
  ) {
    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = isControlled ? open : internalOpen;
    const accessorySlot = accessory ?? accessoryAction;

    const handleToggle = () => {
      const nextOpen = !isOpen;
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(styles.section, className)}
        {...rest}
      >
        <div
          className={cn(styles.header, isOpen && styles.headerExpanded)}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
        >
          <div className={styles.titleGroup}>
            {IconComponent && (
              <span className={styles.icon} aria-hidden>
                <IconComponent size={15} />
              </span>
            )}
            <h4 className={styles.title}>{title}</h4>
            {badge !== undefined && <span>{badge}</span>}
          </div>

          <div className={styles.actionsGroup}>
            {accessorySlot !== undefined && (
              <div
                className={styles.accessory}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {accessorySlot}
              </div>
            )}
            <div className={styles.toggleHint}>
              <span>{isOpen ? collapseLabel : expandLabel}</span>
              {isOpen ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
            </div>
          </div>
        </div>

        {isOpen && <div className={styles.body}>{children}</div>}
      </div>
    );
  }
);
