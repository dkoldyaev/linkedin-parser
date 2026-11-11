import React, { forwardRef } from 'react';
import {
  Banknote,
  Building,
  ExternalLink,
  History,
  Laptop,
  Layers,
  Loader2,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';
import styles from './IconText.module.css';

export type IconTextTone =
  | 'muted'
  | 'secondary'
  | 'primary'
  | 'salary'
  | 'workplace-remote'
  | 'workplace-hybrid'
  | 'workplace-onsite'
  | 'mint'
  | 'danger';

export type IconTextSize = 'xs' | 'sm' | 'md';
export type IconTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface IconTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly icon?: LucideIcon;
  readonly trailingIcon?: LucideIcon;
  readonly iconSize?: number;
  readonly tone?: IconTextTone;
  readonly size?: IconTextSize;
  readonly weight?: IconTextWeight;
  readonly mono?: boolean;
  readonly uppercase?: boolean;
}

const TONE_CLASS_MAP: Record<IconTextTone, string> = {
  muted: styles.toneMuted,
  secondary: styles.toneSecondary,
  primary: styles.tonePrimary,
  salary: styles.toneSalary,
  'workplace-remote': styles.toneWorkplaceRemote,
  'workplace-hybrid': styles.toneWorkplaceHybrid,
  'workplace-onsite': styles.toneWorkplaceOnsite,
  mint: styles.toneMint,
  danger: styles.toneDanger,
};

const SIZE_CLASS_MAP: Record<IconTextSize, string> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
};

const WEIGHT_CLASS_MAP: Record<IconTextWeight, string> = {
  regular: styles.weightRegular,
  medium: styles.weightMedium,
  semibold: styles.weightSemibold,
  bold: styles.weightBold,
};

/**
 * Atomic Icon + Text component for inline metadata (location, workplace, salary, company link, history).
 */
export const IconText = forwardRef<HTMLSpanElement, IconTextProps>(
  function IconText(
    {
      icon: LeadingIcon,
      trailingIcon: TrailingIcon,
      iconSize = 12,
      tone = 'muted',
      size = 'sm',
      weight,
      mono = false,
      uppercase = false,
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
          styles.iconText,
          TONE_CLASS_MAP[tone],
          SIZE_CLASS_MAP[size],
          weight !== undefined && WEIGHT_CLASS_MAP[weight],
          mono && styles.mono,
          uppercase && styles.uppercase,
          className
        )}
        {...rest}
      >
        {LeadingIcon !== undefined && (
          <LeadingIcon size={iconSize} aria-hidden="true" />
        )}
        <span>{children}</span>
        {TrailingIcon !== undefined && (
          <TrailingIcon size={iconSize} aria-hidden="true" />
        )}
      </span>
    );
  }
);

export type WorkplaceType = 'remote' | 'hybrid' | 'onsite';

export interface WorkplaceTextProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  readonly workplace: WorkplaceType;
  readonly label?: React.ReactNode;
}

const WORKPLACE_DEFAULT_LABELS: Record<WorkplaceType, string> = {
  remote: 'Удаленка',
  hybrid: 'Гибрид',
  onsite: 'Офис',
};

/**
 * Workplace Icon+Text (`.card-workplace-badge`) used inside KanbanCard and VacancyModal.
 */
export const WorkplaceText = forwardRef<HTMLSpanElement, WorkplaceTextProps>(
  function WorkplaceText(
    { workplace, label, children, className, ...rest },
    ref
  ) {
    const IconComponent =
      workplace === 'remote'
        ? Laptop
        : workplace === 'hybrid'
          ? Layers
          : Building;

    const tone: IconTextTone =
      workplace === 'remote'
        ? 'workplace-remote'
        : workplace === 'hybrid'
          ? 'workplace-hybrid'
          : 'workplace-onsite';

    const displayLabel =
      children !== undefined
        ? children
        : label !== undefined
          ? label
          : WORKPLACE_DEFAULT_LABELS[workplace];

    return (
      <IconText
        ref={ref}
        icon={IconComponent}
        iconSize={11}
        tone={tone}
        className={className}
        {...rest}
      >
        {displayLabel}
      </IconText>
    );
  }
);

export interface LocationTextProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  readonly location?: React.ReactNode;
}

/**
 * Location Icon+Text (`.card-location` with `MapPin` icon) used inside KanbanCard.
 */
export const LocationText = forwardRef<HTMLSpanElement, LocationTextProps>(
  function LocationText({ location, children, className, ...rest }, ref) {
    return (
      <IconText
        ref={ref}
        icon={MapPin}
        iconSize={12}
        tone="muted"
        className={className}
        {...rest}
      >
        {children !== undefined ? children : location}
      </IconText>
    );
  }
);

export interface SalaryTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly amount?: React.ReactNode;
}

/**
 * Salary Icon+Text (`.card-salary-badge` with `Banknote` icon in green) used inside KanbanCard.
 */
export const SalaryText = forwardRef<HTMLSpanElement, SalaryTextProps>(
  function SalaryText({ amount, children, className, ...rest }, ref) {
    return (
      <IconText
        ref={ref}
        icon={Banknote}
        iconSize={12}
        tone="salary"
        className={className}
        {...rest}
      >
        {children !== undefined ? children : amount}
      </IconText>
    );
  }
);

export interface CompanyLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly company: React.ReactNode;
  readonly href?: string;
}

/**
 * Uppercase monospace Company Source Link (`.card-source-link`) with trailing `ExternalLink` icon.
 */
export const CompanyLink = forwardRef<HTMLAnchorElement, CompanyLinkProps>(
  function CompanyLink({ company, href, className, onClick, ...rest }, ref) {
    if (href === undefined || href === '') {
      return (
        <span className={cn(styles.companyLink, className)}>
          <span>{company}</span>
        </span>
      );
    }

    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(styles.companyLink, className)}
        onClick={onClick}
        {...rest}
      >
        <span>{company}</span>
        <ExternalLink size={10} aria-hidden="true" />
      </a>
    );
  }
);

export interface HistoryTextProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  readonly count: number;
  readonly hasComment?: boolean;
}

/**
 * History Counter + Comment Dot Indicator (`.card-history-indicator`) used in CardFooter.
 */
export const HistoryText = forwardRef<HTMLSpanElement, HistoryTextProps>(
  function HistoryText(
    { count, hasComment = false, className, ...rest },
    ref
  ) {
    return (
      <span
        ref={ref}
        className={cn(styles.historyText, className)}
        {...rest}
      >
        <History size={11} aria-hidden="true" />
        <span>{count}</span>
        {hasComment && <span className={styles.commentDot} />}
      </span>
    );
  }
);

export interface AiPendingTextProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  readonly label?: React.ReactNode;
}

/**
 * Spinning AI Analysis Queue Indicator (`.card-summary-pending`) used inside KanbanCard.
 */
export const AiPendingText = forwardRef<HTMLSpanElement, AiPendingTextProps>(
  function AiPendingText(
    { label = 'AI анализ в очереди...', children, className, ...rest },
    ref
  ) {
    return (
      <span ref={ref} className={cn(styles.aiPending, className)} {...rest}>
        <Loader2 size={12} className={styles.spinIcon} aria-hidden="true" />
        <span>{children !== undefined ? children : label}</span>
      </span>
    );
  }
);
