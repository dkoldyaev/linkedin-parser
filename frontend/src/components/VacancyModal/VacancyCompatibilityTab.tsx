import React from 'react';
import {
  AlertBanner,
  Button,
  EmptyState,
  Icon,
  Paragraph,
  ReportAccordion,
  SectionHeader,
  Text,
} from '@blueprint/ui-kit';
import { Shield } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import {
  buildCompatibilitySections,
  buildRecommendationsList,
  resolveCompatibilityDisplayScore,
  resolveCompatScoreTone,
  resolveSeniorityInfo,
} from './vacancyModalHelpers';
import type { CompatibilityAnalysis, Vacancy } from '../../types/models';
import { VacancyTabContent } from './VacancyTabContent';

export interface VacancyCompatibilityTabProps {
  vacancy: Vacancy;
  compatibility?: CompatibilityAnalysis | null;
  matchScore?: number;
  analyzingCompatibility?: boolean;
  loadingCompatibility?: boolean;
  compatError?: string | null;
  onRunCompatibility?: (hasExistingSections: boolean) => void;
}

export function VacancyCompatibilityTab({
  vacancy,
  compatibility,
  matchScore,
  analyzingCompatibility,
  loadingCompatibility,
  compatError,
  onRunCompatibility,
}: VacancyCompatibilityTabProps): React.ReactElement {
  const { t } = useTranslation();

  const isCvOutdated = Boolean(compatibility?.is_outdated);
  const cvOutdatedMessage = t('vacancyModal.compat_outdated', {
    revision: compatibility?.cv_revision || '',
  });

  const compatibilitySections = buildCompatibilitySections(compatibility, t);
  const recommendations = buildRecommendationsList(compatibility);
  const compatibilityScore = resolveCompatibilityDisplayScore(compatibility, matchScore);
  const compatibilityScoreTone = resolveCompatScoreTone(compatibilityScore);
  const seniority = resolveSeniorityInfo(compatibility, t);

  const emptyCompatibilityDescription = vacancy.description
    ? t('vacancyModal.empty_compat_prompt')
    : t('vacancyModal.compat_no_description');

  const isLoading = Boolean(analyzingCompatibility || loadingCompatibility);

  return (
    <VacancyTabContent>
      {isCvOutdated && (
        <AlertBanner tone="warning">{cvOutdatedMessage}</AlertBanner>
      )}

      {compatError && (
        <AlertBanner tone="danger">{compatError}</AlertBanner>
      )}

      {compatibility?.summary && (
        <div style={{ padding: 12, backgroundColor: 'var(--surface-subtle, #f8fafc)', borderRadius: 6 }}>
          <Paragraph size="sm">{compatibility.summary}</Paragraph>
          {seniority.comment && (
            <div style={{ marginTop: 8 }}>
              <Paragraph size="sm">
                {t('vacancyModal.compat_seniority')}{' '}
                <Text as="span" weight="bold" tone={seniority.statusTone}>
                  {seniority.statusLabel}
                </Text>{' '}
                — {seniority.comment}
              </Paragraph>
            </div>
          )}
        </div>
      )}

      {compatibilitySections.length > 0 ? (
        <ReportAccordion
          title={t('vacancyModal.tab_cv_compatibility')}
          scoreLabel={compatibilityScore != null ? `${Math.round(compatibilityScore)}%` : undefined}
          scoreTone={compatibilityScoreTone}
          onAction={onRunCompatibility ? () => onRunCompatibility(true) : undefined}
          actionLabel={t('vacancyModal.compat_reanalyze')}
          actionLoading={isLoading}
          defaultActionLabel={t('common.confirm')}
          sections={compatibilitySections as any}
        />
      ) : (
        <EmptyState
          title={t('vacancyModal.compat_title')}
          description={emptyCompatibilityDescription}
          action={
            onRunCompatibility ? (
              <Button
                variant="primary"
                onClick={() => onRunCompatibility(false)}
                loading={isLoading}
                startIcon={<Icon icon={Shield} size="xs" />}
              >
                {t('vacancyModal.compat_compare')}
              </Button>
            ) : undefined
          }
        />
      )}

      {recommendations && recommendations.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <SectionHeader title={t('vacancyModal.compat_recommendations')} tone="accent" />
          <div style={{ paddingTop: 8 }}>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recommendations.map((rec, i) => (
                <li key={i}>
                  <Text variant="body-sm" tone="secondary">
                    {rec}
                  </Text>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </VacancyTabContent>
  );
}
