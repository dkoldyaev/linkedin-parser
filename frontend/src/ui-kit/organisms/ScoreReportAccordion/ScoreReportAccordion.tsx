import React, { forwardRef } from 'react';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { cn } from '../../utils';
import { SectionHeader } from '../../molecules/SectionHeader';
import { Accordion, type AccordionItem } from '../../molecules/Accordion';
import styles from './ScoreReportAccordion.module.css';

export interface RequirementItem {
  readonly id: string;
  readonly requirement: string;
  readonly evidence?: string;
  readonly reason?: string;
  readonly severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SeniorityAssessment {
  readonly status: 'matched' | 'partially_matched' | 'mismatched' | 'unclear';
  readonly label: string;
  readonly comment: string;
}

export interface ScoreReportAccordionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly score?: number;
  readonly summary?: string;
  readonly seniorityAssessment?: SeniorityAssessment;
  readonly matchedRequirements?: readonly RequirementItem[];
  readonly missingRequirements?: readonly RequirementItem[];
  readonly criticalGaps?: readonly RequirementItem[];
  readonly isOutdated?: boolean;
  readonly cvRevision?: number | string;
  readonly onReanalyze?: () => void;
  readonly analyzing?: boolean;
  readonly error?: string;
}

/**
 * ScoreReportAccordion organism.
 * Composes CV scoring compatibility report, including summary, seniority assessment,
 * and multiple independent Accordions for matched, missing, and critical requirements,
 * separated by SectionHeaders.
 */
export const ScoreReportAccordion = forwardRef<HTMLDivElement, ScoreReportAccordionProps>(
  function ScoreReportAccordion(
    {
      score,
      summary,
      seniorityAssessment,
      matchedRequirements = [],
      missingRequirements = [],
      criticalGaps = [],
      isOutdated = false,
      cvRevision,
      onReanalyze,
      analyzing = false,
      error,
      className,
      ...rest
    },
    ref
  ) {
    const roundedScore = score !== undefined ? Math.round(score) : undefined;
    const scoreClass =
      roundedScore !== undefined
        ? roundedScore >= 70
          ? styles.scoreHigh
          : roundedScore >= 45
            ? styles.scoreMedium
            : styles.scoreLow
        : undefined;

    const matchedAccordionItems: readonly AccordionItem[] = matchedRequirements.map((item) => ({
      id: item.id,
      title: item.requirement,
      content: item.evidence,
      actionLabel: 'Обоснование',
    }));

    const missingAccordionItems: readonly AccordionItem[] = missingRequirements.map((item) => {
      const sev = item.severity ?? 'medium';
      return {
        id: item.id,
        title: (
          <span className={styles.requirementTitle}>
            <span>{item.requirement}</span>
            <span
              className={cn(
                styles.severityBadge,
                sev === 'low' && styles.sevLow,
                sev === 'medium' && styles.sevMedium,
                sev === 'high' && styles.sevHigh,
                sev === 'critical' && styles.sevCritical
              )}
            >
              {sev}
            </span>
          </span>
        ),
        content: item.reason,
        actionLabel: 'Детали',
      };
    });

    const criticalAccordionItems: readonly AccordionItem[] = criticalGaps.map((item) => ({
      id: item.id,
      title: (
        <span className={styles.requirementTitle}>
          <span>{item.requirement}</span>
          <span className={cn(styles.severityBadge, styles.sevCritical)}>critical</span>
        </span>
      ),
      content: item.reason,
      actionLabel: 'Детали',
    }));

    return (
      <div ref={ref} className={cn(styles.report, className)} {...rest}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Shield size={18} aria-hidden />
            <span>Совместимость с резюме</span>
            {roundedScore !== undefined && (
              <span className={cn(styles.scoreBadge, scoreClass)}>
                {roundedScore}%
              </span>
            )}
          </div>

          {onReanalyze && (
            <div className={styles.actionsGroup}>
              <button
                type="button"
                className={styles.reanalyzeBtn}
                onClick={onReanalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <Loader2 size={13} className={styles.spin} aria-hidden />
                ) : (
                  <RefreshCw size={13} aria-hidden />
                )}
                <span>Переанализировать</span>
              </button>
            </div>
          )}
        </div>

        {/* Error notice */}
        {error && (
          <div className={cn(styles.notice, styles.noticeError)}>
            <AlertCircle size={14} aria-hidden />
            <span>{error}</span>
          </div>
        )}

        {/* Outdated notice */}
        {isOutdated && (
          <div className={cn(styles.notice, styles.noticeOutdated)}>
            <AlertCircle size={14} aria-hidden />
            <span>
              Резюме обновлено{cvRevision ? ` (ревизия ${cvRevision})` : ''}. Рекомендуется повторный скоринг.
            </span>
          </div>
        )}

        {/* Summary */}
        {summary && <p className={styles.summary}>{summary}</p>}

        {/* Seniority Assessment */}
        {seniorityAssessment && (
          <div className={styles.seniority}>
            <span>Грейд / Опыт: </span>
            <strong>{seniorityAssessment.label}</strong> — {seniorityAssessment.comment}
          </div>
        )}

        {/* Matched Requirements Group: SectionHeader + Accordion */}
        {matchedAccordionItems.length > 0 && (
          <div className={styles.sectionGroup}>
            <SectionHeader
              title={`СОВПАДЕНИЯ [${matchedAccordionItems.length}]`}
              variant="mono"
              className={styles.headerMatched}
            />
            <Accordion items={matchedAccordionItems} />
          </div>
        )}

        {/* Missing Requirements Group: SectionHeader + Accordion */}
        {missingAccordionItems.length > 0 && (
          <div className={styles.sectionGroup}>
            <SectionHeader
              title={`ПРОПУСКИ [${missingAccordionItems.length}]`}
              variant="mono"
              className={styles.headerMissing}
            />
            <Accordion items={missingAccordionItems} />
          </div>
        )}

        {/* Critical Gaps Group: SectionHeader + Accordion */}
        {criticalAccordionItems.length > 0 && (
          <div className={styles.sectionGroup}>
            <SectionHeader
              title={`КРИТИЧЕСКИЕ РАСХОЖДЕНИЯ [${criticalAccordionItems.length}]`}
              variant="mono"
              className={styles.headerCritical}
            />
            <Accordion items={criticalAccordionItems} />
          </div>
        )}
      </div>
    );
  }
);
