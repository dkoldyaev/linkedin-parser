import { Checkbox, Heading, Link, Skeleton, Text } from '../../atoms';
import { cn, GRID_CELL_PX } from '../../utils';
import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import styles from './Card.module.css';

export type CardAccentTone = 'success' | 'warning' | 'danger' | 'accent' | 'info' | 'none';

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
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
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
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
  ref,
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
                {title !== undefined && <span className={styles.compactTitle}>{title}</span>}
              </span>
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
});

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly snapToGrid?: boolean;
  readonly contentClassName?: string;
}

/**
 * CardBody wraps card content and quantizes its outer height to a multiple of GRID_CELL_PX (32px)
 * so CardFooter always starts on a 32px blueprint grid line.
 */
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(function CardBody(
  { snapToGrid = true, className, contentClassName, children, ...rest },
  forwardedRef,
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
        const snappedHeight = Math.ceil(rawHeight / GRID_CELL_PX) * GRID_CELL_PX;
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
      <div ref={contentRef} className={cn(styles.cardGridBodyContent, contentClassName)}>
        {children}
      </div>
    </div>
  );
});

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
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { metaSlot, actionsSlot, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn(styles.cardFooter, className)} {...rest}>
      <div className={styles.cardFooterMeta}>
        {metaSlot}
        {children}
      </div>

      {actionsSlot !== undefined && (
        <div className={styles.cardQuickActions} onClick={(e) => e.stopPropagation()}>
          {actionsSlot}
        </div>
      )}
    </div>
  );
});

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly overline?: React.ReactNode;
  readonly overlineHref?: string;
  readonly selectable?: boolean;
  readonly checked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
  readonly checkboxAriaLabel?: string;
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
  /**
   * When true, renders the collapsed/compact 32px format with overline/title combined.
   */
  readonly compact?: boolean;
  /**
   * When true, renders an animated skeleton placeholder.
   * Works for both standard and collapsed cards.
   */
  readonly isLoading?: boolean;
}

export type CardFullProps = Omit<CardProps, 'compact'>;
export type CardCollapsedProps = Omit<
  CardProps,
  'compact' | 'footer' | 'horizontal' | 'snapToGrid'
>;

export interface CardFullLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly accentTone?: CardAccentTone;
  readonly matchScore?: number;
  readonly horizontal?: boolean;
  readonly snapToGrid?: boolean;
  readonly bodyClassName?: string;
}

export interface CardCollapsedLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly accentTone?: CardAccentTone;
  readonly matchScore?: number;
}

function resolveCardToneClass(
  accentTone?: CardAccentTone,
  matchScore?: number,
): string | undefined {
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

  return resolvedTone === 'success'
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
}

/**
 * CardCollapsedLoading renders the animated skeleton placeholder for CardCollapsed (32px / 1 cell).
 */
export const CardCollapsedLoading = forwardRef<HTMLDivElement, CardCollapsedLoadingProps>(
  function CardCollapsedLoading({ accentTone, matchScore, className, ...rest }, ref) {
    const toneClass = resolveCardToneClass(accentTone, matchScore);
    return (
      <div
        ref={ref}
        aria-busy="true"
        className={cn(styles.card, styles.compact, toneClass, className)}
        {...rest}
      >
        <div className={styles.cardHeader}>
          <div className={styles.cardHeading}>
            <div className={styles.cardTitleContainer}>
              <div className={styles.cardHeaderMeta}>
                <Skeleton variant="text" width="75" height="xs" />
              </div>
            </div>
          </div>
          <Skeleton variant="chip" className={styles.skeletonHeaderChip} />
        </div>
      </div>
    );
  },
);

/**
 * CardFullLoading renders the animated skeleton placeholder for CardFull.
 */
export const CardFullLoading = forwardRef<HTMLDivElement, CardFullLoadingProps>(
  function CardFullLoading(
    {
      accentTone,
      matchScore,
      horizontal = false,
      snapToGrid = true,
      bodyClassName,
      className,
      ...rest
    },
    ref,
  ) {
    const toneClass = resolveCardToneClass(accentTone, matchScore);
    return (
      <div
        ref={ref}
        aria-busy="true"
        className={cn(styles.card, toneClass, horizontal && styles.horizontal, className)}
        {...rest}
      >
        <CardBody snapToGrid={snapToGrid} contentClassName={bodyClassName}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeading}>
              <div className={styles.cardTitleContainer}>
                <div className={styles.cardHeaderMeta}>
                  <Skeleton variant="text" className={styles.skeletonHeaderOverline} />
                </div>
                <Skeleton variant="text" width="85" height="md" />
              </div>
            </div>
            <Skeleton variant="chip" className={styles.skeletonHeaderChip} />
          </div>

          <div className={styles.skeletonChips}>
            <Skeleton variant="chip" className={styles.skeletonTechChipSm} />
            <Skeleton variant="chip" className={styles.skeletonTechChipMd} />
            <Skeleton variant="chip" className={styles.skeletonTechChipLg} />
          </div>

          <div className={styles.skeletonLines}>
            <Skeleton variant="text" width="100" height="xs" />
            <Skeleton variant="text" width="85" height="xs" />
            <Skeleton variant="text" width="60" height="xs" />
          </div>
        </CardBody>
        <CardFooter
          metaSlot={<Skeleton variant="text" className={styles.skeletonFooterMeta} />}
          actionsSlot={<Skeleton variant="rect" className={styles.skeletonFooterActions} />}
        />
      </div>
    );
  },
);

