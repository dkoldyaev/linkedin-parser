import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import { Award, Ban, RotateCcw, Tag } from 'lucide-react';
import {
  AiPendingText,
  Badge,
  Button,
  Checkbox,
  CompanyLink,
  HistoryText,
  Icon,
  LocationText,
  SalaryText,
  WorkplaceText,
  type BadgeTone,
  type MatchTier,
  type WorkplaceType,
} from '../../atoms';
import { cn } from '../../utils';
import styles from './Card.module.css';

/* ==========================================================================
   1. CardHeader (.card-top)
   ========================================================================== */

export interface CardHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly company?: React.ReactNode;
  readonly companyHref?: string;
  readonly selectable?: boolean;
  readonly checked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
  readonly checkboxAriaLabel?: string;
  readonly statusIndicators?: React.ReactNode;
  readonly headerActions?: React.ReactNode;
}

/**
 * CardHeader (`.card-top`) renders the vacancy card's top section:
 * checkbox + uppercase monospace company link (`UNKNOWN ↗`), 2-line clamped title,
 * and top-right status indicators (`StageBadge` / `ClosedBadge`).
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader(
    {
      title,
      subtitle,
      company,
      companyHref,
      selectable = false,
      checked = false,
      onCheckedChange,
      checkboxAriaLabel = 'Выбрать вакансию',
      statusIndicators,
      headerActions,
      className,
      children,
      ...rest
    },
    ref
  ) {
    const showMetaRow = selectable || company !== undefined;

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
                      if (onCheckedChange !== undefined) {
                        onCheckedChange(e.target.checked);
                      }
                    }}
                  />
                )}
                {company !== undefined && (
                  <CompanyLink
                    company={company}
                    href={companyHref}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            )}
            {title !== undefined && <h3 className={styles.cardTitle}>{title}</h3>}
            {subtitle !== undefined && (
              <p className={styles.cardSubtitle}>{subtitle}</p>
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

/* ==========================================================================
   2. CardBody (.card-grid-body & .card-grid-body-content)
   ========================================================================== */

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly snapToGrid?: boolean;
  readonly contentClassName?: string;
}

/**
 * CardBody (`.card-grid-body`) wraps card content in `.card-grid-body-content` (16px padding, 8px gap)
 * and automatically quantizes its outer height to a multiple of 32px (`var(--ui-grid)`)
 * so `CardFooter` always starts on a 32px blueprint grid line.
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
          const snappedHeight = Math.ceil(rawHeight / 32) * 32;
          bodyEl.style.setProperty('--ui-card-body-height', `${snappedHeight}px`);
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

/* ==========================================================================
   3. CardFooter (.card-footer)
   ========================================================================== */

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly date?: React.ReactNode;
  readonly historyCount?: number;
  readonly hasHistoryComment?: boolean;
  readonly historyTitle?: string;
  readonly isRejected?: boolean;
  readonly canMoveLeft?: boolean;
  readonly canMoveRight?: boolean;
  readonly onMoveLeft?: () => void;
  readonly onMoveRight?: () => void;
  readonly onReject?: () => void;
  readonly onRestore?: () => void;
  readonly restoreLabel?: React.ReactNode;
  readonly actions?: React.ReactNode;
}

