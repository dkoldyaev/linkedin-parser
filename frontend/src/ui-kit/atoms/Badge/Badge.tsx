import React, { forwardRef } from 'react';
import { Award, Ban, CheckCircle2, Clock, FileEdit, Tag, X } from 'lucide-react';
import { cn } from '../../utils';
import styles from './Badge.module.css';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
  readonly size?: BadgeSize;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
}

/**
 * Atomic Badge / Tag component for status indicators, column counts, and keyword tokens.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    tone = 'neutral',
    size = 'md',
    onRemove,
    removeLabel = 'Remove',
    className,
    children,
    ...rest
  },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        styles.badge,
        styles[`tone-${tone}`],
        styles[`size-${size}`],
        className
      )}
      {...rest}
    >
      <span>{children}</span>
      {onRemove !== undefined && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={onRemove}
          aria-label={removeLabel}
        >
          ×
        </button>
      )}
    </span>
  );
});

export type MatchTier = 'high' | 'medium' | 'low';

export interface MatchBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly score: number;
  readonly tier?: MatchTier;
  readonly showIcon?: boolean;
}

/**
 * Match Score Badge (`.card-match-badge`) used in KanbanCard and VacancyModal.
 * Automatically assigns `high` (>=75%), `medium` (>=50%), or `low` (<50%) tier.
 */
export const MatchBadge = forwardRef<HTMLSpanElement, MatchBadgeProps>(
  function MatchBadge(
    { score, tier, showIcon = true, className, ...rest },
    ref
  ) {
    const resolvedTier: MatchTier =
      tier !== undefined
        ? tier
        : score >= 75
          ? 'high'
          : score >= 50
            ? 'medium'
            : 'low';

    const tierClass =
      resolvedTier === 'high'
        ? styles.matchHigh
        : resolvedTier === 'medium'
          ? styles.matchMedium
          : styles.matchLow;

    return (
      <span
        ref={ref}
        className={cn(styles.matchBadge, tierClass, className)}
        {...rest}
      >
        {showIcon && <Award size={11} aria-hidden="true" />}
        <span>{score}%</span>
      </span>
    );
  }
);

export interface TechChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly label?: React.ReactNode;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly variant?: 'ghost' | 'badge';
}

/**
 * Monospace Tech Stack Chip (`.tech-chip`) used inside KanbanCard and EditableTokenList.
 */
export const TechChip = forwardRef<HTMLSpanElement, TechChipProps>(
  function TechChip(
    { label, onRemove, removeLabel = 'Удалить', variant = 'ghost', children, className, ...rest },
    ref
  ) {
    const isBadge = variant === 'badge';
    return (
      <span
        ref={ref}
        className={cn(
          styles.techChip,
          isBadge && styles.chipBadge,
          className
        )}
        {...rest}
      >
        <span>{label !== undefined ? label : children}</span>
        {onRemove !== undefined && (
          <button
            type="button"
            className={styles.chipRemove}
            onClick={onRemove}
            aria-label={removeLabel}
          >
            <X size={12} aria-hidden />
          </button>
        )}
      </span>
    );
  }
);

export interface TagChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly label?: React.ReactNode;
  readonly showIcon?: boolean;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly variant?: 'ghost' | 'badge';
}

/**
 * Tag Chip (`.tag-chip`) with `Tag` icon used inside KanbanCard and EditableTokenList.
 */
export const TagChip = forwardRef<HTMLSpanElement, TagChipProps>(
  function TagChip(
    {
      label,
      showIcon = true,
      onRemove,
      removeLabel = 'Удалить',
      variant = 'ghost',
      children,
      className,
      ...rest
    },
    ref
  ) {
    const isBadge = variant === 'badge';
    return (
      <span
        ref={ref}
        className={cn(
          styles.tagChip,
          isBadge && styles.chipBadge,
          className
        )}
        {...rest}
      >
        {showIcon && <Tag size={isBadge ? 11 : 10} aria-hidden="true" />}
        <span>{label !== undefined ? label : children}</span>
        {onRemove !== undefined && (
          <button
            type="button"
            className={styles.chipRemove}
            onClick={onRemove}
            aria-label={removeLabel}
          >
            <X size={12} aria-hidden />
          </button>
        )}
      </span>
    );
  }
);

