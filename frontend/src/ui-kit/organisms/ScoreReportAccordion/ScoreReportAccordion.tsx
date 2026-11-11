import React, { forwardRef } from 'react';
import { RefreshCw, Shield } from 'lucide-react';
import { Button, Icon, MatchBadge, SeverityBadge } from '../../atoms';
import { AlertBanner, SectionHeader, Accordion, type AccordionItem } from '../../molecules';
import { cn } from '../../utils';
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
            <SeverityBadge severity={sev} />
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
          <SeverityBadge severity="critical" />
        </span>
      ),
      content: item.reason,
      actionLabel: 'Детали',
    }));

    return (
      <div ref={ref} className={cn(styles.report, className)} {...rest}>
        {/* Header composed of SectionHeader, MatchBadge, and Button */}
        <SectionHeader
          title="Совместимость с резюме"
          icon={Shield}
          iconTone="accent"
          badge={roundedScore !== undefined && <MatchBadge score={roundedScore} />}
          divider
          accessory={
            onReanalyze && (
              <Button
                size="sm"
                variant="secondary"
                loading={analyzing}
                onClick={onReanalyze}
                startIcon={<Icon icon={RefreshCw} size="xs" />}
              >
                Переанализировать
              </Button>
            )
          }
        />

        {/* Error notice */}
        {error && (
          <AlertBanner tone="danger" className={styles.notice}>
            {error}
          </AlertBanner>
        )}

        {/* Outdated notice */}
        {isOutdated && (
          <AlertBanner tone="warning" className={styles.notice}>
            Резюме обновлено{cvRevision ? ` (ревизия ${cvRevision})` : ''}. Рекомендуется повторный скоринг.
          </AlertBanner>
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
              tone="mint"
              divider
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
              tone="warning"
              divider
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
              tone="danger"
              divider
            />
            <Accordion items={criticalAccordionItems} />
          </div>
        )}
      </div>
    );
  }
);
