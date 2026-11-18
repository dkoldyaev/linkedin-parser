import React from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import {
  ReportAccordion,
  AlertBanner,
  EmptyState,
  Badge,
  Text,
  Button,
  Icon,
} from '@blueprint/ui-kit';
import { useTranslation } from '../../i18n/I18nContext';

export default function VacancyCompatibilitySection({
  compatibility,
  onRunAnalysis,
  analyzing = false,
  loading = false,
  hasDescription = true,
  error = null,
}) {
  const { t } = useTranslation();

  if (!compatibility && !analyzing && !loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
        {error && <AlertBanner tone="danger" title={error} />}
        <EmptyState
          title={t('vacancyModal.compat_title')}
          description={hasDescription ? "Нажмите для запуска сопоставления резюме с требованиями вакансии." : t('vacancyModal.compat_no_description')}
          action={
            <Button
              variant="primary"
              onClick={() => onRunAnalysis(false)}
              disabled={!hasDescription}
              startIcon={<Icon icon={Shield} size="xs" />}
            >
              {t('vacancyModal.compat_compare')}
            </Button>
          }
        />
      </div>
    );
  }

  const displayScore = compatibility
    ? (compatibility.calculated_score != null ? compatibility.calculated_score : compatibility.overall_score)
    : null;

  const scoreTone =
    displayScore == null
      ? 'neutral'
      : displayScore >= 70
        ? 'success'
        : displayScore >= 45
          ? 'warning'
          : 'danger';

  // Build section groups for ReportAccordion
  const sections = [];

  if (compatibility?.matched_requirements?.length > 0) {
    sections.push({
      id: 'matched',
      title: t('vacancyModal.compat_matched', { count: compatibility.matched_requirements.length }),
      tone: 'success',
      items: compatibility.matched_requirements.map((m, idx) => ({
        id: `m_${idx}`,
        title: m.requirement,
        detail: m.evidence,
        badgeText: t('vacancyModal.compat_evidence'),
        badgeTone: 'success',
      })),
    });
  }

  if (compatibility?.missing_requirements?.length > 0) {
    sections.push({
      id: 'missing',
      title: t('vacancyModal.compat_missing', { count: compatibility.missing_requirements.length }),
      tone: 'warning',
      items: compatibility.missing_requirements.map((m, idx) => {
        const sev = (m.severity || 'medium').toLowerCase();
        const sevTone = sev === 'critical' ? 'danger' : sev === 'high' ? 'warning' : 'neutral';
        return {
          id: `missing_${idx}`,
          title: m.requirement,
          detail: m.reason,
          badgeText: sev,
          badgeTone: sevTone,
        };
      }),
    });
  }

  if (compatibility?.critical_gaps?.length > 0) {
    sections.push({
      id: 'gaps',
      title: t('vacancyModal.compat_gaps'),
      tone: 'danger',
      items: compatibility.critical_gaps.map((g, idx) => ({
        id: `gap_${idx}`,
        title: g.gap || g,
        detail: g.impact || g.reason,
        badgeText: 'critical',
        badgeTone: 'danger',
      })),
      defaultExpandedIds: compatibility.critical_gaps.map((_, idx) => `gap_${idx}`),
    });
  }

  if (compatibility?.recommendations?.length > 0) {
    sections.push({
      id: 'recs',
      title: t('vacancyModal.compat_recommendations'),
      tone: 'info',
      items: compatibility.recommendations.map((r, idx) => ({
        id: `rec_${idx}`,
        title: typeof r === 'string' ? r : r.text || r.title,
        detail: r.details,
      })),
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
      {error && <AlertBanner tone="danger" title={error} />}

      {compatibility?.is_outdated && (
        <AlertBanner
          tone="warning"
          title={t('vacancyModal.compat_outdated', { revision: compatibility.cv_revision })}
        />
      )}

      {compatibility?.seniority_assessment && (() => {
        const status = compatibility.seniority_assessment.status;
        const statusTone = status === 'matched' ? 'success' : status === 'partially_matched' ? 'warning' : status === 'mismatched' ? 'danger' : 'neutral';
        const statusLabel = t(`vacancyModal.compat_seniority_status.${status}`) || status;
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ui-space-2)',
            padding: 'var(--ui-space-2-5) var(--ui-space-3)',
            background: 'var(--ui-bg-subtle)',
            border: '1px solid var(--ui-border-subtle)',
          }}>
            <Text variant="caption" tone="secondary">
              {t('vacancyModal.compat_seniority')}
            </Text>
            <Badge variant="solid" size="xs" tone={statusTone}>
              {statusLabel}
            </Badge>
            <Text variant="caption" tone="secondary">
              — {compatibility.seniority_assessment.comment}
            </Text>
          </div>
        );
      })()}

      <ReportAccordion
        title={t('vacancyModal.compat_title')}
        scoreLabel={displayScore != null ? `${Math.round(displayScore)}%` : undefined}
        scoreTone={scoreTone}
        summary={compatibility?.summary}
        sections={sections}
        onAction={() => onRunAnalysis(Boolean(compatibility))}
        actionLabel={t(compatibility ? 'vacancyModal.compat_reanalyze' : 'vacancyModal.compat_compare')}
        actionLoading={analyzing || loading}
      />
    </div>
  );
}