export type StageBadgeTone =
  | 'backlog'
  | 'applied'
  | 'interview'
  | 'assessment'
  | 'offer'
  | 'rejected';

export interface StageBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly stageTone?: StageBadgeTone;
}

const STAGE_TONE_CLASS: Record<StageBadgeTone, string> = {
  backlog: styles.stageToneBacklog,
  applied: styles.stageToneApplied,
  interview: styles.stageToneInterview,
  assessment: styles.stageToneAssessment,
  offer: styles.stageToneOffer,
  rejected: styles.stageToneRejected,
};

/**
 * Top-right 64×33px Stage / Lane Badge (`.card-lane-badge`) used on rejected or cross-column cards.
 */
export const StageBadge = forwardRef<HTMLSpanElement, StageBadgeProps>(
  function StageBadge(
    { stageTone = 'backlog', className, children, ...rest },
    ref
  ) {
    return (
      <span
        ref={ref}
        className={cn(
          styles.stageBadge,
          STAGE_TONE_CLASS[stageTone],
          className
        )}
        {...rest}
      >
        {children}
      </span>
    );
  }
);

export interface ClosedBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  readonly label?: React.ReactNode;
}

/**
 * Closed Vacancy Badge (`.card-closed-badge`) with `Ban` icon.
 */
export const ClosedBadge = forwardRef<HTMLSpanElement, ClosedBadgeProps>(
  function ClosedBadge({ label = 'Закрыта', children, className, ...rest }, ref) {
    return (
      <span ref={ref} className={cn(styles.closedBadge, className)} {...rest}>
        <Ban size={11} aria-hidden="true" />
        <span>{children !== undefined ? children : label}</span>
      </span>
    );
  }
);

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface SeverityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  readonly severity: SeverityLevel;
}

/**
 * Compatibility Gap Severity Badge (`.compatibility-severity-badge`) used in VacancyModal.
 */
export const SeverityBadge = forwardRef<HTMLSpanElement, SeverityBadgeProps>(
  function SeverityBadge({ severity, className, children, ...rest }, ref) {
    const sevClass =
      severity === 'critical'
        ? styles.severityCritical
        : severity === 'high'
          ? styles.severityHigh
          : severity === 'medium'
            ? styles.severityMedium
            : styles.severityLow;

    return (
      <span
        ref={ref}
        className={cn(styles.severityBadge, sevClass, className)}
        {...rest}
      >
        {children !== undefined ? children : severity}
      </span>
    );
  }
);

export type CvSyncState = 'approved' | 'outdated' | 'draft';

export interface CvSyncBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  readonly status: CvSyncState;
}

/**
 * CV Synchronization Status Badge (`.cv-sync-badge`) used in CvPage and Header.
 */
export const CvSyncBadge = forwardRef<HTMLSpanElement, CvSyncBadgeProps>(
  function CvSyncBadge({ status, className, children, ...rest }, ref) {
    const stateClass =
      status === 'approved'
        ? styles.cvSyncApproved
        : status === 'outdated'
          ? styles.cvSyncOutdated
          : styles.cvSyncDraft;

    const icon =
      status === 'approved' ? (
        <CheckCircle2 size={13} aria-hidden="true" />
      ) : status === 'outdated' ? (
        <Clock size={13} aria-hidden="true" />
      ) : (
        <FileEdit size={13} aria-hidden="true" />
      );

    return (
      <span
        ref={ref}
        className={cn(styles.cvSyncBadge, stateClass, className)}
        {...rest}
      >
        {icon}
        <span>{children}</span>
      </span>
    );
  }
);
