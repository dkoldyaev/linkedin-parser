import React, { forwardRef } from 'react';
import { useBlueprintGrid, useControllableState } from '../../hooks';
import { cn } from '../../utils';
import { SectionHeader } from '../SectionHeader';
import styles from './CollapsibleSection.module.css';

export interface CollapsibleSectionProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  readonly title: React.ReactNode;
  readonly icon?: React.ReactNode;
  readonly badge?: React.ReactNode;
  readonly accessory?: React.ReactNode;
  readonly accessoryAction?: React.ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly expandLabel?: string | null;
  readonly collapseLabel?: string | null;
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
      expandLabel = null,
      collapseLabel = null,
      children,
      className,
      ...rest
    },
    ref,
  ) {
    const [isOpen, setIsOpen] = useControllableState<boolean>({
      value: open,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const gridRef = useBlueprintGrid<HTMLDivElement>([isOpen, children]);
    const accessorySlot = accessory ?? accessoryAction;

    const setMergedRef = (node: HTMLDivElement | null) => {
      gridRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const handleToggle = () => {
      setIsOpen(!isOpen);
    };

    return (
      <div ref={setMergedRef} className={cn(styles.section, className)} {...rest}>
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
            data-ui-snap
            className={styles.content}
            role="region"
            aria-label={typeof title === 'string' ? title : undefined}
          >
            {children}
          </div>
        )}
      </div>
    );
  },
);
