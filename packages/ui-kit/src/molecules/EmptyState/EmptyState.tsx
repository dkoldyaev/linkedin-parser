import React from 'react';
import { Text } from '../../atoms';
import { useBlueprintGrid } from '../../hooks';
import { cn } from '../../utils';
import styles from './EmptyState.module.css';

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly icon?: React.ReactNode;
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly action?: React.ReactNode;
}

/**
 * EmptyState molecule for zero-data tables, Kanban columns, and queues.
 * Automatically snaps height and width to multiples of the 32px Blueprint grid.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...rest
}: EmptyStateProps): React.ReactElement {
  const emptyRef = useBlueprintGrid<HTMLDivElement>([title, description]);

  return (
    <div
      ref={emptyRef}
      data-bp-snap=""
      data-min-grids="4"
      className={cn(styles.emptyState, className)}
      {...rest}
    >
      {icon !== undefined && <div aria-hidden="true">{icon}</div>}
      <Text as="h3" variant="mono-label" tone="primary">
        {title}
      </Text>
      {description !== undefined && (
        <Text
          as="p"
          variant="caption"
          tone="secondary"
          className={styles.description}
        >
          {description}
        </Text>
      )}
      {action !== undefined && <div className={styles.actions}>{action}</div>}
    </div>
  );
}
