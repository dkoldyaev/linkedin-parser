import React, { forwardRef } from 'react';
import { Award, Ban, CheckCircle2, Clock, FileEdit, Tag } from 'lucide-react';
import { cn } from '../../utils';
import styles from './Badge.module.css';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  // Stage / Pipeline tones
  | 'backlog'
  | 'applied'
  | 'interview'
  | 'assessment'
  | 'offer'
  | 'rejected'
  // Severity & Match tiers
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type BadgeVariant =
  | 'badge'
  | 'chip'
  | 'ghost'
  | 'match'
  | 'stage'
  | 'severity'
  | 'sync';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly icon?: React.ReactNode;
  readonly tone?: BadgeTone;
  readonly variant?: BadgeVariant;
  readonly size?: BadgeSize;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly children?: React.ReactNode;
  readonly className?: string;
}

/**
 * Atomic Badge component for status indicators, scores, keyword tokens, and metadata tags.
 * Fully configurable through `icon`, `variant`, `size`, and `tone` props.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    icon,
    tone = 'neutral',
    variant = 'badge',
    size = 'md',
    onRemove,
    removeLabel = 'Удалить',
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
        styles[`variant-${variant}`],
        styles[`tone-${tone}`],
        styles[`size-${size}`],
        className
      )}
      {...rest}
    >
      {icon !== undefined && (
        <span className={styles.iconSlot} aria-hidden="true">
          {icon}
        </span>
      )}
      {children !== undefined && <span>{children}</span>}
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

/* ========================================================================
   Backwards Compatibility Wrappers (Deprecated - use <Badge> with props)
   ======================================================================== */

export type MatchTier = 'high' | 'medium' | 'low';

export interface MatchBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly score: number;
  readonly tier?: MatchTier;
  readonly showIcon?: boolean;
}

/**
 * @deprecated Use `<Badge variant="match" tone={...} icon={<Award size={11} />}>{score}%</Badge>`
 */
export const MatchBadge = forwardRef<HTMLSpanElement, MatchBadgeProps>(
  function MatchBadge({ score, tier, showIcon = true, className, ...rest }, ref) {
    const resolvedTier: BadgeTone =
      tier !== undefined
        ? tier
        : score >= 75
          ? 'high'
          : score >= 50
            ? 'medium'
            : 'low';

    return (
      <Badge
        ref={ref}
        variant="match"
        tone={resolvedTier}
        icon={showIcon ? <Award size={11} aria-hidden="true" /> : undefined}
        className={className}
        {...rest}
      >
        {score}%
      </Badge>
    );
  }
);

export interface TechChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly label?: React.ReactNode;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly variant?: 'ghost' | 'badge';
  readonly tone?: BadgeTone;
}

/**
 * @deprecated Use `<Badge variant={variant === 'badge' ? 'chip' : 'ghost'} size="xs">{label}</Badge>`
 */
export const TechChip = forwardRef<HTMLSpanElement, TechChipProps>(
  function TechChip(
    { label, onRemove, removeLabel, variant = 'ghost', tone = 'neutral', children, className, ...rest },
    ref
  ) {
    return (
      <Badge
        ref={ref}
        variant={variant === 'badge' ? 'chip' : 'ghost'}
        tone={tone}
        size="xs"
        onRemove={onRemove}
        removeLabel={removeLabel}
        className={className}
        {...rest}
      >
        {label !== undefined ? label : children}
      </Badge>
    );
  }
);

export interface TagChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly label?: React.ReactNode;
  readonly showIcon?: boolean;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly variant?: 'ghost' | 'badge';
  readonly tone?: BadgeTone;
}

/**
 * @deprecated Use `<Badge variant={variant === 'badge' ? 'chip' : 'ghost'} icon={<Tag size={10} />}>{label}</Badge>`
 */
export const TagChip = forwardRef<HTMLSpanElement, TagChipProps>(
  function TagChip(
    {
      label,
      showIcon = true,
      onRemove,
      removeLabel,
      variant = 'ghost',
      tone = 'primary',
      children,
      className,
      ...rest
    },
    ref
  ) {
    return (
      <Badge
        ref={ref}
        variant={variant === 'badge' ? 'chip' : 'ghost'}
        tone={tone}
        size="xs"
        icon={showIcon ? <Tag size={variant === 'badge' ? 11 : 10} aria-hidden="true" /> : undefined}
        onRemove={onRemove}
        removeLabel={removeLabel}
        className={className}
        {...rest}
      >
        {label !== undefined ? label : children}
      </Badge>
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

/**
 * @deprecated Use `<Badge variant="stage" tone={stageTone}>{children}</Badge>`
 */
export const StageBadge = forwardRef<HTMLSpanElement, StageBadgeProps>(
  function StageBadge({ stageTone = 'backlog', className, children, ...rest }, ref) {
    return (
      <Badge
        ref={ref}
        variant="stage"
        tone={stageTone}
        className={className}
        {...rest}
      >
        {children}
      </Badge>
    );
  }
);

export interface ClosedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly label?: React.ReactNode;
}

/**
 * @deprecated Use `<Badge variant="stage" tone="rejected" icon={<Ban size={11} />}>{label}</Badge>`
 */
export const ClosedBadge = forwardRef<HTMLSpanElement, ClosedBadgeProps>(
  function ClosedBadge({ label = 'Закрыта', children, className, ...rest }, ref) {
    return (
      <Badge
        ref={ref}
        variant="stage"
        tone="rejected"
        icon={<Ban size={11} aria-hidden="true" />}
        className={className}
        {...rest}
      >
        {children !== undefined ? children : label}
      </Badge>
    );
  }
);

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface SeverityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly severity: SeverityLevel;
}

/**
 * @deprecated Use `<Badge variant="severity" tone={severity}>{children}</Badge>`
 */
export const SeverityBadge = forwardRef<HTMLSpanElement, SeverityBadgeProps>(
  function SeverityBadge({ severity, className, children, ...rest }, ref) {
    return (
      <Badge
        ref={ref}
        variant="severity"
        tone={severity}
        className={className}
        {...rest}
      >
        {children !== undefined ? children : severity.toUpperCase()}
      </Badge>
    );
  }
);

export type CvSyncState = 'approved' | 'outdated' | 'draft';

export interface CvSyncBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly status: CvSyncState;
}

/**
 * @deprecated Use `<Badge variant="sync" tone={...} icon={...}>{children}</Badge>`
 */
export const CvSyncBadge = forwardRef<HTMLSpanElement, CvSyncBadgeProps>(
  function CvSyncBadge({ status, className, children, ...rest }, ref) {
    const tone: BadgeTone =
      status === 'approved' ? 'success' : status === 'outdated' ? 'warning' : 'primary';

    const icon =
      status === 'approved' ? (
        <CheckCircle2 size={13} aria-hidden="true" />
      ) : status === 'outdated' ? (
        <Clock size={13} aria-hidden="true" />
      ) : (
        <FileEdit size={13} aria-hidden="true" />
      );

    return (
      <Badge
        ref={ref}
        variant="sync"
        tone={tone}
        icon={icon}
        className={className}
        {...rest}
      >
        {children}
      </Badge>
    );
  }
);
