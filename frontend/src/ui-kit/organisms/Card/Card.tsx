import React, { forwardRef } from 'react';
import { Text } from '../../atoms';
import { cn } from '../../utils';
import styles from './Card.module.css';

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly headerActions?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly interactive?: boolean;
  readonly bodyClassName?: string;
}

/**
 * Blueprint Card organism with optional structured header, body, and footer slots.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    title,
    subtitle,
    headerActions,
    footer,
    interactive = false,
    className,
    bodyClassName,
    children,
    ...rest
  },
  ref
) {
  const hasHeader =
    title !== undefined ||
    subtitle !== undefined ||
    headerActions !== undefined;

  return (
    <div
      ref={ref}
      tabIndex={interactive ? 0 : undefined}
      className={cn(styles.card, interactive && styles.interactive, className)}
      {...rest}
    >
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            {title !== undefined && (
              <Text as="h3" variant="mono-label" tone="primary" truncate>
                {title}
              </Text>
            )}
            {subtitle !== undefined && (
              <Text as="p" variant="caption" tone="secondary" truncate>
                {subtitle}
              </Text>
            )}
          </div>
          {headerActions !== undefined && <div>{headerActions}</div>}
        </div>
      )}
      <div className={cn(styles.body, bodyClassName)}>{children}</div>
      {footer !== undefined && <div className={styles.footer}>{footer}</div>}
    </div>
  );
});
