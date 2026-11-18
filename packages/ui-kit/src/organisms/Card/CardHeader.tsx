import React, { forwardRef } from 'react';
import { Checkbox, Heading, Link, Text } from '../../atoms';
import { cn } from '../../utils';
import styles from './Card.module.css';

export interface CardHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly overline?: React.ReactNode;
  readonly overlineHref?: string;
  readonly selectable?: boolean;
  readonly checked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
  readonly checkboxAriaLabel?: string;
  readonly statusIndicators?: React.ReactNode;
  readonly headerActions?: React.ReactNode;
  readonly compact?: boolean;
}

/**
 * CardHeader renders the top section of a Card:
 * optional Checkbox + monospace overline/link, Heading (level 3), subtitle, and top-right status indicators.
 * In compact mode, combines overline and title into a single-line meta row with ellipsis.
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader(
    {
      title,
      subtitle,
      overline,
      overlineHref,
      selectable = false,
      checked = false,
      onCheckedChange,
      checkboxAriaLabel = 'Select card',
      statusIndicators,
      headerActions,
      compact = false,
      className,
      children,
      ...rest
    },
    ref
  ) {
    if (compact) {
      return (
        <div ref={ref} className={cn(styles.cardHeader, className)} {...rest}>
          <div className={styles.cardHeading}>
            <div className={styles.cardTitleContainer}>
              <div className={styles.cardHeaderMeta}>
                {selectable && (
                  <Checkbox
                    className={styles.cardCheckbox}
                    checked={checked}
                    aria-label={checkboxAriaLabel}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onCheckedChange?.(e.target.checked);
                    }}
                  />
                )}
                <span className={styles.cardHeaderMetaText}>
                  {overline !== undefined &&
                    (overlineHref ? (
                      <Link
                        href={overlineHref}
                        variant="mono"
                        tone="secondary"
                        external
                        className={styles.compactOverline}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {overline}
                      </Link>
                    ) : (
                      <span className={styles.compactOverline}>{overline}</span>
                    ))}
                  {overline !== undefined && title !== undefined && (
                    <span className={styles.compactDivider} aria-hidden="true">
                      /
                    </span>
                  )}
                  {title !== undefined && (
                    <span className={styles.compactTitle}>{title}</span>
                  )}
                </span>
                {children}
              </div>
            </div>
          </div>
          {statusIndicators !== undefined && (
            <div className={styles.cardStatusIndicators}>{statusIndicators}</div>
          )}
          {headerActions !== undefined && <div>{headerActions}</div>}
        </div>
      );
    }

    const showMetaRow = selectable || overline !== undefined;

    return (
      <div ref={ref} className={cn(styles.cardHeader, className)} {...rest}>
        <div className={styles.cardHeading}>
          <div className={styles.cardTitleContainer}>
            {showMetaRow && (
              <div className={styles.cardHeaderMeta}>
                {selectable && (
                  <Checkbox
                    className={styles.cardCheckbox}
                    checked={checked}
                    aria-label={checkboxAriaLabel}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onCheckedChange?.(e.target.checked);
                    }}
                  />
                )}
                {overline !== undefined &&
                  (overlineHref ? (
                    <Link
                      href={overlineHref}
                      variant="mono"
                      tone="secondary"
                      external
                      onClick={(e) => e.stopPropagation()}
                    >
                      {overline}
                    </Link>
                  ) : (
                    <Text as="span" variant="mono" tone="secondary">
                      {overline}
                    </Text>
                  ))}
              </div>
            )}
            {title !== undefined && (
              <Heading level={3} className={styles.cardTitle}>
                {title}
              </Heading>
            )}
            {subtitle !== undefined && (
              <Text as="p" variant="body-sm" tone="secondary" className={styles.cardSubtitle}>
                {subtitle}
              </Text>
            )}
            {children}
          </div>
        </div>
        {statusIndicators !== undefined && (
          <div className={styles.cardStatusIndicators}>{statusIndicators}</div>
        )}
        {headerActions !== undefined && <div>{headerActions}</div>}
      </div>
    );
  }
);

