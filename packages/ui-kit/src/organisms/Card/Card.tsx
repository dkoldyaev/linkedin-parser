import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import {
  Checkbox,
  Heading,
  Link,
  Text,
} from '../../atoms';
import { GRID_CELL_PX, cn } from '../../utils';
import styles from './Card.module.css';

export type CardAccentTone = 'success' | 'warning' | 'danger' | 'accent' | 'info' | 'none';

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
}

/**
 * CardHeader renders the top section of a Card:
 * optional Checkbox + monospace overline/link, Heading (level 3), subtitle, and top-right status indicators.
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
      className,
      children,
      ...rest
    },
    ref
  ) {
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

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly snapToGrid?: boolean;
  readonly contentClassName?: string;
}

/**
 * CardBody wraps card content and quantizes its outer height to a multiple of GRID_CELL_PX (32px)
 * so CardFooter always starts on a 32px blueprint grid line.
 */
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  function CardBody(
    { snapToGrid = true, className, contentClassName, children, ...rest },
    forwardedRef
  ) {
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
      const bodyEl = bodyRef.current;
      const contentEl = contentRef.current;
      if (!snapToGrid || bodyEl === null || contentEl === null) {
        return undefined;
      }

      const syncGridHeight = (): void => {
        const rawHeight = contentEl.offsetHeight;
        if (rawHeight > 0) {
          const snappedHeight =
            Math.ceil(rawHeight / GRID_CELL_PX) * GRID_CELL_PX;
          bodyEl.style.setProperty('--bp-card-body-height', `${snappedHeight}px`);
        }
      };

      syncGridHeight();

      if (typeof ResizeObserver === 'undefined') {
        return undefined;
      }

      const observer = new ResizeObserver(syncGridHeight);
      observer.observe(contentEl);
      return () => observer.disconnect();
    }, [snapToGrid]);

    return (
      <div
        ref={(node) => {
          bodyRef.current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef !== null && forwardedRef !== undefined) {
            forwardedRef.current = node;
          }
        }}
        className={cn(styles.cardGridBody, className)}
        {...rest}
      >
        <div
          ref={contentRef}
          className={cn(styles.cardGridBodyContent, contentClassName)}
        >
          {children}
        </div>
      </div>
    );
  }
);

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slot for metadata, timestamps, indicators or counts displayed on the left */
  readonly metaSlot?: React.ReactNode;
  /** Slot for action buttons or ButtonGroup displayed on the right */
  readonly actionsSlot?: React.ReactNode;
  readonly children?: React.ReactNode;
}

/**
 * CardFooter is a 32px-tall blueprint grid row with left metadata slot and right quick-actions slot.
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter(
    {
      metaSlot,
      actionsSlot,
      className,
      children,
      ...rest
    },
    ref
  ) {
    return (
      <div ref={ref} className={cn(styles.cardFooter, className)} {...rest}>
        <div className={styles.cardFooterMeta}>
          {metaSlot}
          {children}
        </div>

        {actionsSlot !== undefined && (
          <div
            className={styles.cardQuickActions}
            onClick={(e) => e.stopPropagation()}
          >
            {actionsSlot}
          </div>
        )}
      </div>
    );
  }
);

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly overline?: React.ReactNode;
  readonly overlineHref?: string;
  readonly headerActions?: React.ReactNode;
  readonly statusIndicators?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly accentTone?: CardAccentTone;
  readonly matchScore?: number;
  readonly selected?: boolean;
  readonly horizontal?: boolean;
  readonly interactive?: boolean;
  readonly snapToGrid?: boolean;
  readonly bodyClassName?: string;
}

/**
 * Universal Blueprint Card organism.
 * Can be composed explicitly with `<Card><CardBody><CardHeader />...</CardBody><CardFooter /></Card>`
 * or via convenience props (`title`, `subtitle`, `overline`, `footer`, `accentTone`).
 */
const CardBase = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    title,
    subtitle,
    overline,
    overlineHref,
    headerActions,
    statusIndicators,
    footer,
    accentTone,
    matchScore,
    selected = false,
    horizontal = false,
    interactive = false,
    snapToGrid = true,
    className,
    bodyClassName,
    children,
    ...rest
  },
  ref
) {
  const resolvedTone: CardAccentTone | undefined =
    accentTone !== undefined
      ? accentTone
      : matchScore !== undefined
        ? matchScore >= 75
          ? 'success'
          : matchScore >= 50
            ? 'warning'
            : 'danger'
        : undefined;

  const toneClass =
    resolvedTone === 'success'
      ? styles.accentSuccess
      : resolvedTone === 'warning'
        ? styles.accentWarning
        : resolvedTone === 'danger'
          ? styles.accentDanger
          : resolvedTone === 'accent'
            ? styles.accentPrimary
            : resolvedTone === 'info'
              ? styles.accentInfo
              : undefined;

  const hasShorthandSlots =
    title !== undefined ||
    subtitle !== undefined ||
    overline !== undefined ||
    headerActions !== undefined ||
    statusIndicators !== undefined ||
    footer !== undefined;

  return (
    <div
      ref={ref}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        styles.card,
        toneClass,
        selected && styles.selected,
        horizontal && styles.horizontal,
        interactive && styles.interactive,
        className
      )}
      {...rest}
    >
      {hasShorthandSlots ? (
        <>
          <CardBody snapToGrid={snapToGrid} contentClassName={bodyClassName}>
            {(title !== undefined ||
              subtitle !== undefined ||
              overline !== undefined ||
              headerActions !== undefined ||
              statusIndicators !== undefined) && (
              <CardHeader
                title={title}
                subtitle={subtitle}
                overline={overline}
                overlineHref={overlineHref}
                headerActions={headerActions}
                statusIndicators={statusIndicators}
              />
            )}
            {children}
          </CardBody>
          {footer !== undefined && <CardFooter>{footer}</CardFooter>}
        </>
      ) : (
        children
      )}
    </div>
  );
});

export const Card = Object.assign(CardBase, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
