import React from 'react';
import { Spinner, Text } from '../../atoms';
import { cn } from '../../utils';
import styles from './DataTable.module.css';

export interface DataTableLoadingProps {
  readonly label?: string;
  readonly className?: string;
}

export function DataTableLoading({
  label = 'Loading records...',
  className,
}: DataTableLoadingProps): React.ReactElement {
  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.loadingState}>
        <Spinner size="md" label={label} />
        <Text variant="mono" tone="secondary">
          {label}
        </Text>
      </div>
    </div>
  );
}