/**
 * CardFooter (`.card-footer`) is a 32px-tall blueprint grid row with an inset 1px top border,
 * left-side date + stage history indicator, and right-side 32×32px `<`, `×`, `>` quick actions
 * (or a restore button for rejected cards).
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter(
    {
      date,
      historyCount,
      hasHistoryComment = false,
      historyTitle,
      isRejected = false,
      canMoveLeft = true,
      canMoveRight = true,
      onMoveLeft,
      onMoveRight,
      onReject,
      onRestore,
      restoreLabel = 'Восстановить',
      actions,
      className,
      children,
      ...rest
    },
    ref
  ) {
    const hasStructuredFooter =
      date !== undefined ||
      historyCount !== undefined ||
      actions !== undefined ||
      onMoveLeft !== undefined ||
      onMoveRight !== undefined ||
      onReject !== undefined ||
      isRejected;

    if (!hasStructuredFooter && children !== undefined) {
      return (
        <div ref={ref} className={cn(styles.cardFooter, className)} {...rest}>
          {children}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(styles.cardFooter, className)} {...rest}>
        <div className={styles.cardFooterMeta}>
          {date !== undefined && <span className={styles.cardDate}>{date}</span>}
          {historyCount !== undefined && historyCount > 0 && (
            <HistoryText
              count={historyCount}
              hasComment={hasHistoryComment}
              title={historyTitle}
            />
          )}
          {children}
        </div>

        <div
          className={styles.cardQuickActions}
          onClick={(e) => e.stopPropagation()}
        >
          {actions !== undefined ? (
            actions
          ) : isRejected ? (
            <Button
              variant="secondary"
              size="sm"
              className={styles.quickRestoreBtn}
              onClick={onRestore}
              startIcon={<Icon icon={RotateCcw} size="xs" />}
            >
              {restoreLabel}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={styles.quickMoveBtn}
                disabled={!canMoveLeft}
                onClick={onMoveLeft}
                aria-label="Переместить влево"
                title="Переместить влево"
              >
                &lt;
              </Button>
              <Button
                variant="ghost"
                size="icon"
                tone="danger"
                className={cn(styles.quickMoveBtn, styles.quickRejectBtn)}
                onClick={onReject}
                aria-label="Отклонить вакансию"
                title="Отклонить вакансию"
              >
                ×
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={styles.quickMoveBtn}
                disabled={!canMoveRight}
                onClick={onMoveRight}
                aria-label="Переместить вправо"
                title="Переместить вправо"
              >
                &gt;
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
);

/* ==========================================================================
   4. Card Root (.kanban-card)
   ========================================================================== */

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly company?: React.ReactNode;
  readonly companyHref?: string;
  readonly headerActions?: React.ReactNode;
  readonly statusIndicators?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly matchTier?: MatchTier;
  readonly matchScore?: number;
  readonly selected?: boolean;
  readonly horizontal?: boolean;
  readonly interactive?: boolean;
  readonly snapToGrid?: boolean;
  readonly bodyClassName?: string;
}

/**
 * Blueprint Card organism (`.kanban-card`).
 * Can be composed explicitly with `<Card><CardBody><CardHeader />...</CardBody><CardFooter /></Card>`
 * or via convenience props (`title`, `company`, `footer`, `matchScore`).
 */