/**
 * CardCollapsed renders the compact 32px (1 grid cell) version of Card.
 * Displays overline / title in a single line with ellipsis and statusIndicators on the right.
 */
export const CardCollapsed = forwardRef<HTMLDivElement, CardCollapsedProps>(function CardCollapsed(
  {
    title,
    subtitle,
    overline,
    overlineHref,
    selectable = false,
    checked = false,
    onCheckedChange,
    checkboxAriaLabel = 'Select card',
    headerActions,
    statusIndicators,
    accentTone,
    matchScore,
    selected = false,
    interactive = false,
    isLoading = false,
    className,
    children: _children,
    ...rest
  },
  ref,
) {
  if (isLoading) {
    return (
      <CardCollapsedLoading
        ref={ref}
        accentTone={accentTone}
        matchScore={matchScore}
        className={className}
        {...rest}
      />
    );
  }

  const toneClass = resolveCardToneClass(accentTone, matchScore);

  return (
    <div
      ref={ref}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        styles.card,
        styles.compact,
        toneClass,
        selected && styles.selected,
        interactive && styles.interactive,
        className,
      )}
      {...rest}
    >
      <CardHeader
        compact
        title={title}
        subtitle={subtitle}
        overline={overline}
        overlineHref={overlineHref}
        selectable={selectable}
        checked={checked}
        onCheckedChange={onCheckedChange}
        checkboxAriaLabel={checkboxAriaLabel}
        headerActions={headerActions}
        statusIndicators={statusIndicators}
      />
    </div>
  );
});

/**
 * CardFull renders the complete multi-row version of Card with body, tech stack, summary and footer.
 */
export const CardFull = forwardRef<HTMLDivElement, CardFullProps>(function CardFull(
  {
    title,
    subtitle,
    overline,
    overlineHref,
    selectable = false,
    checked = false,
    onCheckedChange,
    checkboxAriaLabel = 'Select card',
    headerActions,
    statusIndicators,
    footer,
    accentTone,
    matchScore,
    selected = false,
    horizontal = false,
    interactive = false,
    snapToGrid = true,
    isLoading = false,
    className,
    bodyClassName,
    children,
    ...rest
  },
  ref,
) {
  if (isLoading) {
    return (
      <CardFullLoading
        ref={ref}
        accentTone={accentTone}
        matchScore={matchScore}
        horizontal={horizontal}
        snapToGrid={snapToGrid}
        bodyClassName={bodyClassName}
        className={className}
        {...rest}
      />
    );
  }

  const toneClass = resolveCardToneClass(accentTone, matchScore);

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
        className,
      )}
      {...rest}
    >
      {hasShorthandSlots ? (
        <>
          <CardBody snapToGrid={snapToGrid} contentClassName={bodyClassName}>
            {(title !== undefined ||
              subtitle !== undefined ||
              overline !== undefined ||
              selectable ||
              headerActions !== undefined ||
              statusIndicators !== undefined) && (
              <CardHeader
                title={title}
                subtitle={subtitle}
                overline={overline}
                overlineHref={overlineHref}
                selectable={selectable}
                checked={checked}
                onCheckedChange={onCheckedChange}
                checkboxAriaLabel={checkboxAriaLabel}
                headerActions={headerActions}
                statusIndicators={statusIndicators}
              />
            )}
            {children}
          </CardBody>
          {footer !== undefined &&
            (React.isValidElement(footer) ? footer : <CardFooter>{footer}</CardFooter>)}
        </>
      ) : (
        children
      )}
    </div>
  );
});

/**
 * Universal Blueprint Card organism.
 * Automatically delegates to CardCollapsed when `compact` is true, otherwise to CardFull.
 */
const CardBase = forwardRef<HTMLDivElement, CardProps>(function Card(
  { compact = false, ...props },
  ref,
) {
  if (compact) {
    return <CardCollapsed ref={ref} {...props} />;
  }
  return <CardFull ref={ref} {...props} />;
});

export const Card = Object.assign(CardBase, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
  Full: CardFull,
  Collapsed: CardCollapsed,
  FullLoading: CardFullLoading,
  CollapsedLoading: CardCollapsedLoading,
});
