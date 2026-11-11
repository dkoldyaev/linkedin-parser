import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { Button, Icon, Text } from '../../atoms';
import { useBlueprintGrid } from '../../hooks';
import { cn } from '../../utils';
import styles from './AlertBanner.module.css';

export type AlertBannerTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly tone?: AlertBannerTone;
  readonly title?: React.ReactNode;
  readonly onDismiss?: () => void;
  readonly dismissLabel?: string;
}

const TONE_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
} as const;

/**
 * AlertBanner molecule replacing inline status/error/warning banners across pages and modals.
 * Automatically snaps its height and width to multiples of the 32px Blueprint grid.
 */
export function AlertBanner({
  tone = 'info',
  title,
  onDismiss,
  dismissLabel = 'Dismiss alert',
  className,
  children,
  ...rest
}: AlertBannerProps): React.ReactElement {
  const bannerRef = useBlueprintGrid<HTMLDivElement>([title, children, tone]);
  const IconComponent = TONE_ICONS[tone];
  const ariaRole = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';

  return (
    <div
      ref={bannerRef}
      role={ariaRole}
      data-bp-snap=""
      className={cn(
        styles.banner,
        styles[`tone-${tone}`],
        onDismiss !== undefined && styles.hasDismiss,
        className
      )}
      {...rest}
    >
      <div className={styles.body}>
        <Icon icon={IconComponent} size="md" className={styles.icon} />
        <div className={styles.textStack}>
          {title !== undefined && (
            <Text as="div" variant="mono-label" tone="primary">
              {title}
            </Text>
          )}
          <Text as="div" variant="body" tone="primary">
            {children}
          </Text>
        </div>
      </div>
      {onDismiss !== undefined && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={styles.dismissButton}
        >
          <Icon icon={X} size="sm" />
        </Button>
      )}
    </div>
  );
}
