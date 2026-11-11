import React from 'react';
import { Badge, StatusDot, type StatusDotTone, Text } from '../../atoms';
import { cn } from '../../utils';
import styles from './Header.module.css';

export interface HeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  readonly title: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly versionBadge?: React.ReactNode;
  readonly statusLabel?: React.ReactNode;
  readonly statusTone?: StatusDotTone;
  readonly statusPulse?: boolean;
  readonly navigation?: React.ReactNode;
  readonly actions?: React.ReactNode;
}

/**
 * Pure presentation Header organism aligned to the 64px (2-cell) Blueprint top bar.
 * Receives all status, navigation, and action controls via props — zero routing or API coupling.
 */
export function Header({
  title,
  subtitle,
  versionBadge,
  statusLabel,
  statusTone = 'success',
  statusPulse = false,
  navigation,
  actions,
  className,
  ...rest
}: HeaderProps): React.ReactElement {
  return (
    <header className={cn(styles.header, className)} {...rest}>
      <div className={styles.brandSection}>
        <div className={styles.brandTitle}>
          <Text as="h1" variant="heading" tone="primary">
            {title}
          </Text>
          {versionBadge !== undefined && (
            <Badge size="sm" tone="primary">
              {versionBadge}
            </Badge>
          )}
        </div>
        {subtitle !== undefined && (
          <Text variant="mono" tone="secondary">
            {subtitle}
          </Text>
        )}
        {statusLabel !== undefined && (
          <Badge tone="neutral" size="sm">
            <StatusDot tone={statusTone} pulse={statusPulse} />
            <span>{statusLabel}</span>
          </Badge>
        )}
      </div>

      {navigation !== undefined && (
        <nav aria-label="Primary navigation" className={styles.centerSection}>
          {navigation}
        </nav>
      )}

      {actions !== undefined && (
        <div className={styles.actionsSection}>{actions}</div>
      )}
    </header>
  );
}
