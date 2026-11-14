import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Icon } from '../../atoms';
import { EmptyState } from '../EmptyState';
import { StepperItem, type StepperItemData } from './StepperItem';
import { cn } from '../../utils';
import styles from './Stepper.module.css';

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly items: readonly StepperItemData[];
  readonly maxCollapsedItems?: number;
  readonly expandLabel?: (hiddenCount: number) => string;
  readonly collapseLabel?: string;
  readonly emptyTitle?: React.ReactNode;
  readonly emptyDescription?: React.ReactNode;
}

/**
 * Stepper molecule.
 * Universal vertical timeline stepper composing StepperItem, Button, Icon, and EmptyState.
 */
export function Stepper({
  items,
  maxCollapsedItems,
  expandLabel = (count) => `Show ${count} earlier steps`,
  collapseLabel = 'Collapse earlier steps',
  emptyTitle = 'No steps recorded',
  emptyDescription,
  className,
  ...rest
}: StepperProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  const canCollapse =
    maxCollapsedItems !== undefined &&
    maxCollapsedItems > 0 &&
    items.length > maxCollapsedItems;

  const hiddenCount = canCollapse ? items.length - maxCollapsedItems : 0;
  const visibleItems =
    canCollapse && !expanded ? items.slice(items.length - maxCollapsedItems) : items;

  return (
    <div className={cn(styles.stepper, className)} {...rest}>
      {canCollapse && (
        <div className={styles.collapseBar}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            endIcon={<Icon icon={expanded ? ChevronUp : ChevronDown} size="xs" />}
          >
            {expanded ? collapseLabel : expandLabel(hiddenCount)}
          </Button>
        </div>
      )}

      <ol className={styles.stepList}>
        {visibleItems.map((item, idx) => (
          <StepperItem
            key={item.id}
            {...item}
            isLast={idx === visibleItems.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}