const CardBase = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    title,
    subtitle,
    company,
    companyHref,
    headerActions,
    statusIndicators,
    footer,
    matchTier,
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
  const resolvedTier: MatchTier | undefined =
    matchTier !== undefined
      ? matchTier
      : matchScore !== undefined
        ? matchScore >= 75
          ? 'high'
          : matchScore >= 50
            ? 'medium'
            : 'low'
        : undefined;

  const tierClass =
    resolvedTier === 'high'
      ? styles.matchHigh
      : resolvedTier === 'medium'
        ? styles.matchMedium
        : resolvedTier === 'low'
          ? styles.matchLow
          : undefined;

  const hasLegacySlots =
    title !== undefined ||
    subtitle !== undefined ||
    company !== undefined ||
    headerActions !== undefined ||
    statusIndicators !== undefined ||
    footer !== undefined;

  return (
    <div
      ref={ref}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        styles.card,
        tierClass,
        selected && styles.selected,
        horizontal && styles.horizontal,
        interactive && styles.interactive,
        className
      )}
      {...rest}
    >
      {hasLegacySlots ? (
        <>
          <CardBody snapToGrid={snapToGrid} contentClassName={bodyClassName}>
            {(title !== undefined ||
              subtitle !== undefined ||
              company !== undefined ||
              headerActions !== undefined ||
              statusIndicators !== undefined) && (
              <CardHeader
                title={title}
                subtitle={subtitle}
                company={company}
                companyHref={companyHref}
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

/* ==========================================================================
   5. VacancyCard — Ready-to-Use Kanban Vacancy Card (1:1 with KanbanCard.jsx)
   ========================================================================== */

export interface VacancyCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title: string;
  readonly company: string;
  readonly sourceUrl?: string;
  readonly matchScore?: number;
  readonly workplace?: WorkplaceType;
  readonly location?: string;
  readonly salary?: string;
  readonly summary?: string;
  readonly aiPending?: boolean;
  readonly techStack?: readonly string[];
  readonly maxVisibleTech?: number;
  readonly tags?: readonly string[];
  readonly date?: string;
  readonly historyCount?: number;
  readonly hasHistoryComment?: boolean;
  readonly selectable?: boolean;
  readonly selected?: boolean;
  readonly onSelectedChange?: (selected: boolean) => void;
  readonly isClosed?: boolean;
  readonly isRejected?: boolean;
  readonly stageBadgeLabel?: string;
  readonly stageBadgeTone?: BadgeTone;
  readonly canMoveLeft?: boolean;
  readonly canMoveRight?: boolean;
  readonly onMoveLeft?: () => void;
  readonly onMoveRight?: () => void;
  readonly onReject?: () => void;
  readonly onRestore?: () => void;
}

/**
 * Complete Kanban Vacancy Card organism (`VacancyCard`) matching `frontend/src/components/KanbanCard.jsx`
 * and `frontend/src/design-system.css` 1:1.
 */
export const VacancyCard = forwardRef<HTMLDivElement, VacancyCardProps>(
  function VacancyCard(
    {
      title,
      company,
      sourceUrl,
      matchScore,
      workplace,
      location,
      salary,
      summary,
      aiPending = false,
      techStack = [],
      maxVisibleTech = 4,
      tags = [],
      date,
      historyCount,
      hasHistoryComment = false,
      selectable = true,
      selected = false,
      onSelectedChange,
      isClosed = false,
      isRejected = false,
      stageBadgeLabel,
      stageBadgeTone = 'backlog',
      canMoveLeft = true,
      canMoveRight = true,
      onMoveLeft,
      onMoveRight,
      onReject,
      onRestore,
      className,
      ...rest
    },
    ref
  ) {
    const visibleTech = techStack.slice(0, maxVisibleTech);
    const hiddenTech = techStack.slice(maxVisibleTech);

    const statusIndicators =
      stageBadgeLabel !== undefined || isClosed ? (
        <>
          {stageBadgeLabel !== undefined && (
            <Badge variant="stage" tone={stageBadgeTone}>{stageBadgeLabel}</Badge>
          )}
          {isClosed && (
            <Badge variant="stage" tone="rejected" icon={<Ban size={11} aria-hidden="true" />}>
              Закрыта
            </Badge>
          )}
        </>
      ) : undefined;

    return (
      <Card
        ref={ref}
        matchScore={matchScore}
        selected={selected}
        horizontal={isRejected}
        interactive
        className={className}
        {...rest}
      >
        <CardBody>
          <CardHeader
            title={title}
            company={company}
            companyHref={sourceUrl}
            selectable={selectable}
            checked={selected}
            onCheckedChange={onSelectedChange}
            statusIndicators={statusIndicators}
          />

          <div className={styles.cardMeta}>
            {matchScore !== undefined && (
              <Badge
                variant="match"
                tone={matchScore >= 75 ? 'high' : matchScore >= 50 ? 'medium' : 'low'}
                icon={<Award size={11} aria-hidden="true" />}
              >
                {matchScore}%
              </Badge>
            )}
            {workplace !== undefined && <WorkplaceText workplace={workplace} />}
            {location !== undefined && <LocationText>{location}</LocationText>}
            {salary !== undefined && <SalaryText>{salary}</SalaryText>}
          </div>

          {!isRejected && (
            <>
              {summary !== undefined && summary !== '' ? (
                <div className={styles.cardSummary}>{summary}</div>
              ) : aiPending ? (
                <AiPendingText />
              ) : null}

              {visibleTech.length > 0 && (
                <div className={styles.cardTechStack}>
                  {visibleTech.map((tech) => (
                    <Badge key={tech} variant="ghost" size="xs">
                      {tech}
                    </Badge>
                  ))}
                  {hiddenTech.length > 0 && (
                    <Badge variant="ghost" size="xs" title={hiddenTech.join(', ')}>
                      +{hiddenTech.length}
                    </Badge>
                  )}
                </div>
              )}
            </>
          )}

          {tags.length > 0 && (
            <div className={styles.cardTags}>
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="ghost"
                  size="xs"
                  tone="primary"
                  icon={<Tag size={10} aria-hidden="true" />}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardBody>

        {!isRejected ? (
          <CardFooter
            date={date}
            historyCount={historyCount}
            hasHistoryComment={hasHistoryComment}
            canMoveLeft={canMoveLeft}
            canMoveRight={canMoveRight}
            onMoveLeft={onMoveLeft}
            onMoveRight={onMoveRight}
            onReject={onReject}
          />
        ) : onRestore ? (
          <CardFooter
            date={date}
            historyCount={historyCount}
            hasHistoryComment={hasHistoryComment}
            isRejected
            onRestore={onRestore}
          />
        ) : null}
      </Card>
    );
  }
);
