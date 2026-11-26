import { cn } from '../../utils';
import React from 'react';
import styles from './Header.module.css';
import { Text } from '../../atoms';

export interface HeaderBrandProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly brandIcon?: React.ReactNode;
  readonly className?: string;
  readonly children?: React.ReactNode;
}

export function HeaderBrand({
  title = 'BLUEPRINT.UI',
  subtitle = 'DESIGN SYSTEM',
  brandIcon,
  className,
  children,
  ...rest
}: HeaderBrandProps): React.ReactElement {
  return (
    <div className={cn(styles.brand, className)} {...rest}>
      <div className={styles.brandIcon}>
        {brandIcon !== undefined ? (
          brandIcon
        ) : (
          <span className={styles.blueprintMark} aria-hidden="true" />
        )}
      </div>
      <div className={styles.brandText}>
        <Text as="h1" variant="mono-label" className={styles.brandTitle}>
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text as="p" variant="caption" tone="muted" className={styles.brandSubtitle}>
            {subtitle}
          </Text>
        )}
      </div>
      {children}
    </div>
  );
}
