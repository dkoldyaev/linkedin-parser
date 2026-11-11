import React, { forwardRef, useState } from 'react';
import { SectionHeader } from '../SectionHeader';
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
 * Composes SectionHeader on the 32px Blueprint grid with an expandable body container.
 */
export const CollapsibleSection = forwardRef<HTMLDivElement, CollapsibleSectionProps>(
  function CollapsibleSection(
    {
      title,
      icon,
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

    return (
      <div
        ref={ref}
        className={cn(styles.section, className)}
        {...rest}
      >
        <SectionHeader
          title={title}
          icon={icon}
          badge={badge}
          accessory={accessorySlot}
          collapsible
          open={isOpen}
          onToggle={handleToggle}
          expandLabel={expandLabel}
          collapseLabel={collapseLabel}
          className={styles.header}
        />

        {isOpen && (
          <div
            className={styles.content}
            role="region"
            aria-label={typeof title === 'string' ? title : undefined}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);
