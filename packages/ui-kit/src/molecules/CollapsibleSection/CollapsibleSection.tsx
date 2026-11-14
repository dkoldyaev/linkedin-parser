import React, { forwardRef } from 'react';
import { SectionHeader } from '../SectionHeader';
import { useControllableState } from '../../hooks';
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
 * Composes SectionHeader on the 32px Blueprint grid with an expandable body container
 * managed via useControllableState.
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
      expandLabel = 'Expand',
      collapseLabel = 'Collapse',
      children,
      className,
      ...rest
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useControllableState<boolean>({
      value: open,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const accessorySlot = accessory ?? accessoryAction;

    const handleToggle = () => {
      setIsOpen(!isOpen);
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
