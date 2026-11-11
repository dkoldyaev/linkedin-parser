import React, { forwardRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react';
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
 * ScoreReportAccordion molecule.
 * Displays CV scoring compatibility report with matched requirements,
 * missing requirements, and critical gaps in a collapsible accordion structure.
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
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

    const toggleItem = (id: string) => {
      setExpandedIds((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    };

    const roundedScore = score !== undefined ? Math.round(score) : undefined;
    const scoreClass =
      roundedScore !== undefined
        ? roundedScore >= 70
          ? styles.scoreHigh
          : roundedScore >= 45
            ? styles.scoreMedium
            : styles.scoreLow
        : undefined;

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
                className={styles.toggleBtn}
                onClick={onReanalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <Loader2 size={13} className="spin" aria-hidden />
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

        {/* Matched Requirements */}
        {matchedRequirements.length > 0 && (
          <div className={styles.group}>
            <div className={cn(styles.groupTitle, styles.groupMatched)}>
              Совпадения [{matchedRequirements.length}]
            </div>
            {matchedRequirements.map((item) => {
              const isExpanded = Boolean(expandedIds[item.id]);

              return (
                <div key={item.id} className={styles.row}>
                  <div
                    className={styles.rowHeader}
                    onClick={() => toggleItem(item.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <div className={styles.rowTitle}>
                      <span>•</span>
                      <span>{item.requirement}</span>
                    </div>
                    {item.evidence && (
                      <span className={styles.toggleBtn}>
                        <span>Обоснование</span>
                        {isExpanded ? (
                          <ChevronUp size={12} aria-hidden />
                        ) : (
                          <ChevronDown size={12} aria-hidden />
                        )}
                      </span>
                    )}
                  </div>
                  {isExpanded && item.evidence && (
                    <div className={styles.evidence}>{item.evidence}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Missing Requirements */}
        {missingRequirements.length > 0 && (
          <div className={styles.group}>
            <div className={cn(styles.groupTitle, styles.groupMissing)}>
              Пропуски [{missingRequirements.length}]
            </div>
            {missingRequirements.map((item) => {
              const isExpanded = Boolean(expandedIds[item.id]);
              const sev = item.severity ?? 'medium';

              return (
                <div key={item.id} className={styles.row}>
                  <div
                    className={styles.rowHeader}
                    onClick={() => toggleItem(item.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <div className={styles.rowTitle}>
                      <span>•</span>
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
                    </div>
                    {item.reason && (
                      <span className={styles.toggleBtn}>
                        <span>Детали</span>
                        {isExpanded ? (
                          <ChevronUp size={12} aria-hidden />
                        ) : (
                          <ChevronDown size={12} aria-hidden />
                        )}
                      </span>
                    )}
                  </div>
                  {isExpanded && item.reason && (
                    <div className={styles.reason}>{item.reason}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Critical Gaps */}
        {criticalGaps.length > 0 && (
          <div className={styles.group}>
            <div className={cn(styles.groupTitle, styles.groupCritical)}>
              Критические расхождения [{criticalGaps.length}]
            </div>
            {criticalGaps.map((item) => {
              const isExpanded = Boolean(expandedIds[item.id]);

              return (
                <div key={item.id} className={styles.row}>
                  <div
                    className={styles.rowHeader}
                    onClick={() => toggleItem(item.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <div className={styles.rowTitle}>
                      <span>•</span>
                      <span>{item.requirement}</span>
                      <span className={cn(styles.severityBadge, styles.sevCritical)}>
                        critical
                      </span>
                    </div>
                    {item.reason && (
                      <span className={styles.toggleBtn}>
                        <span>Детали</span>
                        {isExpanded ? (
                          <ChevronUp size={12} aria-hidden />
                        ) : (
                          <ChevronDown size={12} aria-hidden />
                        )}
                      </span>
                    )}
                  </div>
                  {isExpanded && item.reason && (
                    <div className={cn(styles.reason, styles.criticalReason)}>
                      {item.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
