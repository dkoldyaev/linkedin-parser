import React from 'react';
import { Text } from '../../atoms';
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
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...rest
}: EmptyStateProps): React.ReactElement {
  return (
    <div className={cn(styles.emptyState, className)} {...rest}>
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
